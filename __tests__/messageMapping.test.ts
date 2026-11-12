import {
  createMessageSendEvent,
  findIncomingCircleChannelMessage,
  findIncomingMessage,
  mapConversationMessage,
} from '../services/messages/messageMapping';

describe('message replies', () => {
  const direct = {
    id: 'reply',
    conversation_id: 'conversation',
    sender_id: 'sender',
    content: 'Hello',
    created_at: '2026-01-01T00:00:00Z',
  };
  const circle = {
    id: 'reply',
    channel_id: 'channel',
    sender: {user_id: 'sender'},
    content: 'Hello',
    created_at: '2026-01-01T00:00:00Z',
  };

  it('preserves direct reply IDs from socket frames and maps them for display', () => {
    const message = findIncomingMessage({
      data: {...direct, reply_to_message_id: 'original'},
    });
    expect(message?.reply_to_message_id).toBe('original');
    expect(
      mapConversationMessage(message!, undefined, 'sender').replyToMessageId,
    ).toBe('original');
  });

  it('preserves circle reply IDs from socket frames', () => {
    expect(
      findIncomingCircleChannelMessage({
        data: {...circle, reply_to_message_id: 'original'},
      })?.reply_to_message_id,
    ).toBe('original');
  });

  it('accepts messages without a reply ID', () => {
    expect(findIncomingMessage({data: direct})?.reply_to_message_id).toBeNull();
    expect(
      findIncomingCircleChannelMessage({data: circle})?.reply_to_message_id,
    ).toBeNull();
  });

  it.each([{channel_id: 'channel'}, {conversation_id: 'conversation'}])(
    'sends replies to %o',
    destination => {
      expect(
        createMessageSendEvent(destination, 'I agree!', 'original'),
      ).toEqual({
        event: 'message.send',
        data: {
          ...destination,
          content: 'I agree!',
          reply_to_message_id: 'original',
        },
      });
      expect(createMessageSendEvent(destination, 'Hello')).toEqual({
        event: 'message.send',
        data: {...destination, content: 'Hello'},
      });
    },
  );
});
