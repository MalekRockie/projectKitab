import { useEffect, useRef, useState } from 'react';
import { ConversationMessage } from '../api/messages/conversations';
import { getMessagesWebSocketUrl } from '../api/messages/socketConfig';
import { useUTStore } from '../storage/store/tstore';
import { findIncomingMessage } from './messageMapping';

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'error';

export function useMessagesSocket(enabled: boolean, onMessage: (message: ConversationMessage) => void) {
    const userToken = useUTStore(state => state.userToken);
    const [status, setStatus] = useState<SocketStatus>('idle');
    const [retryCount, setRetryCount] = useState(0);
    const socketRef = useRef<WebSocket | null>(null);
    // Kept in a ref so a new handler identity never tears down the connection.
    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;

    useEffect(() => {
        if (!enabled || !userToken) {
            setStatus('idle');
            return;
        }

        setStatus('connecting');
        const socket = new WebSocket(getMessagesWebSocketUrl(), [], {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        socketRef.current = socket;

        socket.onopen = () => setStatus('connected');
        socket.onerror = error => {
            console.warn('Direct messaging socket error', error);
            setStatus('error');
        };
        socket.onclose = () => {
            if (socketRef.current === socket) setStatus('error');
        };
        socket.onmessage = event => {
            try {
                const payload = JSON.parse(event.data);
                const incoming = findIncomingMessage(payload);
                if (!incoming) {
                    console.warn('Ignoring unrecognized direct-message socket frame', {
                        event: payload?.event,
                        keys: payload && typeof payload === 'object' ? Object.keys(payload) : [],
                        dataKeys: payload?.data && typeof payload.data === 'object' ? Object.keys(payload.data) : [],
                    });
                    return;
                }
                onMessageRef.current(incoming);
            } catch (error) {
                console.warn('Could not parse direct messaging socket event', error);
            }
        };

        return () => {
            socket.close();
            if (socketRef.current === socket) socketRef.current = null;
        };
    }, [enabled, retryCount, userToken]);

    return { socketRef, status, reconnect: () => setRetryCount(count => count + 1) };
}
