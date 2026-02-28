import type { Socket } from "socket.io-client";

type SfuCapabilitiesPayload = {
  requestId?: string;
  routerRtpCapabilities: any;
  runtime?: { mediasoupAvailable?: boolean };
};

const nextRequestId = () =>
  `sfu_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const emitWithSingleResponse = <T = any>(
  socket: Socket,
  emitEvent: string,
  payload: Record<string, any> | undefined,
  responseEvent: string,
  timeoutMs = 2000,
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
    socket.emit(emitEvent, { ...(payload ?? {}), requestId });
  });

export async function probeSfuRuntime(socket: Socket) {
  try {
    const result = await emitWithSingleResponse<SfuCapabilitiesPayload>(
      socket,
      "sfu.get-capabilities",
      {},
      "sfu.capabilities",
      2000,
    );
    return {
      ok: true as const,
      mediasoupAvailable: !!result?.runtime?.mediasoupAvailable,
      routerRtpCapabilities: result?.routerRtpCapabilities,
    };
  } catch {
    return {
      ok: false as const,
      mediasoupAvailable: false,
      routerRtpCapabilities: null,
    };
  }
}

export async function joinSfuRoom(socket: Socket, channelId: string) {
  try {
    return await emitWithSingleResponse<{
      roomId: string;
      peers: string[];
      producers: Array<{ producerId: string; userId: string; kind: "audio" | "video" | "screen" }>;
    }>(socket, "sfu.join", { channelId }, "sfu.joined", 3000);
  } catch {
    return null;
  }
}

export function leaveSfuRoom(socket: Socket, channelId: string) {
  socket.emit("sfu.leave", { channelId });
}
