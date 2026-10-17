import { Conversation, ConversationMessage } from '../api/messages/conversations';

export type Message = { id: string; author: string; body: string; time: string; own?: boolean };

export const getConversationName = (conversation: Conversation) =>
    conversation.participant.display_name || conversation.participant.username || 'Unknown person';

export const getConversationInitials = (conversation: Conversation) =>
    getConversationName(conversation).split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();

export const formatMessageTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export function mapConversationMessage(message: ConversationMessage, conversation: Conversation | undefined, currentUserId: string): Message {
    const own = Boolean(currentUserId) && message.sender_id === currentUserId;
    return {
        id: message.id,
        author: own ? 'You' : conversation ? getConversationName(conversation) : 'Participant',
        body: message.is_deleted ? 'This message was deleted.' : message.content,
        time: formatMessageTime(message.created_at),
        own,
    };
}

// The server's frame envelope isn't fixed, so search the payload for anything shaped like a message.
export function findIncomingMessage(frame: unknown): ConversationMessage | null {
    const pending = [frame];
    const seen = new Set<object>();

    while (pending.length > 0) {
        const candidate = pending.shift();
        if (!candidate || typeof candidate !== 'object' || seen.has(candidate)) continue;
        seen.add(candidate);

        const value = candidate as Record<string, unknown>;
        const id = value.id ?? value.message_id;
        const conversationId = value.conversation_id ?? value.conversationId;
        const senderId = value.sender_id ?? value.senderId ?? value.SenderID;
        const content = value.content ?? value.body ?? value.text;

        if (id && conversationId && senderId && typeof content === 'string') {
            return {
                id: String(id),
                conversation_id: String(conversationId),
                sender_id: String(senderId),
                content,
                is_deleted: Boolean(value.is_deleted ?? value.deleted),
                is_edited: Boolean(value.is_edited ?? value.edited),
                created_at: String(value.created_at ?? value.createdAt ?? new Date().toISOString()),
            };
        }

        Object.values(value).forEach(child => {
            if (child && typeof child === 'object') pending.push(child);
        });
    }

    return null;
}
