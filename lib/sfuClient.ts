import type { Socket } from "socket.io-client";

type TrackKind = "audio" | "video" | "screen";

type SfuJoinResult = {
  requestId?: string;
  roomId: string;
  peers: string[];
  producers: Array<{ producerId: string; userId: string; kind: TrackKind }>;
};

type SfuTransportCreated = {
  requestId?: string;
  roomId: string;
  direction: "send" | "recv";
  transport: {
    id: string;
    iceParameters: any;
    iceCandidates: any[];
    dtlsParameters: any;
  };
};

const nextRequestId = () =>
  `sfu_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const emitWithSingleResponse = <T = any>(
  socket: Socket,
  emitEvent: string,
  payload: Record<string, any> | undefined,
  responseEvent: string,
  timeoutMs = 4000,
): Promise<T> =>
  new Promise((resolve, reject) => {
    const requestId = nextRequestId();
    const timer = window.setTimeout(() => {
      socket.off(responseEvent, onResponse);
      reject(new Error(`Timeout waiting for ${responseEvent}`));
    }, timeoutMs);
    const onResponse = (data: T) => {
      const candidate = data as { requestId?: string } | undefined;
      if (candidate?.requestId && candidate.requestId !== requestId) return;
      window.clearTimeout(timer);
      socket.off(responseEvent, onResponse);
      resolve(data);
    };
    socket.on(responseEvent, onResponse);
    socket.emit(emitEvent, {
      ...(payload ?? {}),
      requestId,
    });
  });

async function loadMediasoupClientModule(): Promise<any | null> {
  try {
    const dynamicImport = new Function("return import('mediasoup-client')");
    return await dynamicImport();
  } catch {
    return null;
  }
}

export class SfuClientSession {
  private device: any;
  private sendTransport: any;
  private recvTransport: any;
  private producerIdsByKind = new Map<TrackKind, string>();
  private consumedProducerIds = new Set<string>();
  private consumerByProducerId = new Map<string, any>();
  private producerOwnerById = new Map<string, string>();
  private producerKindById = new Map<string, TrackKind>();
  private remoteStreamsByUser = new Map<string, MediaStream>();
  private cleanupFns: Array<() => void> = [];
  private readonly debugEnabled =
    typeof window !== "undefined" && window.localStorage.getItem("fd.sfu.debug") === "1";

  constructor(
    private readonly socket: Socket,
    private readonly channelId: string,
    private readonly onRemoteStream: (userId: string, stream: MediaStream | null) => void,
  ) {}

  static async create(
    socket: Socket,
    channelId: string,
    onRemoteStream: (userId: string, stream: MediaStream | null) => void,
  ) {
    const mediasoupClient = await loadMediasoupClientModule();
    if (!mediasoupClient?.Device) return null;
    const session = new SfuClientSession(socket, channelId, onRemoteStream);
    const ok = await session.init(mediasoupClient.Device);
    return ok ? session : null;
  }

  async produceTrack(kind: TrackKind, track: MediaStreamTrack | null) {
    if (!this.sendTransport) return;
    const producerId = this.producerIdsByKind.get(kind);
    if (!track) {
      if (producerId) {
        this.socket.emit("sfu.close-producer", { channelId: this.channelId, producerId });
        this.producerIdsByKind.delete(kind);
        this.debug("close producer", { kind, producerId });
      }
      return;
    }
    if (producerId) return;
    const producer = await this.sendTransport.produce({
      track,
      appData: { track: kind },
    });
    this.producerIdsByKind.set(kind, producer.id);
    this.debug("produce track", { kind, producerId: producer.id });
  }

  close() {
    this.debug("close session");
    for (const fn of this.cleanupFns) fn();
    this.cleanupFns = [];
    this.consumerByProducerId.forEach((consumer) => consumer?.close?.());
    this.consumerByProducerId.clear();
    this.producerOwnerById.clear();
    this.producerKindById.clear();
    this.consumedProducerIds.clear();
    this.remoteStreamsByUser.forEach((stream, userId) => {
      stream.getTracks().forEach((track) => track.stop());
      this.onRemoteStream(userId, null);
    });
    this.remoteStreamsByUser.clear();
    if (this.sendTransport) this.sendTransport.close();
    if (this.recvTransport) this.recvTransport.close();
    this.socket.emit("sfu.leave", { channelId: this.channelId });
  }

  private async init(DeviceCtor: any) {
    try {
      const capabilities = await emitWithSingleResponse<{
        routerRtpCapabilities: any;
        runtime?: { mediasoupAvailable?: boolean };
      }>(this.socket, "sfu.get-capabilities", {}, "sfu.capabilities", 3000);

      if (!capabilities?.runtime?.mediasoupAvailable) return false;
      this.debug("capabilities", capabilities);

      const joined = await emitWithSingleResponse<SfuJoinResult>(
        this.socket,
        "sfu.join",
        { channelId: this.channelId },
        "sfu.joined",
        3000,
      );
      if (!joined) return false;
      this.debug("joined room", joined);

      this.device = new DeviceCtor();
      await this.device.load({ routerRtpCapabilities: capabilities.routerRtpCapabilities });

      await this.createSendTransport();
      await this.createRecvTransport();

      for (const producer of joined.producers || []) {
        await this.consumeProducer(producer.producerId, producer.userId);
      }

      const onNewProducer = async (payload: {
        roomId: string;
        userId: string;
        producerId: string;
        kind: TrackKind;
      }) => {
        if (payload.roomId !== this.channelId) return;
        await this.consumeProducer(payload.producerId, payload.userId);
      };
      const onProducerClosed = (payload: { roomId: string; producerId: string }) => {
        if (payload.roomId !== this.channelId) return;
        const producerId = payload.producerId;
        const consumer = this.consumerByProducerId.get(producerId);
        const ownerUserId = this.producerOwnerById.get(producerId);
        const kind = this.producerKindById.get(producerId);

        if (consumer) {
          const stream = ownerUserId ? this.remoteStreamsByUser.get(ownerUserId) : null;
          if (stream) {
            const targetTrack = stream
              .getTracks()
              .find((track) => track.id === consumer.track?.id || track.kind === (kind === "audio" ? "audio" : "video"));
            if (targetTrack) {
              stream.removeTrack(targetTrack);
              targetTrack.stop();
            }
            if (stream.getTracks().length === 0 && ownerUserId) {
              this.remoteStreamsByUser.delete(ownerUserId);
              this.onRemoteStream(ownerUserId, null);
            } else if (ownerUserId) {
              this.onRemoteStream(ownerUserId, stream);
            }
          }
          consumer.close?.();
        }

        this.consumerByProducerId.delete(producerId);
        this.producerOwnerById.delete(producerId);
        this.producerKindById.delete(producerId);
        this.consumedProducerIds.delete(producerId);
      };
      const onPeerLeft = (payload: { roomId: string; userId: string }) => {
        if (payload.roomId !== this.channelId) return;
        const stream = this.remoteStreamsByUser.get(payload.userId);
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          this.remoteStreamsByUser.delete(payload.userId);
        }
        this.onRemoteStream(payload.userId, null);
      };
      this.socket.on("sfu.new-producer", onNewProducer);
      this.socket.on("sfu.producer-closed", onProducerClosed);
      this.socket.on("sfu.peer-left", onPeerLeft);
      const onSfuError = (payload: any) => this.debug("sfu.error", payload);
      this.socket.on("sfu.error", onSfuError);
      this.cleanupFns.push(() => {
        this.socket.off("sfu.new-producer", onNewProducer);
        this.socket.off("sfu.producer-closed", onProducerClosed);
        this.socket.off("sfu.peer-left", onPeerLeft);
        this.socket.off("sfu.error", onSfuError);
      });
      return true;
    } catch {
      return false;
    }
  }

  private async createSendTransport() {
    const created = await emitWithSingleResponse<SfuTransportCreated>(
      this.socket,
      "sfu.create-transport",
      { channelId: this.channelId, direction: "send" },
      "sfu.transport-created",
      3000,
    );
    this.sendTransport = this.device.createSendTransport(created.transport);
    this.sendTransport.on("connect", ({ dtlsParameters }: any, callback: () => void, errback: (error: Error) => void) => {
      emitWithSingleResponse(
        this.socket,
        "sfu.connect-transport",
        { channelId: this.channelId, transportId: created.transport.id, dtlsParameters },
        "sfu.transport-connected",
      )
        .then(() => callback())
        .catch((error) => errback(error as Error));
    });
    this.sendTransport.on("produce", (params: any, callback: (data: { id: string }) => void, errback: (error: Error) => void) => {
      const kind = (params?.appData?.track as TrackKind | undefined) || (params.kind as TrackKind);
      emitWithSingleResponse<{ roomId: string; producerId: string }>(
        this.socket,
        "sfu.produce",
        {
          channelId: this.channelId,
          transportId: created.transport.id,
          kind,
          rtpParameters: params.rtpParameters,
          appData: params.appData,
        },
        "sfu.produced",
      )
        .then((result) => callback({ id: result.producerId }))
        .catch((error) => errback(error as Error));
    });
  }

  private async createRecvTransport() {
    const created = await emitWithSingleResponse<SfuTransportCreated>(
      this.socket,
      "sfu.create-transport",
      { channelId: this.channelId, direction: "recv" },
      "sfu.transport-created",
      3000,
    );
    this.recvTransport = this.device.createRecvTransport(created.transport);
    this.recvTransport.on("connect", ({ dtlsParameters }: any, callback: () => void, errback: (error: Error) => void) => {
      emitWithSingleResponse(
        this.socket,
        "sfu.connect-transport",
        { channelId: this.channelId, transportId: created.transport.id, dtlsParameters },
        "sfu.transport-connected",
      )
        .then(() => callback())
        .catch((error) => errback(error as Error));
    });
  }

  private async consumeProducer(producerId: string, userId: string) {
    if (!this.recvTransport || !this.device) return;
    if (this.consumedProducerIds.has(producerId)) return;
    const result = await emitWithSingleResponse<{ roomId: string; consumer: any }>(
      this.socket,
      "sfu.consume",
      {
        channelId: this.channelId,
        transportId: this.recvTransport.id,
        producerId,
        rtpCapabilities: this.device.rtpCapabilities,
      },
      "sfu.consumed",
      3000,
    );
    const data = result?.consumer;
    if (!data) return;
    const consumer = await this.recvTransport.consume({
      id: data.id,
      producerId: data.producerId,
      kind: data.kind === "audio" ? "audio" : "video",
      rtpParameters: data.rtpParameters,
    });
    this.consumedProducerIds.add(producerId);
    this.consumerByProducerId.set(producerId, consumer);
    this.producerOwnerById.set(producerId, userId);
    this.producerKindById.set(producerId, data.kind === "audio" ? "audio" : data.kind === "screen" ? "screen" : "video");
    let stream = this.remoteStreamsByUser.get(userId);
    if (!stream) {
      stream = new MediaStream();
      this.remoteStreamsByUser.set(userId, stream);
    }
    stream.addTrack(consumer.track);
    this.onRemoteStream(userId, stream);
    this.debug("consume producer", { producerId, userId, consumerId: data.id, kind: data.kind });
  }

  private debug(message: string, payload?: any) {
    if (!this.debugEnabled) return;
    // eslint-disable-next-line no-console
    console.log(`[SFU:${this.channelId}] ${message}`, payload ?? "");
  }
}
