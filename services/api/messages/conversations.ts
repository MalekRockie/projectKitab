import { privateApi } from '../base';

export type ConversationParticipant = {
    user_id: string;
    username: string;
    display_name?: string;
};

export type ConversationMessage = {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_deleted: boolean;
    is_edited: boolean;
    created_at: string;
};

export type Conversation = {
    id: string;
    type: 'direct' | string;
    created_at: string;
    last_activity_at: string;
    participant: ConversationParticipant;
    last_message: {
        id: string;
        sender_id: string;
        content: string;
        created_at: string;
    } | null;
};

export async function getConversations(cursor?: string | null) {
    const response = await privateApi.get('/api/p/v1/conversations', {
        params: cursor ? { cursor } : undefined,
    });
    return response.data as { conversations: Conversation[]; next_cursor: string | null };
}

export async function getConversationMessages(conversationId: string) {
    const response = await privateApi.get(
        `/api/p/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
    );
    return response.data as { messages: ConversationMessage[]; next_cursor: string | null };
}
