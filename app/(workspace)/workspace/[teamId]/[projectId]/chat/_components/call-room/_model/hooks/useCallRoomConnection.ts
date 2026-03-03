// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/call-room/_model/hooks/useCallRoomConnection.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { probeSfuRuntime } from '@/lib/sfuBridge';
import { SfuClientSession } from '@/lib/sfuClient';

type HuddleLike = {
  active?: boolean;
  muted?: boolean;
  mode?: 'audio' | 'video';
};

type SfuAccess = {
  callRole: 'host' | 'speaker' | 'listener';
  canProduce: boolean;
  canShareScreen: boolean;
  canUseVideo: boolean;
};

type UseCallRoomConnectionParams = {
  channelId: string;
  huddle?: HuddleLike;
  meId: string;
  socket: ReturnType<typeof import('@/lib/socket').getChatSocket> | null;
  sfuDebugEnabled: boolean;
  micVolume: number;
  onToggleHuddleMute: (channelId?: string) => void;
  onStopHuddle: (channelId?: string) => void;
  onNotify: (opts: { variant?: 'default' | 'warning' | 'success' | 'error'; title: string; description?: string }) => void;
};

export function useCallRoomConnection({
  channelId,
  huddle,
  meId,
  socket,
  sfuDebugEnabled,
  micVolume,
  onToggleHuddleMute,
  onStopHuddle,
  onNotify,
}: UseCallRoomConnectionParams) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const sfuClientRef = useRef<SfuClientSession | null>(null);
  const peerRefs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const localCameraPreviewStreamRef = useRef<MediaStream | null>(null);
  const localScreenPreviewStreamRef = useRef<MediaStream | null>(null);

  const [remoteVisualStreams, setRemoteVisualStreams] = useState<Record<string, { video?: MediaStream; screen?: MediaStream }>>({});
  const [remoteAudioStreams, setRemoteAudioStreams] = useState<Record<string, MediaStream>>({});
  const [cameraOn, setCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaStateByUser, setMediaStateByUser] = useState<Record<string, { audio: boolean; video: boolean; screen: boolean }>>({});
  const [speakingByUser, setSpeakingByUser] = useState<Record<string, boolean>>({});
  const [sfuAccess, setSfuAccess] = useState<SfuAccess | null>(null);
  const [sfuState, setSfuState] = useState<{ probed: boolean; enabled: boolean }>({ probed: false, enabled: false });
  const [sfuLogs, setSfuLogs] = useState<string[]>([]);

  const pushSfuLog = (message: string) => {
    if (!sfuDebugEnabled) return;
    const stamp = new Date().toLocaleTimeString('ko-KR', { hour12: false });
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
    setRemoteVisualStreams((prev) => {
      const next = { ...prev };
      delete next[targetUserId];
      return next;
    });
    setRemoteAudioStreams((prev) => {
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

  const emitMediaState = (track: 'audio' | 'video' | 'screen', enabled: boolean) => {
    if (!socket) return;
    socket.emit('webrtc.media-state', {
      channelId,
      track,
      enabled,
    });
  };

  const syncSfuLocalTracks = useCallback(async () => {
    const session = sfuClientRef.current;
    if (!session) return;
    if (sfuAccess && !sfuAccess.canProduce) {
      await session.produceTrack('audio', null);
      await session.produceTrack('video', null);
      await session.produceTrack('screen', null);
      return;
    }
    const localStream = localStreamRef.current;
    const localAudioTrack = localStream?.getAudioTracks()[0] ?? null;
    const audioTrack = !huddle?.muted ? localAudioTrack : null;
    const videoTrack = cameraOn ? cameraTrackRef.current : null;
    const screenTrack = isScreenSharing ? screenTrackRef.current : null;
    await session.produceTrack('audio', audioTrack);
    await session.produceTrack('video', videoTrack);
    await session.produceTrack('screen', screenTrack);
  }, [cameraOn, huddle?.muted, isScreenSharing, sfuAccess]);

  const replaceOutgoingVideoTrack = async (nextTrack: MediaStreamTrack | null) => {
    const peers = Array.from(peerRefs.current.values());
    await Promise.all(
      peers.map(async (peer) => {
        const sender = peer.getSenders().find((item) => item.track?.kind === 'video');
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
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    addLocalTracks(peer);
    peer.onicecandidate = (event) => {
      if (!event.candidate || !socket) return;
      socket.emit('webrtc.ice-candidate', {
        channelId,
        targetUserId,
        candidate: event.candidate,
      });
    };
    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) return;
      setRemoteVisualStreams((prev) => ({
        ...prev,
        [targetUserId]: {
          ...(prev[targetUserId] || {}),
          video: stream,
        },
      }));
      if (stream.getAudioTracks().length > 0) {
        setRemoteAudioStreams((prev) => ({ ...prev, [targetUserId]: stream }));
      }
    };
    peerRefs.current.set(targetUserId, peer);
    return peer;
  };

  const createOffer = async (targetUserId: string) => {
    if (!socket) return;
    const peer = ensurePeer(targetUserId);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit('webrtc.offer', {
      channelId,
      targetUserId,
      sdp: offer,
    });
  };

  useEffect(() => {
    if (!huddle?.active || !socket) return;
    let mounted = true;

    const boot = async () => {
      try {
        const wantVideo = huddle?.mode === 'video';
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: wantVideo });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        const videoTrack = stream.getVideoTracks()[0] ?? null;
        cameraTrackRef.current = videoTrack;
        localCameraPreviewStreamRef.current = videoTrack ? new MediaStream([videoTrack]) : null;
        setCameraOn(!!videoTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch {
        localStreamRef.current = null;
        cameraTrackRef.current = null;
        localCameraPreviewStreamRef.current = null;
        setCameraOn(false);
      }

      if (!sfuState.enabled) {
        socket.emit('webrtc.join', {
          channelId,
          mode: huddle?.mode || 'audio',
        });
      }
    };

    const onParticipants = (payload: { channelId: string; participants: string[] }) => {
      if (payload.channelId !== channelId) return;
      payload.participants
        .filter((uid) => uid !== meId && meId < uid)
        .forEach((uid) => {
          void createOffer(uid);
        });
    };

    const onUserJoined = (payload: { channelId: string; userId: string }) => {
      if (payload.channelId !== channelId || payload.userId === meId) return;
      if (meId < payload.userId) {
        void createOffer(payload.userId);
      }
    };

    const onOffer = async (payload: { channelId: string; fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      if (payload.channelId !== channelId || payload.fromUserId === meId || !socket) return;
      const peer = ensurePeer(payload.fromUserId);
      await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit('webrtc.answer', {
        channelId,
        targetUserId: payload.fromUserId,
        sdp: answer,
      });
    };

    const onAnswer = async (payload: { channelId: string; fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      if (payload.channelId !== channelId || payload.fromUserId === meId) return;
      const peer = ensurePeer(payload.fromUserId);
      await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    };

    const onCandidate = async (payload: { channelId: string; fromUserId: string; candidate: RTCIceCandidateInit }) => {
      if (payload.channelId !== channelId || payload.fromUserId === meId) return;
      const peer = ensurePeer(payload.fromUserId);
      await peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
    };

    const onUserLeft = (payload: { channelId: string; userId: string }) => {
      if (payload.channelId !== channelId || payload.userId === meId) return;
      closePeer(payload.userId);
    };

    const onMediaState = (payload: {
      channelId: string;
      userId: string;
      track: 'audio' | 'video' | 'screen';
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
      socket.on('webrtc.participants', onParticipants);
      socket.on('webrtc.user-joined', onUserJoined);
      socket.on('webrtc.offer', onOffer);
      socket.on('webrtc.answer', onAnswer);
      socket.on('webrtc.ice-candidate', onCandidate);
      socket.on('webrtc.user-left', onUserLeft);
    } else {
      peerRefs.current.forEach((peer) => peer.close());
      peerRefs.current.clear();
    }
    socket.on('webrtc.media-state', onMediaState);

    void boot();

    return () => {
      mounted = false;
      if (!sfuState.enabled) {
        socket.emit('webrtc.leave', { channelId });
        socket.off('webrtc.participants', onParticipants);
        socket.off('webrtc.user-joined', onUserJoined);
        socket.off('webrtc.offer', onOffer);
        socket.off('webrtc.answer', onAnswer);
        socket.off('webrtc.ice-candidate', onCandidate);
        socket.off('webrtc.user-left', onUserLeft);
      }
      socket.off('webrtc.media-state', onMediaState);
      peerRefs.current.forEach((peer) => peer.close());
      peerRefs.current.clear();
      setRemoteVisualStreams({});
      setRemoteAudioStreams({});
      setMediaStateByUser({});
      setSpeakingByUser({});
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      cameraTrackRef.current = null;
      localCameraPreviewStreamRef.current = null;
      localScreenPreviewStreamRef.current = null;
      setIsScreenSharing(false);
    };
  }, [channelId, huddle?.active, huddle?.mode, meId, sfuState.enabled, socket]);

  const toggleCamera = async () => {
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
        localCameraPreviewStreamRef.current = null;
      }
      if (!sfuState.enabled) {
        await replaceOutgoingVideoTrack(null);
      }
      if (sfuClientRef.current) {
        await sfuClientRef.current.produceTrack('video', null);
      }
      setCameraOn(false);
      emitMediaState('video', false);
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
      localCameraPreviewStreamRef.current = new MediaStream([camTrack]);
      if (!sfuState.enabled) {
        await replaceOutgoingVideoTrack(camTrack);
      }
      if (sfuClientRef.current) {
        await sfuClientRef.current.produceTrack('video', camTrack);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setCameraOn(true);
      emitMediaState('video', true);
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
    if (!sfuState.enabled) {
      if (cameraTrackRef.current && cameraOn) {
        await replaceOutgoingVideoTrack(cameraTrackRef.current);
      } else {
        await replaceOutgoingVideoTrack(null);
      }
    }
    if (sfuClientRef.current) {
      await sfuClientRef.current.produceTrack('video', cameraTrackRef.current && cameraOn ? cameraTrackRef.current : null);
      await sfuClientRef.current.produceTrack('screen', null);
    }
    setIsScreenSharing(false);
    localScreenPreviewStreamRef.current = null;
    emitMediaState('screen', false);
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
      localScreenPreviewStreamRef.current = new MediaStream([screenTrack]);
      if (!sfuState.enabled) {
        await replaceOutgoingVideoTrack(screenTrack);
      }
      if (sfuClientRef.current) {
        await sfuClientRef.current.produceTrack('screen', screenTrack);
        await sfuClientRef.current.produceTrack('video', cameraTrackRef.current && cameraOn ? cameraTrackRef.current : null);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setIsScreenSharing(true);
      emitMediaState('screen', true);
    } catch {
      setIsScreenSharing(false);
    }
  };

  useEffect(() => {
    if (!huddle?.active) return;
    setMediaStateByUser((prev) => ({
      ...prev,
      [meId]: {
        audio: !huddle.muted,
        video: cameraOn,
        screen: isScreenSharing,
      },
    }));
  }, [cameraOn, huddle?.active, huddle?.muted, isScreenSharing, meId]);

  useEffect(() => {
    if (!huddle?.active || !socket) return;
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
  }, [channelId, huddle?.active, socket]);

  useEffect(() => {
    if (!huddle?.active || !socket || !sfuState.enabled) return;
    const onJoined = (payload: {
      roomId: string;
      mediaStates?: Record<string, { audio: boolean; video: boolean; screen: boolean }>;
      access?: SfuAccess;
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
      if (payload.targetUserId !== meId) return;
      const audioTrack = localStreamRef.current?.getAudioTracks()?.[0] ?? null;
      if (audioTrack) audioTrack.enabled = false;
      if (!huddle?.muted) {
        onToggleHuddleMute(channelId);
      }
      void syncSfuLocalTracks();
      onNotify({
        variant: 'warning',
        title: '호스트가 음소거함',
        description: '통화에서 마이크가 강제로 꺼졌습니다.',
      });
    };
    const onKicked = (payload: { roomId: string; targetUserId: string; byUserId: string }) => {
      if (payload.roomId !== channelId || payload.targetUserId !== meId) return;
      pushSfuLog(`kicked by ${payload.byUserId.slice(0, 8)}`);
      onStopHuddle(channelId);
      onNotify({
        variant: 'warning',
        title: '통화에서 제외됨',
        description: '호스트가 통화에서 내보냈습니다.',
      });
    };
    socket.on('sfu.joined', onJoined);
    socket.on('sfu.media-state', onMediaState);
    socket.on('sfu.peer-left', onPeerLeft);
    socket.on('sfu.host-muted', onHostMuted);
    socket.on('sfu.kicked', onKicked);

    let closed = false;
    const run = async () => {
      const session = await SfuClientSession.create(socket, channelId, (userId, kind, stream) => {
        if (kind === 'audio') {
          setRemoteAudioStreams((prev) => {
            if (!stream) {
              const next = { ...prev };
              delete next[userId];
              return next;
            }
            return { ...prev, [userId]: stream };
          });
          return;
        }
        setRemoteVisualStreams((prev) => {
          const current = prev[userId] || {};
          if (!stream) {
            const nextUser = { ...current };
            if (kind === 'screen') delete nextUser.screen;
            if (kind === 'video') delete nextUser.video;
            if (!nextUser.video && !nextUser.screen) {
              const next = { ...prev };
              delete next[userId];
              return next;
            }
            return { ...prev, [userId]: nextUser };
          }
          return {
            ...prev,
            [userId]: {
              ...current,
              [kind === 'screen' ? 'screen' : 'video']: stream,
            },
          };
        });
      });
      if (closed || !session) return;
      sfuClientRef.current = session;
      pushSfuLog('session created');
      await syncSfuLocalTracks();
      pushSfuLog('local tracks produced');
    };
    void run();
    return () => {
      closed = true;
      socket.off('sfu.joined', onJoined);
      socket.off('sfu.media-state', onMediaState);
      socket.off('sfu.peer-left', onPeerLeft);
      socket.off('sfu.host-muted', onHostMuted);
      socket.off('sfu.kicked', onKicked);
      setSfuAccess(null);
      if (sfuClientRef.current) {
        sfuClientRef.current.close();
        sfuClientRef.current = null;
        pushSfuLog('session closed');
      }
    };
  }, [channelId, huddle?.active, huddle?.muted, meId, onNotify, onStopHuddle, onToggleHuddleMute, sfuState.enabled, socket, syncSfuLocalTracks]);

  useEffect(() => {
    if (!huddle?.active || !sfuState.enabled) return;
    void syncSfuLocalTracks();
  }, [huddle?.active, sfuState.enabled, syncSfuLocalTracks]);

  useEffect(() => {
    const streamEntries: Array<{ userId: string; stream: MediaStream }> = [];
    if (localStreamRef.current?.getAudioTracks().length) {
      streamEntries.push({ userId: meId, stream: localStreamRef.current });
    }
    Object.entries(remoteAudioStreams).forEach(([userId, stream]) => {
      if (stream.getAudioTracks().length > 0) streamEntries.push({ userId, stream });
    });
    if (streamEntries.length === 0) {
      setSpeakingByUser({});
      return;
    }

    const audioContext = new AudioContext();
    const analyzers = streamEntries.map(({ userId, stream }) => {
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      return { userId, analyser, data: new Uint8Array(analyser.fftSize) };
    });

    let rafId = 0;
    const tick = () => {
      const next: Record<string, boolean> = {};
      analyzers.forEach(({ userId, analyser, data }) => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const sample = (data[i] - 128) / 128;
          sum += sample * sample;
        }
        const rms = Math.sqrt(sum / data.length);
        next[userId] = rms > 0.04;
      });
      setSpeakingByUser(next);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      void audioContext.close();
    };
  }, [huddle?.active, meId, remoteAudioStreams]);

  useEffect(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0] ?? null;
    if (!audioTrack) return;
    if (micVolume <= 0) {
      audioTrack.enabled = false;
      return;
    }
    if (!huddle?.muted) {
      audioTrack.enabled = true;
    }
  }, [huddle?.muted, micVolume]);

  const handleToggleMute = () => {
    if (sfuState.enabled && sfuAccess && !sfuAccess.canProduce) return;
    onToggleHuddleMute(channelId);
    const audioTrack = localStreamRef.current?.getAudioTracks()[0] ?? null;
    if (audioTrack) {
      audioTrack.enabled = !!huddle?.muted;
    }
    void syncSfuLocalTracks();
    emitMediaState('audio', !!huddle?.muted);
  };

  const handleDisconnectCall = () => {
    if (sfuClientRef.current) {
      sfuClientRef.current.close();
      sfuClientRef.current = null;
    } else if (socket) {
      socket.emit('webrtc.leave', { channelId });
    }
    onStopHuddle(channelId);
  };

  const hostForceMute = (targetUserId: string) => {
    if (!socket) return;
    socket.emit('sfu.host-force-mute', { channelId, targetUserId });
  };

  const hostKick = (targetUserId: string) => {
    if (!socket) return;
    socket.emit('sfu.host-kick', { channelId, targetUserId });
  };

  return {
    localVideoRef,
    localStreamRef,
    localCameraPreviewStreamRef,
    localScreenPreviewStreamRef,
    cameraOn,
    isScreenSharing,
    remoteVisualStreams,
    mediaStateByUser,
    speakingByUser,
    sfuAccess,
    sfuState,
    sfuLogs,
    toggleCamera,
    toggleScreenShare,
    handleToggleMute,
    handleDisconnectCall,
    hostForceMute,
    hostKick,
  };
}
