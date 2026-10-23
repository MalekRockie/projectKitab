import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import Animated, { runOnJS, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight, useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { ThemeColors } from '../theme/colors';
import { useCUserStore } from '../services/storage/store/cUserStore';
import { Conversation, ConversationMessage, getConversationMessages, getConversations } from '../services/api/messages/conversations';
import {
    Circle,
    CircleFolder,
    CircleLayoutItem,
    buildCircleLayout,
    createCircle,
    createCircleFolder,
    deleteCircle,
    deleteCircleFolder,
    getCircleFolders,
    getCircles,
    moveCircleToFolder,
    renameCircleFolder,
    updateCircleOrder,
} from '../services/api/messages/circles';
import { Message, formatMessageTime, getConversationInitials, mapConversationMessage } from '../services/messages/messageMapping';
import { useMessagesSocket } from '../services/messages/useMessagesSocket';
import { INITIAL_CHAT_STATE, SERVERS, Server } from '../data/circles';
import ChannelRow from '../components/messages/ChannelRow';
import ChatView from '../components/messages/ChatView';
import CircleDrawer from '../components/messages/CircleDrawer';
import CircleHeader from '../components/messages/CircleHeader';
import CircleEditDialog from '../components/messages/CircleEditDialog';
import CircleMembersDialog from '../components/messages/CircleMembersDialog';
import useCircleDetails from '../components/messages/useCircleDetails';
import CircleManager from '../components/messages/CircleManager';
import CircleNameDialog from '../components/messages/CircleNameDialog';
import CircleRail, { CircleDragEntity, CircleDropTarget } from '../components/messages/CircleRail';
import DirectInbox from '../components/messages/DirectInbox';
import { useCircleDrawer } from '../components/messages/useCircleDrawer';

type MessagesScreenProps = { onOpenSidebar: () => void };

export default function MessagesScreen({ onOpenSidebar }: MessagesScreenProps) {
    const colors = useTheme();
    const { width } = useWindowDimensions();
    const wide = width >= 760;
    const styles = useMemo(() => createStyles(colors, wide), [colors, wide]);
    const currentUserId = useCUserStore(state => state.userId);
    const [mode, setMode] = useState<'servers' | 'direct'>('servers');
    const [serverId, setServerId] = useState('');
    const [roomId, setRoomId] = useState('');
    const [circles, setCircles] = useState<Circle[]>([]);
    const [circleFolders, setCircleFolders] = useState<CircleFolder[]>([]);
    const [circlesLoading, setCirclesLoading] = useState(true);
    const [circlesError, setCirclesError] = useState<string | null>(null);
    const [circleManagerOpen, setCircleManagerOpen] = useState(false);
    const [circleNameDialogOpen, setCircleNameDialogOpen] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [conversationsLoading, setConversationsLoading] = useState(true);
    const [conversationsError, setConversationsError] = useState<string | null>(null);
    const [directMessages, setDirectMessages] = useState<Record<string, Message[]>>({});
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messagesError, setMessagesError] = useState<string | null>(null);
    const [directChatOpen, setDirectChatOpen] = useState(false);
    const [modeChangeDirection, setModeChangeDirection] = useState<'toDirect' | 'toCircles' | null>(null);
    const [draft, setDraft] = useState('');
    const [chats, setChats] = useState(INITIAL_CHAT_STATE);
    const conversationsRef = useRef(conversations);
    conversationsRef.current = conversations;
    const messageListRef = useRef<FlatList<Message> | null>(null);
    const drawer = useCircleDrawer();
    const appSidebarGestureStartX = useSharedValue(0);

    const refreshCircles = useCallback(async () => {
        setCirclesLoading(true);
        setCirclesError(null);
        try {
            const [circleList, folderList] = await Promise.all([getCircles(), getCircleFolders()]);
            setCircles([...circleList].sort((a, b) => a.display_order - b.display_order));
            setCircleFolders([...folderList].sort((a, b) => a.display_order - b.display_order));
        } catch (error) {
            console.warn('Could not load circles and folders', error);
            setCirclesError('We couldn’t load your circles and folders. Check your connection and try again.');
        } finally {
            setCirclesLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshCircles();
    }, [refreshCircles]);

    const refreshConversations = useCallback(async () => {
        setConversationsLoading(true);
        setConversationsError(null);
        try {
            const response = await getConversations();
            if (!Array.isArray(response?.conversations)) throw new Error('Invalid conversations response');
            setConversations(response.conversations);
        } catch (error) {
            console.warn('Could not load direct conversations', error);
            setConversationsError('We couldn’t load your conversations. Check your connection and try again.');
        } finally {
            setConversationsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshConversations();
    }, [refreshConversations]);

    const handleIncomingMessage = (incoming: ConversationMessage) => {
        const conversation = conversationsRef.current.find(item => item.id === incoming.conversation_id);
        const mappedMessage = mapConversationMessage(incoming, conversation, currentUserId);
        setDirectMessages(previous => {
            const existing = previous[incoming.conversation_id] ?? [];
            if (existing.some(message => message.id === mappedMessage.id)) return previous;
            const optimisticIndex = mappedMessage.own
                ? existing.findIndex(message => message.id.startsWith('pending-') && message.body === mappedMessage.body)
                : -1;
            const nextMessages = [...existing];
            if (optimisticIndex >= 0) nextMessages.splice(optimisticIndex, 1, mappedMessage);
            else nextMessages.push(mappedMessage);
            return { ...previous, [incoming.conversation_id]: nextMessages };
        });
        setConversations(previous => previous.map(item => item.id === incoming.conversation_id
            ? {
                ...item,
                last_activity_at: incoming.created_at ?? item.last_activity_at,
                last_message: {
                    id: incoming.id,
                    sender_id: incoming.sender_id,
                    content: incoming.content,
                    created_at: incoming.created_at ?? new Date().toISOString(),
                },
            }
            : item));
    };
    const { socketRef, status: socketStatus, reconnect: reconnectSocket } = useMessagesSocket(mode === 'direct', handleIncomingMessage);

    const loadConversationMessages = useCallback(async (conversationId: string, isCurrent: () => boolean = () => true) => {
        setMessagesLoading(true);
        setMessagesError(null);
        try {
            const response = await getConversationMessages(conversationId);
            if (!Array.isArray(response?.messages)) throw new Error('Invalid conversation messages response');
            const conversation = conversationsRef.current.find(item => item.id === conversationId);
            const messages = [...response.messages]
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map(message => mapConversationMessage(message, conversation, currentUserId));
            if (isCurrent()) {
                setDirectMessages(previous => {
                    const receivedWhileLoading = previous[conversationId] ?? [];
                    const uniqueMessages = new Map<string, Message>();
                    [...messages, ...receivedWhileLoading].forEach(message => uniqueMessages.set(message.id, message));
                    return { ...previous, [conversationId]: [...uniqueMessages.values()] };
                });
            }
        } catch (error) {
            console.warn('Could not load direct messages', error);
            if (isCurrent()) setMessagesError('We couldn’t load this conversation. Check your connection and try again.');
        } finally {
            if (isCurrent()) setMessagesLoading(false);
        }
    }, [currentUserId]);

    useEffect(() => {
        if (mode !== 'direct' || !activeConversationId) return;
        let isCurrent = true;
        loadConversationMessages(activeConversationId, () => isCurrent);
        return () => { isCurrent = false; };
    }, [activeConversationId, loadConversationMessages, mode]);

    const servers = useMemo(() => {
        const circleById = new Map(circles.map(circle => [circle.id, circle]));
        const orderedCircles = buildCircleLayout(circles, circleFolders).reduce<Circle[]>((ordered, item) => {
            const circleIds = item.type === 'circle' ? [item.id] : item.circle_ids;
            circleIds.forEach(id => {
                const circle = circleById.get(id);
                if (circle) {
                    ordered.push(circle);
                }
            });
            return ordered;
        }, []);
        return orderedCircles.map((circle, index) => {
            const template = SERVERS[index % SERVERS.length];
            return {
                ...template,
                id: circle.id,
                name: circle.name,
                initials: circle.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('') || '?',
                folderId: circle.folder_id,
            };
        });
    }, [circleFolders, circles]);
    useEffect(() => {
        if (!servers.length) {
            setServerId('');
            setRoomId('');
            return;
        }
        const selectedServer = servers.find(item => item.id === serverId);
        if (!selectedServer) {
            setServerId(servers[0].id);
            setRoomId(servers[0].rooms[0]?.id ?? '');
        } else if (!selectedServer.rooms.some(item => item.id === roomId)) {
            setRoomId(selectedServer.rooms[0]?.id ?? '');
        }
    }, [roomId, serverId, servers]);

    const server = servers.find(item => item.id === serverId) ?? servers[0] ?? null;
    const room = server?.rooms.find(item => item.id === roomId) ?? server?.rooms[0] ?? null;
    const { details: circleDetails, save: saveCircleDetails } = useCircleDetails(server?.id ?? '');
    const [circleEditOpen, setCircleEditOpen] = useState(false);
    const [circleMembersOpen, setCircleMembersOpen] = useState(false);
    const renderCircleHeader = (showName: boolean) => server ? (
        <CircleHeader
            circleId={server.id}
            name={circleDetails?.name ?? server.name}
            details={circleDetails}
            canEdit={Boolean(circleDetails?.is_owner)}
            showName={showName}
            onEdit={() => setCircleEditOpen(true)}
            onOpenMembers={() => setCircleMembersOpen(true)}
        />
    ) : null;
    const circleHeaderNode = renderCircleHeader(true);
    // The drawer's top bar already shows the name and member count.
    const drawerHeaderNode = renderCircleHeader(false);
    const activeConversation = conversations.find(item => item.id === activeConversationId) ?? null;
    const activeChatId = room?.id ?? '';
    const activeMessages = mode === 'servers'
        ? chats[activeChatId] ?? []
        : activeConversationId ? directMessages[activeConversationId] ?? [] : [];
    const directName = activeConversation?.participant.display_name || activeConversation?.participant.username || 'Direct message';

    const inMobileDirectChat = !wide && mode === 'direct' && directChatOpen;

    const scrollToLatest = () => requestAnimationFrame(() => messageListRef.current?.scrollToOffset({ offset: 0, animated: true }));

    const appSidebarGesture = Gesture.Pan()
        .activeOffsetX(-18)
        .failOffsetY([-12, 12])
        .onBegin(event => { appSidebarGestureStartX.value = event.absoluteX; })
        .onEnd(event => {
            if (appSidebarGestureStartX.value > width - 32 && event.translationX < -75) {
                runOnJS(onOpenSidebar)();
            }
        });
    const chatGestures = Gesture.Simultaneous(drawer.edgeGesture, appSidebarGesture);

    const chooseServer = (nextServer: Server) => {
        setServerId(nextServer.id);
        setRoomId(nextServer.rooms[0]?.id ?? '');
    };

    const runCircleMutation = async (mutation: () => Promise<void>) => {
        await mutation();
        await refreshCircles();
    };

    const layoutWithoutCircles = (circleIds: string[]) => buildCircleLayout(circles, circleFolders).reduce<CircleLayoutItem[]>((result, item) => {
        if (item.type === 'circle') {
            if (!circleIds.includes(item.id)) {
                result.push(item);
            }
            return result;
        }
        result.push({ ...item, circle_ids: item.circle_ids.filter(id => !circleIds.includes(id)) });
        return result;
    }, []);

    const createFolderFromDrop = async (sourceCircleId: string, targetCircleId: string) => {
        const sourceCircle = circles.find(circle => circle.id === sourceCircleId);
        const targetCircle = circles.find(circle => circle.id === targetCircleId);
        if (!sourceCircle || !targetCircle) {
            return;
        }

        const folderName = `${targetCircle.name} + ${sourceCircle.name}`;
        try {
            const folder = await createCircleFolder(folderName);
            await Promise.all([
                moveCircleToFolder(sourceCircleId, folder.id),
                moveCircleToFolder(targetCircleId, folder.id),
            ]);

            const nextLayout = layoutWithoutCircles([sourceCircleId, targetCircleId]);
            const existingLayout = buildCircleLayout(circles, circleFolders);
            const originalIndex = existingLayout.findIndex(item =>
                item.type === 'circle'
                    ? item.id === sourceCircleId || item.id === targetCircleId
                    : item.circle_ids.includes(sourceCircleId) || item.circle_ids.includes(targetCircleId),
            );
            nextLayout.splice(originalIndex < 0 ? nextLayout.length : Math.min(originalIndex, nextLayout.length), 0, {
                type: 'folder',
                id: folder.id,
                circle_ids: [targetCircleId, sourceCircleId],
            });
            await updateCircleOrder(nextLayout);
            await refreshCircles();
        } catch (error) {
            console.warn('Could not create a folder from dropped circles', error);
            await refreshCircles();
            setCirclesError('That folder could not be created. Check your connection and try again.');
        }
    };

    const handleCircleDrop = async (circleId: string, target: CircleDropTarget) => {
        if (target.type === 'circle') {
            if (target.id === circleId) {
                return;
            }
            await createFolderFromDrop(circleId, target.id);
            return;
        }

        const sourceCircle = circles.find(circle => circle.id === circleId);
        if (!sourceCircle) {
            return;
        }
        const targetFolderId = target.type === 'folder' ? target.id : null;
        if (sourceCircle.folder_id === targetFolderId) {
            return;
        }

        const nextLayout = layoutWithoutCircles([circleId]);
        if (targetFolderId) {
            const folderEntry = nextLayout.find(item => item.type === 'folder' && item.id === targetFolderId);
            if (folderEntry?.type === 'folder') {
                folderEntry.circle_ids.push(circleId);
            } else {
                nextLayout.push({ type: 'circle', id: circleId });
            }
        } else {
            nextLayout.unshift({ type: 'circle', id: circleId });
        }

        try {
            await moveCircleToFolder(circleId, targetFolderId);
            await updateCircleOrder(nextLayout);
            await refreshCircles();
        } catch (error) {
            console.warn('Could not move circle', error);
            setCirclesError('That circle could not be moved. Check your connection and try again.');
        }
    };

    const reorderCircleEntry = async (entity: CircleDragEntity, targetIndex: number) => {
        const currentLayout = buildCircleLayout(circles, circleFolders);
        let draggedEntry: CircleLayoutItem;
        if (entity.type === 'circle') {
            draggedEntry = { type: 'circle', id: entity.id };
        } else {
            const draggedFolder = currentLayout.find(item => item.type === 'folder' && item.id === entity.id);
            if (!draggedFolder || draggedFolder.type !== 'folder') {
                return;
            }
            draggedEntry = draggedFolder;
        }

        const nextLayout = currentLayout.reduce<CircleLayoutItem[]>((result, item) => {
            if (entity.type === 'folder' && item.type === 'folder' && item.id === entity.id) {
                return result;
            }
            if (entity.type === 'circle' && item.type === 'circle' && item.id === entity.id) {
                return result;
            }
            if (entity.type === 'circle' && item.type === 'folder') {
                result.push({ ...item, circle_ids: item.circle_ids.filter(id => id !== entity.id) });
                return result;
            }
            result.push(item);
            return result;
        }, []);

        const movedCircle = entity.type === 'circle'
            ? circles.find(circle => circle.id === entity.id)
            : null;
        nextLayout.splice(Math.max(0, Math.min(targetIndex, nextLayout.length)), 0,
            draggedEntry,
        );

        try {
            if (movedCircle?.folder_id) {
                await moveCircleToFolder(entity.id, null);
            }
            await updateCircleOrder(nextLayout);
            await refreshCircles();
        } catch (error) {
            console.warn('Could not reorder circles or folders', error);
            setCirclesError('That order could not be saved. Check your connection and try again.');
        }
    };

    const openDirectChat = (nextConversation: Conversation) => {
        setModeChangeDirection(null);
        setActiveConversationId(nextConversation.id);
        setDirectChatOpen(true);
    };
    const showCircles = () => {
        setModeChangeDirection('toCircles');
        setMode('servers');
        drawer.closeDrawer();
    };
    const showDirect = () => {
        setModeChangeDirection('toDirect');
        setMode('direct');
        setDirectChatOpen(false);
    };
    const sendMessage = () => {
        const body = draft.trim();
        if (!body) return;
        if (mode === 'direct') {
            const socket = socketRef.current;
            if (!activeConversationId || !socket || socket.readyState !== WebSocket.OPEN) return;
            const createdAt = new Date().toISOString();
            const optimisticMessage: Message = {
                id: `pending-${Date.now()}`,
                author: 'You',
                body,
                time: formatMessageTime(createdAt),
                own: true,
            };

            try {
                socket.send(JSON.stringify({
                    event: 'message.send',
                    data: { conversation_id: activeConversationId, content: body },
                }));
                setDirectMessages(previous => ({
                    ...previous,
                    [activeConversationId]: [...(previous[activeConversationId] ?? []), optimisticMessage],
                }));
                setConversations(previous => previous.map(item => item.id === activeConversationId
                    ? {
                        ...item,
                        last_activity_at: createdAt,
                        last_message: {
                            id: optimisticMessage.id,
                            sender_id: currentUserId,
                            content: body,
                            created_at: createdAt,
                        },
                    }
                    : item));
                setDraft('');
                scrollToLatest();
            } catch (error) {
                console.warn('Could not send direct message', error);
                setMessagesError('Your message couldn’t be sent. Please try again.');
            }
            return;
        }
        const message: Message = {
            id: `${Date.now()}`,
            author: 'You',
            body,
            time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            own: true,
        };
        setChats(previous => ({ ...previous, [activeChatId]: [...(previous[activeChatId] ?? []), message] }));
        setDraft('');
        scrollToLatest();
    };

    const renderChat = (handlers: { onBack?: () => void; onOpenChannels?: () => void } = {}) => {
        const direct = mode === 'direct';
        return (
            <ChatView
                wide={wide}
                listRef={messageListRef}
                listKey={direct ? `direct-${activeConversationId ?? 'none'}` : `circle-${activeChatId}`}
                messages={activeMessages}
                title={direct ? (activeConversation ? directName : 'Select a conversation') : room?.name ?? 'Choose a circle'}
                subtitle={direct ? activeConversation?.participant.username ?? '' : server && room ? `${server.name} · ${room.name}` : ''}
                leading={direct ? (activeConversation ? { initials: getConversationInitials(activeConversation) } : undefined) : room ? 'hash' : undefined}
                loading={direct && messagesLoading}
                error={direct ? messagesError : null}
                onRetry={() => { if (activeConversationId) loadConversationMessages(activeConversationId); }}
                emptyTitle={!direct ? (server ? 'A fresh start' : 'No circles yet') : activeConversationId ? 'No messages yet' : 'Choose a conversation'}
                emptyCopy={!direct
                    ? server ? 'Say hello and get the conversation going.' : 'Create a circle to get started.'
                    : activeConversationId
                        ? 'Messages in this conversation will appear here.'
                        : 'Select someone from your direct message history to open the chat.'}
                composer={{
                    value: draft,
                    onChangeText: setDraft,
                    onSend: sendMessage,
                    placeholder: !direct ? room ? `Message #${room.name}` : 'Create a circle to start chatting' : activeConversation ? `Message ${directName}` : 'Choose a conversation',
                    disabled: direct ? !activeConversationId : !room,
                    connection: direct ? { status: socketStatus, onReconnect: reconnectSocket } : undefined,
                }}
                {...handlers}
            />
        );
    };

    const renderInbox = (compact: boolean) => (
        <DirectInbox
            conversations={conversations}
            currentUserId={currentUserId}
            activeConversationId={activeConversationId}
            loading={conversationsLoading}
            error={conversationsError}
            onRefresh={refreshConversations}
            onOpen={openDirectChat}
            compact={compact}
        />
    );

    const serverRail = (
        <CircleRail
            circles={circles}
            folders={circleFolders}
            selectedCircleId={server?.id ?? null}
            loading={circlesLoading}
            error={circlesError}
            onChooseCircle={circleId => {
                const selectedServer = servers.find(item => item.id === circleId);
                if (selectedServer) {
                    chooseServer(selectedServer);
                }
            }}
            onCreateCircle={() => setCircleNameDialogOpen(true)}
            onManageFolders={() => setCircleManagerOpen(true)}
            onRetry={refreshCircles}
            onDropCircle={handleCircleDrop}
            onReorder={reorderCircleEntry}
        />
    );
    const conversationList = (
        <View style={styles.conversationList}>
            {mode === 'servers' ? <>
                <View style={styles.listHeadingRow}><Text style={styles.listHeading}>CIRCLE CHANNELS</Text></View>
                {circlesLoading ? <Text style={styles.listStatus}>Loading circles…</Text> : null}
                {circlesError ? (
                    <Pressable onPress={() => { refreshCircles(); }} style={styles.retryRow}>
                        <Text style={styles.listError}>{circlesError}</Text>
                        <Text style={styles.retryText}>Try again</Text>
                    </Pressable>
                ) : null}
                {circleHeaderNode}
                {server?.rooms.map(item => (
                    <ChannelRow key={item.id} name={item.name} active={room?.id === item.id} unread={item.id === 'general' && server.id === servers[0]?.id} onPress={() => setRoomId(item.id)} />
                ))}
                {!circlesLoading && !circlesError && !server ? <Text style={styles.listStatus}>No circles yet. Use the + button to create one.</Text> : null}
            </> : <>
                <View style={styles.listHeadingRow}><Text style={styles.listHeading}>DIRECT MESSAGES</Text></View>
                {renderInbox(false)}
            </>}
        </View>
    );
    const mobileDirectInbox = (
        <View style={styles.mobileInbox}>
            <View style={styles.inboxHeading}>
                <Text style={styles.inboxTitle}>Direct messages</Text>
                <Text style={styles.inboxSubtitle}>Recent conversations</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                {renderInbox(true)}
            </ScrollView>
        </View>
    );
    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <StatusBar barStyle={colors.background === '#000000' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
            <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {!inMobileDirectChat ? <View style={[styles.topBar, !wide && styles.topBarMobile]}>
                    <View style={styles.brandBlock}>
                        <Pressable onPress={onOpenSidebar} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Open app navigation">
                            <Icon name="menu" size={23} color={colors.text} />
                        </Pressable>
                        {wide ? <View style={styles.brandGlyph}><Icon name="forum" size={20} color="#FFFFFF" /></View> : null}
                        <View>
                            {wide ? <Text style={styles.eyebrow}>YOUR PEOPLE, YOUR SPACES</Text> : null}
                            <Text style={styles.screenTitle}>Circles & messages</Text>
                        </View>
                    </View>
                    <View style={[styles.modeSwitch, !wide && styles.modeSwitchMobile]}>
                        <Pressable onPress={showCircles} style={[styles.modeButton, !wide && styles.modeButtonMobile, mode === 'servers' && styles.modeButtonActive]} accessibilityRole="tab" accessibilityState={{ selected: mode === 'servers' }}>
                            <Icon name="groups" size={17} color={mode === 'servers' ? colors.text : colors.textSecondary} />
                            <Text style={[styles.modeLabel, mode === 'servers' && styles.modeLabelActive]}>Circles</Text>
                        </Pressable>
                        <Pressable onPress={showDirect} style={[styles.modeButton, !wide && styles.modeButtonMobile, mode === 'direct' && styles.modeButtonActive]} accessibilityRole="tab" accessibilityState={{ selected: mode === 'direct' }}>
                            <Icon name="chat-bubble-outline" size={16} color={mode === 'direct' ? colors.text : colors.textSecondary} />
                            <Text style={[styles.modeLabel, mode === 'direct' && styles.modeLabelActive]}>Direct</Text>
                        </Pressable>
                    </View>
                </View> : null}
                {wide ? (
                    <View style={styles.workspace}>
                        {mode === 'servers' ? serverRail : null}
                        {conversationList}
                        {renderChat()}
                    </View>
                ) : (
                    <View style={styles.mobileWorkspace}>
                        {mode === 'direct' && !directChatOpen ? (
                            <Animated.View
                                key="direct-inbox"
                                entering={(modeChangeDirection === 'toDirect' ? SlideInRight : SlideInLeft).duration(240)}
                                exiting={(modeChangeDirection === 'toCircles' ? SlideOutRight : SlideOutLeft).duration(240)}
                                style={[styles.mobileDirectPage, StyleSheet.absoluteFillObject]}
                            >
                                {mobileDirectInbox}
                            </Animated.View>
                        ) : <>
                            <GestureDetector gesture={chatGestures}>
                                <Animated.View
                                    key={mode === 'direct' ? `direct-chat-${activeConversationId ?? 'none'}` : 'circle-chat'}
                                    entering={mode === 'direct'
                                        ? SlideInRight.duration(240)
                                        : modeChangeDirection === 'toCircles' ? SlideInLeft.duration(240) : undefined}
                                    exiting={modeChangeDirection === 'toCircles'
                                        ? SlideOutRight.duration(240)
                                        : modeChangeDirection === 'toDirect'
                                            ? SlideOutLeft.duration(240)
                                            : mode === 'direct' ? SlideOutRight.duration(240) : undefined}
                                    style={mode === 'direct' ? [styles.chatPane, StyleSheet.absoluteFillObject] : styles.chatPane}
                                >
                                    {renderChat(mode === 'direct' ? { onBack: () => setDirectChatOpen(false) } : { onOpenChannels: drawer.openDrawer })}
                                </Animated.View>
                            </GestureDetector>
                            {mode === 'servers' ? (
                                <CircleDrawer
                                    drawer={drawer}
                                    circles={circles}
                                    servers={servers}
                                    server={server}
                                    roomId={room?.id ?? ''}
                                    folders={circleFolders}
                                    loading={circlesLoading}
                                    error={circlesError}
                                    onRetry={() => { refreshCircles(); }}
                                    onCreateCircle={() => setCircleNameDialogOpen(true)}
                                    onManageFolders={() => setCircleManagerOpen(true)}
                                    onDropCircle={handleCircleDrop}
                                    onReorder={reorderCircleEntry}
                                    onChooseServer={chooseServer}
                                    onChooseRoom={nextRoomId => { setRoomId(nextRoomId); drawer.closeDrawer(); }}
                                    onOpenDirect={() => { showDirect(); drawer.closeDrawer(); }}
                                    circleHeader={drawerHeaderNode}
                                    memberCount={circleDetails?.member_count}
                                    onOpenMembers={() => setCircleMembersOpen(true)}
                                />
                            ) : null}
                        </>}
                    </View>
                )}
            </KeyboardAvoidingView>
            <CircleManager
                visible={circleManagerOpen}
                folders={circleFolders}
                onClose={() => setCircleManagerOpen(false)}
                onRenameFolder={(folderId, name) => runCircleMutation(() => renameCircleFolder(folderId, name))}
                onDeleteFolder={folderId => runCircleMutation(() => deleteCircleFolder(folderId))}
            />
            <CircleEditDialog
                visible={circleEditOpen}
                details={circleDetails}
                onClose={() => setCircleEditOpen(false)}
                onSubmit={async update => {
                    if (!circleDetails) {return;}
                    await saveCircleDetails(circleDetails.id, update);
                    await refreshCircles();
                }}
                onDelete={async () => {
                    if (!circleDetails) {return;}
                    await deleteCircle(circleDetails.id);
                    await refreshCircles();
                }}
            />
            <CircleMembersDialog
                visible={circleMembersOpen}
                circleId={server?.id ?? ''}
                circleName={circleDetails?.name ?? server?.name ?? ''}
                currentUserId={currentUserId}
                isCircleOwner={Boolean(circleDetails?.is_owner)}
                onClose={() => setCircleMembersOpen(false)}
            />
            <CircleNameDialog
                visible={circleNameDialogOpen}
                kind="circle"
                onClose={() => setCircleNameDialogOpen(false)}
                onSubmit={async name => {
                    await createCircle(name);
                    await refreshCircles();
                }}
            />
        </SafeAreaView>
    );
}

const createStyles = (colors: ThemeColors, wide: boolean) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    screen: { flex: 1, backgroundColor: colors.background },
    topBar: { minHeight: 70, paddingHorizontal: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    topBarMobile: { minHeight: 104, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: 8 },
    brandBlock: { flexDirection: 'row', alignItems: 'center', gap: 11 },
    backButton: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
    brandGlyph: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#2B776A', alignItems: 'center', justifyContent: 'center' },
    eyebrow: { color: colors.textSecondary, fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
    screenTitle: { color: colors.text, fontSize: 19, fontWeight: '700', marginTop: 1 },
    modeSwitch: { flexDirection: 'row', gap: 3, padding: 3, backgroundColor: colors.iconBg, borderRadius: 10 },
    modeSwitchMobile: { width: '100%' },
    modeButton: { minHeight: 36, paddingHorizontal: wide ? 13 : 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 8 },
    modeButtonMobile: { flex: 1 },
    modeButtonActive: { backgroundColor: colors.surface },
    modeLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    modeLabelActive: { color: colors.text },
    workspace: { flex: 1, flexDirection: 'row' },
    serverRail: { width: wide ? 68 : 64, flexGrow: 0, flexShrink: 0, backgroundColor: colors.iconBg, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.divider },
    serverRailContent: { alignItems: 'center', paddingTop: 12, paddingBottom: 16, gap: 8 },
    railHeading: { alignItems: 'center', gap: 5 },
    railLabel: { color: colors.textSecondary, fontSize: 9, fontWeight: '800', marginBottom: 4 },
    railStatus: { color: colors.textSecondary, fontSize: 9 },
    railFolderLabel: { maxWidth: 58, color: colors.textSecondary, fontSize: 8, fontWeight: '700' },
    serverButton: { width: 54, height: 54, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    serverButtonActive: { width: 62 },
    serverMark: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    serverMarkActive: { borderRadius: 13 },
    serverInitials: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    serverIndicator: { position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: colors.accent },
    conversationList: { width: wide ? 224 : '100%', maxWidth: wide ? 260 : undefined, backgroundColor: colors.background, borderRightWidth: wide ? StyleSheet.hairlineWidth : 0, borderRightColor: colors.divider, paddingHorizontal: 12, paddingTop: 15 },
    listHeadingRow: { height: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 5 },
    listHeading: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    serverName: { color: colors.text, fontSize: 16, fontWeight: '700', paddingHorizontal: 6, paddingTop: 12, paddingBottom: 14 },
    listStatus: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, paddingHorizontal: 6, paddingVertical: 12 },
    retryRow: { paddingHorizontal: 6, paddingVertical: 8, gap: 7 },
    listError: { color: colors.danger, fontSize: 12, lineHeight: 17 },
    retryText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
    chatPane: { flex: 1, minWidth: 0, backgroundColor: colors.background },
    mobileWorkspace: { flex: 1, flexDirection: 'row', position: 'relative' },
    mobileDirectPage: { flex: 1, backgroundColor: colors.background },
    mobileInbox: { flex: 1, backgroundColor: colors.background },
    inboxHeading: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
    inboxTitle: { color: colors.text, fontSize: 21, fontWeight: '700' },
    inboxSubtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
});
