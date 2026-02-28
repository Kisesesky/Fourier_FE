// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/CallRoomPanel.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Headphones,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Plus,
  Square,
  Send,
  Users,
  Video,
  VideoOff,
  VolumeX,
  MessageSquare,
  UserX,
} from "lucide-react";
import { useChat } from "@/workspace/chat/_model/store";
import { getChatSocket } from "@/lib/socket";
import { probeSfuRuntime } from "@/lib/sfuBridge";
import { SfuClientSession } from "@/lib/sfuClient";
import { useToast } from "@/components/ui/Toast";

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-6 w-6 overflow-hidden rounded-full border border-border bg-subtle/80 text-[10px] font-semibold text-muted">
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center">{initials}</span>
      )}
    </div>
  );
}

export default function CallRoomPanel({
  channelId,
  channelName,
  variant = "bar",
}: {
  channelId: string;
  channelName?: string;
  variant?: "bar" | "panel";
}) {
  const { huddles, stopHuddle, toggleHuddleMute, users, me, messages, send } = useChat();
  const { show } = useToast();
  const h = huddles[channelId];
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const sfuClientRef = useRef<SfuClientSession | null>(null);
  const peerRefs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [cameraOn, setCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [panelTab, setPanelTab] = useState<"chat" | "participants">("participants");
  const [chatDraft, setChatDraft] = useState("");
  const [focusUserId, setFocusUserId] = useState<string | null>(null);
  const [gridMode, setGridMode] = useState(false);
  const [sideOpen, setSideOpen] = useState(true);
  const [audioPage, setAudioPage] = useState(1);
  const [videoPage, setVideoPage] = useState(1);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [mediaStateByUser, setMediaStateByUser] = useState<Record<string, { audio: boolean; video: boolean; screen: boolean }>>({});
  const [sfuAccess, setSfuAccess] = useState<{
    callRole: "host" | "speaker" | "listener";
    canProduce: boolean;
    canShareScreen: boolean;
    canUseVideo: boolean;
  } | null>(null);
  const [sfuState, setSfuState] = useState<{ probed: boolean; enabled: boolean }>({ probed: false, enabled: false });
  const [sfuLogs, setSfuLogs] = useState<string[]>([]);
  const [pendingHostAction, setPendingHostAction] = useState<{
    type: "force-mute" | "kick";
    targetUserId: string;
    name: string;
  } | null>(null);
  const sfuDebugEnabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("fd.sfu.debug") === "1";
  }, []);
  const socket = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getChatSocket(localStorage.getItem("accessToken"));
  }, []);

  const pushSfuLog = (message: string) => {
    if (!sfuDebugEnabled) return;
    const stamp = new Date().toLocaleTimeString("ko-KR", { hour12: false });
    setSfuLogs((prev) => {
      const next = [...prev, `${stamp} ${message}`];
      return next.length > 14 ? next.slice(next.length - 14) : next;
    });
  };

  const closePeer = (targetUserId: string) => {
    const peer = peerRefs.current.get(targetUserId);
    if (peer) {
      peer.onicecandidate = null;
      peer.ontrack = null;
      peer.close();
      peerRefs.current.delete(targetUserId);
    }
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[targetUserId];
      return next;
    });
  };

  const addLocalTracks = (peer: RTCPeerConnection) => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
  };

  const getOrCreateLocalStream = () => {
    if (!localStreamRef.current) {
      localStreamRef.current = new MediaStream();
    }
    return localStreamRef.current;
  };

  const emitMediaState = (track: "audio" | "video" | "screen", enabled: boolean) => {
    if (!socket) return;
    socket.emit("webrtc.media-state", {
      channelId,
      track,
      enabled,
    });
  };

  const syncSfuLocalTracks = useCallback(async () => {
    const session = sfuClientRef.current;
    if (!session) return;
    if (sfuAccess && !sfuAccess.canProduce) {
      await session.produceTrack("audio", null);
      await session.produceTrack("video", null);
      await session.produceTrack("screen", null);
      return;
    }
    const localStream = localStreamRef.current;
    const localAudioTrack = localStream?.getAudioTracks()[0] ?? null;
    const audioTrack = !h?.muted ? localAudioTrack : null;
    const videoTrack = cameraOn && !isScreenSharing ? cameraTrackRef.current : null;
    const screenTrack = isScreenSharing ? screenTrackRef.current : null;
    await session.produceTrack("audio", audioTrack);
    await session.produceTrack("video", videoTrack);
    await session.produceTrack("screen", screenTrack);
  }, [cameraOn, h?.mode, h?.muted, isScreenSharing, sfuAccess]);

  const replaceOutgoingVideoTrack = async (nextTrack: MediaStreamTrack | null) => {
    const peers = Array.from(peerRefs.current.values());
    await Promise.all(
      peers.map(async (peer) => {
        const sender = peer.getSenders().find((item) => item.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(nextTrack);
          return;
        }
        if (!nextTrack) return;
        const stream = getOrCreateLocalStream();
        peer.addTrack(nextTrack, stream);
      }),
    );
  };

  const ensurePeer = (targetUserId: string) => {
    let peer = peerRefs.current.get(targetUserId);
    if (peer) return peer;
    peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    addLocalTracks(peer);
    peer.onicecandidate = (event) => {
      if (!event.candidate || !socket) return;
      socket.emit("webrtc.ice-candidate", {
        channelId,
        targetUserId,
        candidate: event.candidate,
      });
    };
    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) return;
      setRemoteStreams((prev) => ({ ...prev, [targetUserId]: stream }));
    };
    peerRefs.current.set(targetUserId, peer);
    return peer;
  };

  const createOffer = async (targetUserId: string) => {
    if (!socket) return;
    const peer = ensurePeer(targetUserId);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit("webrtc.offer", {
      channelId,
      targetUserId,
      sdp: offer,
    });
  };

  useEffect(() => {
    if (!h?.active) return;
    if (!socket) return;
    let mounted = true;

    const boot = async () => {
      try {
        const wantVideo = h?.mode === "video";
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: wantVideo });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        const videoTrack = stream.getVideoTracks()[0] ?? null;
        cameraTrackRef.current = videoTrack;
        setCameraOn(!!videoTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch {
        localStreamRef.current = null;
        cameraTrackRef.current = null;
        setCameraOn(false);
      }

      if (!sfuState.enabled) {
        socket.emit("webrtc.join", {
          channelId,
          mode: h?.mode || "audio",
        });
      }
    };

    const onParticipants = (payload: { channelId: string; participants: string[] }) => {
      if (payload.channelId !== channelId) return;
      payload.participants
        .filter((uid) => uid !== me.id && me.id < uid)
        .forEach((uid) => {
          void createOffer(uid);
        });
    };

    const onUserJoined = (payload: { channelId: string; userId: string }) => {
      if (payload.channelId !== channelId || payload.userId === me.id) return;
      if (me.id < payload.userId) {
        void createOffer(payload.userId);
      }
    };

    const onOffer = async (payload: { channelId: string; fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      if (payload.channelId !== channelId || payload.fromUserId === me.id || !socket) return;
      const peer = ensurePeer(payload.fromUserId);
      await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("webrtc.answer", {
        channelId,
        targetUserId: payload.fromUserId,
        sdp: answer,
      });
    };

    const onAnswer = async (payload: { channelId: string; fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      if (payload.channelId !== channelId || payload.fromUserId === me.id) return;
      const peer = ensurePeer(payload.fromUserId);
      await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    };

    const onCandidate = async (payload: { channelId: string; fromUserId: string; candidate: RTCIceCandidateInit }) => {
      if (payload.channelId !== channelId || payload.fromUserId === me.id) return;
      const peer = ensurePeer(payload.fromUserId);
      await peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
    };

    const onUserLeft = (payload: { channelId: string; userId: string }) => {
      if (payload.channelId !== channelId || payload.userId === me.id) return;
      closePeer(payload.userId);
    };

    const onMediaState = (payload: {
      channelId: string;
      userId: string;
      track: "audio" | "video" | "screen";
      enabled: boolean;
    }) => {
      if (payload.channelId !== channelId) return;
      setMediaStateByUser((prev) => ({
        ...prev,
        [payload.userId]: {
          audio: prev[payload.userId]?.audio ?? true,
          video: prev[payload.userId]?.video ?? false,
          screen: prev[payload.userId]?.screen ?? false,
          [payload.track]: payload.enabled,
        },
      }));
    };

    if (!sfuState.enabled) {
      socket.on("webrtc.participants", onParticipants);
      socket.on("webrtc.user-joined", onUserJoined);
      socket.on("webrtc.offer", onOffer);
      socket.on("webrtc.answer", onAnswer);
      socket.on("webrtc.ice-candidate", onCandidate);
      socket.on("webrtc.user-left", onUserLeft);
    } else {
      peerRefs.current.forEach((peer) => peer.close());
      peerRefs.current.clear();
    }
    socket.on("webrtc.media-state", onMediaState);

    void boot();

    return () => {
      mounted = false;
      if (!sfuState.enabled) {
        socket.emit("webrtc.leave", { channelId });
        socket.off("webrtc.participants", onParticipants);
        socket.off("webrtc.user-joined", onUserJoined);
        socket.off("webrtc.offer", onOffer);
        socket.off("webrtc.answer", onAnswer);
        socket.off("webrtc.ice-candidate", onCandidate);
        socket.off("webrtc.user-left", onUserLeft);
      }
      socket.off("webrtc.media-state", onMediaState);
      peerRefs.current.forEach((peer) => peer.close());
      peerRefs.current.clear();
      setRemoteStreams({});
      setMediaStateByUser({});
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      cameraTrackRef.current = null;
      setIsScreenSharing(false);
    };
  }, [channelId, h?.active, h?.mode, me.id, sfuState.enabled, socket]);

  const toggleCamera = async () => {
    if (isScreenSharing) return;
    const next = !cameraOn;
    if (!next) {
      const track = cameraTrackRef.current;
      if (track) {
        track.stop();
        const stream = localStreamRef.current;
        if (stream) {
          stream.removeTrack(track);
        }
        cameraTrackRef.current = null;
      }
      await replaceOutgoingVideoTrack(null);
      if (sfuClientRef.current) {
        await sfuClientRef.current.produceTrack("video", null);
      }
      setCameraOn(false);
      emitMediaState("video", false);
      return;
    }
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const camTrack = camStream.getVideoTracks()[0];
      if (!camTrack) return;
      const stream = getOrCreateLocalStream();
      const prevTrack = cameraTrackRef.current;
      if (prevTrack) {
        stream.removeTrack(prevTrack);
        prevTrack.stop();
      }
      stream.addTrack(camTrack);
      cameraTrackRef.current = camTrack;
      await replaceOutgoingVideoTrack(camTrack);
      if (sfuClientRef.current) {
        await sfuClientRef.current.produceTrack("video", camTrack);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setCameraOn(true);
      emitMediaState("video", true);
    } catch {
      setCameraOn(false);
    }
  };

  const stopScreenShare = async () => {
    if (!isScreenSharing) return;
    const screenTrack = screenTrackRef.current;
    if (screenTrack) {
      screenTrack.onended = null;
      screenTrack.stop();
      screenTrackRef.current = null;
    }
    const stream = localStreamRef.current;
    if (stream && screenTrack) {
      stream.removeTrack(screenTrack);
    }
    if (cameraTrackRef.current && cameraOn) {
      await replaceOutgoingVideoTrack(cameraTrackRef.current);
      if (sfuClientRef.current) {
        await sfuClientRef.current.produceTrack("video", cameraTrackRef.current);
        await sfuClientRef.current.produceTrack("screen", null);
      }
    } else {
      await replaceOutgoingVideoTrack(null);
      if (sfuClientRef.current) {
        await sfuClientRef.current.produceTrack("video", null);
        await sfuClientRef.current.produceTrack("screen", null);
      }
    }
    setIsScreenSharing(false);
    emitMediaState("screen", false);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
      return;
    }
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) return;
      const stream = getOrCreateLocalStream();
      if (screenTrackRef.current) {
        stream.removeTrack(screenTrackRef.current);
        screenTrackRef.current.stop();
      }
      stream.addTrack(screenTrack);
      screenTrackRef.current = screenTrack;
      screenTrack.onended = () => {
        void stopScreenShare();
      };
      await replaceOutgoingVideoTrack(screenTrack);
      if (sfuClientRef.current) {
        await sfuClientRef.current.produceTrack("screen", screenTrack);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setIsScreenSharing(true);
      emitMediaState("screen", true);
    } catch {
      setIsScreenSharing(false);
    }
  };

  useEffect(() => {
    if (!h?.active) return;
    const participantIds = Array.from(new Set([me.id, ...(h.members || []), ...Object.keys(remoteStreams)]));
    if (!focusUserId || !participantIds.includes(focusUserId)) {
      setFocusUserId(participantIds[0] || me.id);
    }
  }, [focusUserId, h?.active, h?.members, me.id, remoteStreams]);

  useEffect(() => {
    if (!h?.active) return;
    setMediaStateByUser((prev) => ({
      ...prev,
      [me.id]: {
        audio: !h.muted,
        video: cameraOn,
        screen: isScreenSharing,
      },
    }));
  }, [cameraOn, h?.active, h?.muted, isScreenSharing, me.id]);

  useEffect(() => {
    if (!h?.active || !socket) return;
    let cancelled = false;
    const run = async () => {
      const probe = await probeSfuRuntime(socket);
      if (cancelled) return;
      setSfuState({ probed: true, enabled: !!probe.ok && !!probe.mediasoupAvailable });
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [channelId, h?.active, socket]);

  useEffect(() => {
    if (!h?.active || !socket || !sfuState.enabled) return;
    const onJoined = (payload: {
      roomId: string;
      mediaStates?: Record<string, { audio: boolean; video: boolean; screen: boolean }>;
      access?: {
        callRole: "host" | "speaker" | "listener";
        canProduce: boolean;
        canShareScreen: boolean;
        canUseVideo: boolean;
      };
    }) => {
      if (payload.roomId !== channelId) return;
      if (payload.mediaStates) {
        setMediaStateByUser((prev) => ({ ...prev, ...payload.mediaStates }));
        pushSfuLog(`joined snapshot: ${Object.keys(payload.mediaStates).length} peers`);
      }
      if (payload.access) {
        setSfuAccess(payload.access);
        pushSfuLog(`access role=${payload.access.callRole}`);
      }
    };
    const onMediaState = (payload: {
      roomId: string;
      userId: string;
      state: { audio: boolean; video: boolean; screen: boolean };
    }) => {
      if (payload.roomId !== channelId) return;
      setMediaStateByUser((prev) => ({ ...prev, [payload.userId]: payload.state }));
      pushSfuLog(
        `state ${payload.userId.slice(0, 8)} a:${payload.state.audio ? 1 : 0} v:${payload.state.video ? 1 : 0} s:${payload.state.screen ? 1 : 0}`,
      );
    };
    const onPeerLeft = (payload: { roomId: string; userId: string }) => {
      if (payload.roomId !== channelId) return;
      setMediaStateByUser((prev) => {
        const next = { ...prev };
        delete next[payload.userId];
        return next;
      });
      pushSfuLog(`left ${payload.userId.slice(0, 8)}`);
    };
    const onHostMuted = (payload: { roomId: string; targetUserId: string; byUserId: string }) => {
      if (payload.roomId !== channelId) return;
      pushSfuLog(`host-muted target=${payload.targetUserId.slice(0, 8)} by=${payload.byUserId.slice(0, 8)}`);
      if (payload.targetUserId !== me.id) return;
      const audioTrack = localStreamRef.current?.getAudioTracks()?.[0] ?? null;
      if (audioTrack) audioTrack.enabled = false;
      if (!h?.muted) {
        toggleHuddleMute(channelId);
      }
      void syncSfuLocalTracks();
      show({
        variant: "warning",
        title: "호스트가 음소거함",
        description: "통화에서 마이크가 강제로 꺼졌습니다.",
      });
    };
    const onKicked = (payload: { roomId: string; targetUserId: string; byUserId: string }) => {
      if (payload.roomId !== channelId || payload.targetUserId !== me.id) return;
      pushSfuLog(`kicked by ${payload.byUserId.slice(0, 8)}`);
      stopHuddle(channelId);
      show({
        variant: "warning",
        title: "통화에서 제외됨",
        description: "호스트가 통화에서 내보냈습니다.",
      });
    };
    socket.on("sfu.joined", onJoined);
    socket.on("sfu.media-state", onMediaState);
    socket.on("sfu.peer-left", onPeerLeft);
    socket.on("sfu.host-muted", onHostMuted);
    socket.on("sfu.kicked", onKicked);

    let closed = false;
    const run = async () => {
      const session = await SfuClientSession.create(socket, channelId, (userId, stream) => {
        setRemoteStreams((prev) => {
          if (!stream) {
            const next = { ...prev };
            delete next[userId];
            return next;
          }
          return { ...prev, [userId]: stream };
        });
      });
      if (closed || !session) return;
      sfuClientRef.current = session;
      pushSfuLog("session created");
      await syncSfuLocalTracks();
      pushSfuLog("local tracks produced");
    };
    void run();
    return () => {
      closed = true;
      socket.off("sfu.joined", onJoined);
      socket.off("sfu.media-state", onMediaState);
      socket.off("sfu.peer-left", onPeerLeft);
      socket.off("sfu.host-muted", onHostMuted);
      socket.off("sfu.kicked", onKicked);
      setSfuAccess(null);
      if (sfuClientRef.current) {
        sfuClientRef.current.close();
        sfuClientRef.current = null;
        pushSfuLog("session closed");
      }
    };
  }, [channelId, h?.active, h?.muted, me.id, sfuState.enabled, show, socket, sfuDebugEnabled, stopHuddle, syncSfuLocalTracks, toggleHuddleMute]);

  useEffect(() => {
    if (!h?.active || !sfuState.enabled) return;
    void syncSfuLocalTracks();
  }, [h?.active, sfuState.enabled, syncSfuLocalTracks]);

  const callMessages = useMemo(
    () =>
      messages
        .filter((message) => message.channelId === channelId && !message.parentId)
        .slice(-40),
    [channelId, messages],
  );
  const formatCallMessageTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });

  if (!h?.active) return null;

  const dur = h.startedAt ? Math.max(0, Math.floor((Date.now() - h.startedAt)/1000)) : 0;
  const mm = String(Math.floor(dur/60)).padStart(2,'0');
  const ss = String(dur%60).padStart(2,'0');
  const handleToggleMute = () => {
    if (sfuState.enabled && sfuAccess && !sfuAccess.canProduce) return;
    toggleHuddleMute(channelId);
    const audioTrack = localStreamRef.current?.getAudioTracks()[0] ?? null;
    if (audioTrack) {
      audioTrack.enabled = !!h.muted;
    }
    void syncSfuLocalTracks();
    emitMediaState("audio", !!h.muted);
  };
  const hostForceMute = (targetUserId: string) => {
    if (!socket) return;
    socket.emit("sfu.host-force-mute", { channelId, targetUserId });
  };
  const hostKick = (targetUserId: string) => {
    if (!socket) return;
    socket.emit("sfu.host-kick", { channelId, targetUserId });
  };
  const submitCallChat = async () => {
    const next = chatDraft.trim();
    if (!next) return;
    await send(next);
    setChatDraft("");
  };
  const handleDisconnectCall = () => {
    if (sfuClientRef.current) {
      sfuClientRef.current.close();
      sfuClientRef.current = null;
    } else if (socket) {
      socket.emit("webrtc.leave", { channelId });
    }
    stopHuddle(channelId);
  };

  if (variant === "panel") {
    const participantIds = Array.from(new Set([me.id, ...(h.members || []), ...Object.keys(remoteStreams)]));
    const modeLabel = h.mode === "video" ? "화상 채널" : "음성 채널";
    const participants = participantIds.map((id) => {
      const user = users[id];
      return {
        id,
        displayName: user?.displayName || user?.name || "사용자",
        avatarUrl: user?.avatarUrl,
        stream: id === me.id ? localStreamRef.current : remoteStreams[id],
        isMe: id === me.id,
      };
    });
    const mainUser = participants.find((p) => p.id === focusUserId) || participants[0];
    const sideUsers = participants.filter((p) => p.id !== mainUser?.id);
    const videoPageSize = 4;
    const audioPageSize = 4;
    const totalVideoPages = Math.max(1, Math.ceil(sideUsers.length / videoPageSize));
    const totalAudioPages = Math.max(1, Math.ceil(sideUsers.length / audioPageSize));
    const currentVideoPage = Math.min(videoPage, totalVideoPages);
    const currentAudioPage = Math.min(audioPage, totalAudioPages);
    const pagedVideoUsers = sideUsers.slice((currentVideoPage - 1) * videoPageSize, currentVideoPage * videoPageSize);
    const pagedAudioUsers = sideUsers.slice((currentAudioPage - 1) * audioPageSize, currentAudioPage * audioPageSize);

    const renderAvatarTile = (userId: string, mode: "main" | "grid" | "side" = "grid") => {
      const user = users[userId];
      const displayName = user?.displayName || user?.name || "사용자";
      const stream = userId === me.id ? localStreamRef.current : remoteStreams[userId];
      const avatarSize = mode === "main" ? "h-48 w-48" : mode === "side" ? "h-16 w-16" : "h-24 w-24";
      const mediaState = mediaStateByUser[userId] ?? { audio: true, video: !!stream, screen: false };
      return (
        <div key={userId} className="relative overflow-hidden rounded-xl bg-subtle/20 px-3 py-4 text-center">
          <div className={`mx-auto ${avatarSize} overflow-hidden rounded-full border border-border/70 bg-subtle/40`}>
            {stream && h.mode === "video" ? (
              <video
                autoPlay
                playsInline
                muted={userId === me.id}
                className="h-full w-full object-cover"
                ref={(el) => {
                  if (!el || !stream) return;
                  if (el.srcObject !== stream) el.srcObject = stream;
                }}
              />
            ) : user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-foreground">
                {displayName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-foreground">
            {displayName}
            {userId === me.id ? " (나)" : ""}
          </p>
          <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
            {!mediaState.audio && <MicOff size={10} />}
            {mediaState.screen && <Monitor size={10} />}
          </div>
        </div>
      );
    };

    return (
      <div className="h-full min-h-0 overflow-hidden bg-background">
        <video ref={localVideoRef} autoPlay muted playsInline className="hidden" />
        <div className={`grid h-full min-h-0 grid-cols-1 ${sideOpen ? "lg:grid-cols-[minmax(0,1fr)_312px] xl:grid-cols-[minmax(0,1fr)_344px]" : ""}`}>
          <div className="flex h-full min-h-0 flex-col px-2 pb-24 pt-2">
            <div className="mb-2 flex items-center justify-between border-b border-border/70 px-1 pb-2">
              <div className="flex items-center gap-2 text-sm text-foreground">
                {cameraOn ? <Video size={15} /> : <Mic size={15} />}
                <span className="font-semibold">{modeLabel}</span>
                <span className="text-xs text-muted">{(channelName || "채널")} · {mm}:{ss}</span>
                <span className="text-[10px] text-muted/80">
                  {sfuState.probed ? (sfuState.enabled ? "SFU" : "P2P") : "INIT"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {cameraOn && (
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-panel text-foreground hover:bg-subtle/60"
                    onClick={() => setGridMode((prev) => !prev)}
                    title={gridMode ? "메인+사이드 보기" : "그리드 보기"}
                  >
                    {gridMode ? <Square size={14} /> : <Grid3X3 size={14} />}
                  </button>
                )}
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-panel text-foreground hover:bg-subtle/60"
                  onClick={() => setSideOpen((prev) => !prev)}
                  title={sideOpen ? "패널 닫기" : "패널 열기"}
                >
                  {sideOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
              </div>
            </div>
            {cameraOn && gridMode ? (
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
                {participants.map((participant) => renderAvatarTile(participant.id, "grid"))}
              </div>
            ) : cameraOn ? (
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 xl:grid-cols-[minmax(0,1fr)_264px] 2xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-h-0">{mainUser ? renderAvatarTile(mainUser.id, "main") : null}</div>
                <div className="flex min-h-0 flex-col">
                  <div className="flex-1 space-y-2 overflow-y-auto pr-0.5">
                    {pagedVideoUsers.map((participant) => (
                      <button
                        key={participant.id}
                        type="button"
                        className="block w-full text-left"
                        onClick={() => setFocusUserId(participant.id)}
                      >
                        {renderAvatarTile(participant.id, "side")}
                      </button>
                    ))}
                  </div>
                  {totalVideoPages > 1 && (
                    <div className="mt-1.5 flex items-center justify-center gap-2.5 border-t border-border pt-2">
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-subtle/70 hover:bg-subtle"
                        onClick={() => setVideoPage((prev) => Math.max(1, prev - 1))}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-sm font-semibold">
                        {currentVideoPage} / {totalVideoPages}
                      </span>
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-subtle/70 hover:bg-subtle"
                        onClick={() => setVideoPage((prev) => Math.min(totalVideoPages, prev + 1))}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-subtle/20 p-3">
                <div className={`grid gap-2.5 ${participants.length === 1 ? "grid-cols-1 place-items-center" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"}`}>
                  {participants.map((participant) => (
                    <button
                      key={participant.id}
                      type="button"
                      className={`block w-full text-left ${participants.length === 1 ? "max-w-[520px]" : ""}`}
                      onClick={() => setFocusUserId(participant.id)}
                    >
                      <div className="relative overflow-hidden rounded-xl bg-panel/70 p-3 hover:bg-panel">
                        <div className="relative overflow-hidden rounded-lg border border-border/70 bg-black/60">
                          <div className={`${participants.length === 1 ? "aspect-[16/9] min-h-[250px]" : "aspect-[16/10] min-h-[160px]"}`}>
                            {participant.stream ? (
                              <video
                                autoPlay
                                playsInline
                                muted={participant.isMe}
                                className="h-full w-full object-cover"
                                ref={(el) => {
                                  if (!el || !participant.stream) return;
                                  if (el.srcObject !== participant.stream) el.srcObject = participant.stream;
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted">
                                <Mic size={22} />
                              </div>
                            )}
                          </div>
                          <div className="absolute left-2 top-2 h-9 w-9 overflow-hidden rounded-full border border-white/50 bg-subtle/50 shadow">
                            {users[participant.id]?.avatarUrl ? (
                              <img
                                src={users[participant.id]?.avatarUrl}
                                alt={participant.displayName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-white">
                                {participant.displayName.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="mt-2 truncate text-sm font-semibold text-foreground">
                          {participant.displayName}
                          {participant.isMe ? " (나)" : ""}
                        </p>
                        <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted">
                          {!(mediaStateByUser[participant.id]?.audio ?? true) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-500">
                              <MicOff size={10} /> 음소거
                            </span>
                          )}
                          {(mediaStateByUser[participant.id]?.screen ?? false) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2 py-0.5 text-indigo-500">
                              <Monitor size={10} /> 화면공유
                            </span>
                          )}
                          {(mediaStateByUser[participant.id]?.audio ?? true) && !(mediaStateByUser[participant.id]?.screen ?? false) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-500">
                              <Mic size={10} /> 통화 중
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {sideOpen && (
          <aside className="flex min-h-0 flex-col border-l border-border/70 bg-panel/40">
            <div className="flex items-center gap-1.5 border-b border-border px-2.5 py-2">
              <button
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs ${
                  panelTab === "chat" ? "bg-brand text-white" : "bg-subtle/60 text-muted"
                }`}
                onClick={() => setPanelTab("chat")}
              >
                <MessageSquare size={13} />
                채팅
              </button>
              <button
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs ${
                  panelTab === "participants" ? "bg-brand text-white" : "bg-subtle/60 text-muted"
                }`}
                onClick={() => setPanelTab("participants")}
              >
                <Users size={13} />
                참여자 ({participantIds.length})
              </button>
            </div>
            {panelTab === "chat" ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 space-y-2 overflow-y-auto px-2.5 py-2">
                  {callMessages.length === 0 ? (
                    <div className="text-xs text-muted">아직 메시지가 없습니다.</div>
                  ) : (
                    callMessages.map((message) => {
                      const author = users[message.authorId]?.displayName || users[message.authorId]?.name || message.author;
                      const avatar = users[message.authorId]?.avatarUrl;
                      return (
                        <div key={message.id} className="rounded-md bg-background px-2 py-2">
                          <div className="flex items-start gap-2">
                            <div className="h-7 w-7 overflow-hidden rounded-full bg-subtle/50">
                              {avatar ? (
                                <img src={avatar} alt={author} className="h-full w-full object-cover" />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-foreground">
                                  {author.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-xs font-semibold text-foreground">{author}</span>
                                <span className="text-[11px] text-muted">{formatCallMessageTime(message.ts)}</span>
                              </div>
                              <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-foreground">{message.text}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="border-t border-border/60 p-2.5">
                <div className="flex items-center gap-2">
                  <input
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void submitCallChat();
                      }
                    }}
                    placeholder="메시지 보내기..."
                      className="h-10 flex-1 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted"
                    />
                    <button
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white hover:opacity-90"
                      onClick={() => void submitCallChat()}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-2">
                {participantIds.map((uid) => {
                  const user = users[uid];
                  const displayName = user?.displayName || user?.name || "사용자";
                  const canHostControl = sfuState.enabled && sfuAccess?.callRole === "host" && uid !== me.id;
                  return (
                    <div key={uid} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-subtle/50">
                      <div className="h-8 w-8 overflow-hidden rounded-full bg-subtle/40">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-foreground">
                            {displayName.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="truncate text-sm text-foreground">{displayName}</span>
                      {canHostControl && (
                        <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-500 text-white hover:bg-amber-600"
                            title="강제 음소거"
                            onClick={() => setPendingHostAction({ type: "force-mute", targetUserId: uid, name: displayName })}
                          >
                            <MicOff size={13} />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-rose-600 text-white hover:bg-rose-700"
                            title="통화에서 내보내기"
                            onClick={() => setPendingHostAction({ type: "kick", targetUserId: uid, name: displayName })}
                          >
                            <UserX size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
          )}
          <div className="pointer-events-none fixed bottom-4 left-1/2 z-20 -translate-x-1/2">
            <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-border bg-panel/95 px-1.5 py-1 shadow-lg">
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-subtle text-foreground hover:bg-subtle/80"
                onClick={() => setControlsCollapsed((prev) => !prev)}
                title={controlsCollapsed ? "컨트롤 펼치기" : "컨트롤 접기"}
              >
                {controlsCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              {!controlsCollapsed && (
                <>
                  <button
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-white ${h.muted ? "bg-rose-500" : "bg-emerald-500"}`}
                    onClick={handleToggleMute}
                    disabled={!!(sfuState.enabled && sfuAccess && !sfuAccess.canProduce)}
                    title={h.muted ? "음소거 해제" : "음소거"}
                  >
                    {h.muted ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                  <button
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-white ${isDeafened ? "bg-rose-500" : "bg-blue-500"}`}
                    onClick={() => setIsDeafened((prev) => !prev)}
                    title={isDeafened ? "출력 음소거 해제" : "출력 음소거"}
                  >
                    {isDeafened ? <VolumeX size={16} /> : <Headphones size={16} />}
                  </button>
                  <button
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-white ${cameraOn ? "bg-brand" : "bg-rose-500"}`}
                    onClick={toggleCamera}
                    disabled={!!(sfuState.enabled && sfuAccess && !sfuAccess.canUseVideo)}
                    title={cameraOn ? "비디오 끄기" : "비디오 켜기"}
                  >
                    {cameraOn ? <Video size={16} /> : <VideoOff size={16} />}
                  </button>
                  <button
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-white ${isScreenSharing ? "bg-rose-500" : "bg-indigo-600 hover:bg-indigo-500"}`}
                    onClick={toggleScreenShare}
                    disabled={!!(sfuState.enabled && sfuAccess && !sfuAccess.canShareScreen)}
                    title={isScreenSharing ? "화면 공유 중지" : "화면 공유"}
                  >
                    <Monitor size={16} />
                  </button>
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-500"
                    onClick={handleDisconnectCall}
                    title="연결 끊기"
                  >
                    <PhoneOff size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
          {sfuDebugEnabled && (
            <div className="pointer-events-none fixed bottom-4 left-4 z-20 w-[320px] max-w-[calc(100vw-1.5rem)]">
              <div className="rounded-xl border border-border bg-background/95 p-2 shadow-lg">
                <div className="mb-1 text-[11px] font-semibold text-foreground">SFU 로그</div>
                <div className="space-y-1 text-[10px] leading-tight text-muted">
                  {sfuLogs.length === 0 ? <div>이벤트 없음</div> : sfuLogs.map((line, idx) => <div key={`${line}-${idx}`}>{line}</div>)}
                </div>
              </div>
            </div>
          )}
          {pendingHostAction && (
            <div className="fixed inset-0 z-30 grid place-items-center bg-black/35 px-4">
              <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-4 shadow-xl">
                <h4 className="text-sm font-semibold text-foreground">
                  {pendingHostAction.type === "kick" ? "참가자 내보내기" : "강제 음소거"}
                </h4>
                <p className="mt-2 text-sm text-muted">
                  <span className="font-semibold text-foreground">{pendingHostAction.name}</span>
                  {pendingHostAction.type === "kick"
                    ? " 님을 통화에서 내보낼까요?"
                    : " 님을 음소거할까요?"}
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-subtle/40"
                    onClick={() => setPendingHostAction(null)}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg px-3 py-1.5 text-sm text-white ${pendingHostAction.type === "kick" ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-500 hover:bg-amber-600"}`}
                    onClick={() => {
                      if (pendingHostAction.type === "kick") {
                        hostKick(pendingHostAction.targetUserId);
                      } else {
                        hostForceMute(pendingHostAction.targetUserId);
                      }
                      setPendingHostAction(null);
                    }}
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 border-b border-border bg-subtle/20 flex items-center justify-between">
      <div className="text-sm flex items-center gap-3">
        <span className="font-semibold">{h.mode === "video" ? "화상 채널" : "음성 채널"}</span>
        <span className="text-muted text-xs">#{channelId} · {mm}:{ss}</span>
        <div className="flex items-center gap-1">
          {Array.from(new Set([me.id, ...(h.members || []), ...Object.keys(remoteStreams)])).map((memberId, i) => {
            const user = users[memberId];
            const displayName = user?.name ?? memberId;
            return <Avatar key={`${memberId}-${i}`} name={displayName} avatarUrl={user?.avatarUrl} />;
          })}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <video ref={localVideoRef} autoPlay muted playsInline className="hidden h-10 w-16 rounded border border-border bg-black object-cover md:block" />
        {Object.entries(remoteStreams).slice(0, 2).map(([userId, stream]) => (
          <video
            key={userId}
            autoPlay
            playsInline
            className="hidden h-10 w-16 rounded border border-border bg-black object-cover md:block"
            ref={(el) => {
              if (el) el.srcObject = stream;
            }}
          />
        ))}
        <button
          className="px-2 py-1 text-xs rounded border border-border hover:bg-subtle/60 inline-flex items-center gap-1"
          onClick={toggleCamera}
          title={cameraOn ? "카메라 끄기" : "카메라 켜기"}
        >
          {cameraOn ? <Camera size={14} /> : <CameraOff size={14} />}
          {cameraOn ? "Cam On" : "Cam Off"}
        </button>
        <button
          className="px-2 py-1 text-xs rounded border border-border hover:bg-subtle/60 inline-flex items-center gap-1"
          onClick={handleToggleMute}
          title={h.muted ? "Unmute" : "Mute"}
        >
          {h.muted ? <MicOff size={14}/> : <Mic size={14}/>}
          {h.muted ? "Unmute" : "Mute"}
        </button>
        <button
          className="px-2 py-1 text-xs rounded border border-border hover:bg-rose-500/10 inline-flex items-center gap-1"
          onClick={handleDisconnectCall}
          title="Leave"
        >
          <PhoneOff size={14}/> Leave
        </button>
      </div>
    </div>
  );
}
