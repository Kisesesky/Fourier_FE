// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/chat-store/constants/event.constants.ts
export const CHAT_SOCKET_EVENTS = {
  WEBRTC_JOIN: 'webrtc.join',
  WEBRTC_LEAVE: 'webrtc.leave',
  TOGGLE_REACTION: 'toggle-reaction',
  CHANNEL_READ: 'channel.read',
  PIN_MESSAGE: 'pin-message',
  UNPIN_MESSAGE: 'unpin-message',
  TOGGLE_SAVE_MESSAGE: 'toggle-save-message',
} as const;

export const CHAT_BROADCAST_EVENTS = {
  CHANNEL_SET: 'channel:set',
  CHANNEL_CREATE: 'channel:create',
  CHANNEL_INVITE: 'channel:invite',
  CHANNEL_TOPIC: 'channel:topic',
  CHANNEL_MUTED: 'channel:muted',
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATE: 'message:update',
  MESSAGE_DELETE: 'message:delete',
  MESSAGE_RESTORE: 'message:restore',
  MESSAGE_REACT: 'message:react',
  TYPING: 'typing',
  PIN_SYNC: 'pin:sync',
  HUDDLE_STATE: 'huddle:state',
  SEEN_UPDATE: 'seen:update',
} as const;
