import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';
import { Server } from '../../data/circles';
import ChannelRow from './ChannelRow';
import { CIRCLE_DRAWER_WIDTH, CIRCLE_RAIL_WIDTH, CircleDrawerController } from './useCircleDrawer';

type CircleDrawerProps = {
    drawer: CircleDrawerController;
    servers: Server[];
    server: Server;
    roomId: string;
    onChooseServer: (server: Server) => void;
    onChooseRoom: (roomId: string) => void;
    onOpenDirect: () => void;
};

export default function CircleDrawer({ drawer, servers, server, roomId, onChooseServer, onChooseRoom, onOpenDirect }: CircleDrawerProps) {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <>
            {drawer.open ? <Pressable onPress={drawer.closeDrawer} style={styles.backdrop} accessibilityRole="button" accessibilityLabel="Close Circle and channel navigation" /> : null}
            <View pointerEvents={drawer.open ? 'auto' : 'none'} style={styles.clip}>
                <GestureDetector gesture={drawer.dragGesture}>
                    <Animated.View style={[styles.drawer, drawer.style]}>
                        <ScrollView style={styles.rail} contentContainerStyle={styles.railContent} showsVerticalScrollIndicator={false}>
                            <Text style={styles.railLabel}>CIRCLES</Text>
                            {servers.map(item => (
                                <Pressable key={item.id} onPress={() => onChooseServer(item)} style={[styles.circleButton, server.id === item.id && styles.circleButtonActive]} accessibilityRole="button" accessibilityLabel={item.name}>
                                    <View style={[styles.circleMark, { backgroundColor: item.tint }, server.id === item.id && styles.circleMarkActive]}><Text style={styles.circleInitials}>{item.initials}</Text></View>
                                    {server.id === item.id ? <View style={styles.circleIndicator} /> : null}
                                </Pressable>
                            ))}
                            <Pressable onPress={onOpenDirect} style={styles.dmButton} accessibilityRole="button" accessibilityLabel="Open direct messages"><Icon name="chat-bubble-outline" size={19} color={colors.textSecondary} /></Pressable>
                        </ScrollView>
                        <View style={styles.channels}>
                            <View style={styles.heading}>
                                <Text numberOfLines={1} style={styles.circleName}>{server.name}</Text>
                                <Pressable onPress={drawer.closeDrawer} style={styles.close} accessibilityRole="button" accessibilityLabel="Close Circle and channel navigation"><Icon name="close" size={21} color={colors.textSecondary} /></Pressable>
                            </View>
                            <Text style={styles.sectionLabel}>CHANNELS</Text>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {server.rooms.map(item => (
                                    <ChannelRow key={item.id} name={item.name} active={roomId === item.id} unread={item.id === 'general' && server.id === servers[0].id} onPress={() => onChooseRoom(item.id)} />
                                ))}
                            </ScrollView>
                        </View>
                    </Animated.View>
                </GestureDetector>
            </View>
        </>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 4, backgroundColor: 'rgba(0,0,0,0.28)' },
    clip: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: CIRCLE_DRAWER_WIDTH, overflow: 'hidden', zIndex: 5, elevation: 8 },
    drawer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: CIRCLE_DRAWER_WIDTH, flexDirection: 'row', backgroundColor: colors.background, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.divider },
    rail: { width: CIRCLE_RAIL_WIDTH, flexGrow: 0, flexShrink: 0, backgroundColor: colors.iconBg, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.divider },
    railContent: { alignItems: 'center', paddingTop: 12, paddingBottom: 16, gap: 8 },
    railLabel: { color: colors.textSecondary, fontSize: 9, fontWeight: '800', marginBottom: 4 },
    circleButton: { width: 58, height: 52, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    circleButtonActive: { width: CIRCLE_RAIL_WIDTH },
    circleMark: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    circleMarkActive: { borderRadius: 13 },
    circleInitials: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    circleIndicator: { position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: colors.accent },
    dmButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    channels: { flex: 1, minWidth: 0, paddingHorizontal: 10, paddingTop: 12, backgroundColor: colors.background },
    heading: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider, marginBottom: 12 },
    circleName: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700' },
    close: { width: 34, height: 36, alignItems: 'center', justifyContent: 'center' },
    sectionLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingBottom: 8 },
});
