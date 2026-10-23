import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';
import { Server } from '../../data/circles';
import { Circle, CircleFolder } from '../../services/api/messages/circles';
import ChannelRow from './ChannelRow';
import CircleRail, { CircleDragEntity, CircleDropTarget } from './CircleRail';
import { CIRCLE_DRAWER_WIDTH, CircleDrawerController } from './useCircleDrawer';

type CircleDrawerProps = {
    drawer: CircleDrawerController;
    circles: Circle[];
    servers: Server[];
    server: Server | null;
    roomId: string;
    folders: CircleFolder[];
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    onCreateCircle: () => void;
    onManageFolders: () => void;
    onDropCircle: (circleId: string, target: CircleDropTarget) => void;
    onReorder: (entity: CircleDragEntity, targetIndex: number) => void;
    onChooseServer: (server: Server) => void;
    onChooseRoom: (roomId: string) => void;
    onOpenDirect: () => void;
    circleHeader?: React.ReactNode;
    memberCount?: number;
    onOpenMembers?: () => void;
};

export default function CircleDrawer({
    drawer, circles, servers, server, roomId, folders, loading, error, onRetry, onCreateCircle, onManageFolders, onDropCircle, onReorder,
    onChooseServer, onChooseRoom, onOpenDirect, circleHeader, memberCount, onOpenMembers,
}: CircleDrawerProps) {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <>
            {drawer.open ? <Pressable onPress={drawer.closeDrawer} style={styles.backdrop} accessibilityRole="button" accessibilityLabel="Close Circle and channel navigation" /> : null}
            <View pointerEvents={drawer.open ? 'auto' : 'none'} style={styles.clip}>
                <Animated.View style={[styles.drawer, drawer.style]}>
                    <CircleRail
                        circles={circles}
                        folders={folders}
                        selectedCircleId={server?.id ?? null}
                        loading={loading}
                        error={error}
                        onChooseCircle={circleId => {
                            const selected = servers.find(item => item.id === circleId);
                            if (selected) {
                                onChooseServer(selected);
                            }
                        }}
                        onCreateCircle={onCreateCircle}
                        onManageFolders={onManageFolders}
                        onRetry={onRetry}
                        onDropCircle={onDropCircle}
                        onReorder={onReorder}
                    />
                    <GestureDetector gesture={drawer.dragGesture}>
                        <View style={styles.channels}>
                            <View style={styles.heading}>
                                <View style={styles.headingText}>
                                    <Text numberOfLines={1} style={styles.circleName}>{server?.name ?? 'Circles'}</Text>
                                    {memberCount !== undefined ? (
                                        <Pressable onPress={onOpenMembers} accessibilityRole="button" accessibilityLabel="View members">
                                            <Text style={styles.memberCount}>{memberCount} {memberCount === 1 ? 'member' : 'members'}</Text>
                                        </Pressable>
                                    ) : null}
                                </View>
                                <View style={styles.headingActions}>
                                    <Pressable onPress={onOpenDirect} style={styles.close} accessibilityRole="button" accessibilityLabel="Open direct messages"><Icon name="chat-bubble-outline" size={19} color={colors.textSecondary} /></Pressable>
                                    <Pressable onPress={drawer.closeDrawer} style={styles.close} accessibilityRole="button" accessibilityLabel="Close Circle and channel navigation"><Icon name="close" size={21} color={colors.textSecondary} /></Pressable>
                                </View>
                            </View>
                            {circleHeader}
                            {server ? <>
                                <Text style={styles.sectionLabel}>CHANNELS</Text>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {server.rooms.map(item => (
                                        <ChannelRow key={item.id} name={item.name} active={roomId === item.id} unread={item.id === 'general' && server.id === servers[0]?.id} onPress={() => onChooseRoom(item.id)} />
                                    ))}
                                </ScrollView>
                            </> : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>{error ?? (loading ? 'Loading circles…' : 'Create a circle to get started.')}</Text>
                                    {error ? <Pressable onPress={onRetry}><Text style={styles.retryText}>Try again</Text></Pressable> : null}
                                </View>
                            )}
                        </View>
                    </GestureDetector>
                </Animated.View>
            </View>
        </>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 4, backgroundColor: 'rgba(0,0,0,0.28)' },
    clip: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: CIRCLE_DRAWER_WIDTH, overflow: 'hidden', zIndex: 5, elevation: 8 },
    drawer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: CIRCLE_DRAWER_WIDTH, flexDirection: 'row', backgroundColor: colors.background, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.divider },
    channels: { flex: 1, minWidth: 0, paddingHorizontal: 10, paddingTop: 12, backgroundColor: colors.background },
    heading: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider, marginBottom: 12 },
    headingActions: { flexDirection: 'row' },
    headingText: { flex: 1 },
    circleName: { color: colors.text, fontSize: 14, fontWeight: '700' },
    memberCount: { color: colors.textSecondary, fontSize: 11, marginTop: 1 },
    close: { width: 34, height: 36, alignItems: 'center', justifyContent: 'center' },
    sectionLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingBottom: 8 },
    emptyState: { paddingHorizontal: 10, paddingTop: 12, gap: 8 },
    emptyText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
    retryText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
});
