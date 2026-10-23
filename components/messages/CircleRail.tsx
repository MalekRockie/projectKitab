import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
    SharedValue,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';
import { Circle, CircleFolder, CircleLayoutItem, buildCircleLayout } from '../../services/api/messages/circles';

export type CircleDropTarget = { type: 'circle' | 'folder'; id: string };
export type CircleDragEntity = { type: 'circle' | 'folder'; id: string };

type CircleRailProps = {
    circles: Circle[];
    folders: CircleFolder[];
    selectedCircleId: string | null;
    loading: boolean;
    error: string | null;
    onChooseCircle: (circleId: string) => void;
    onCreateCircle: () => void;
    onManageFolders: () => void;
    onRetry: () => void;
    onDropCircle: (circleId: string, target: CircleDropTarget) => void;
    onReorder: (entity: CircleDragEntity, targetIndex: number) => void;
};

const TARGET_KEY_PREFIX = 'circle-rail-target:';
const RAIL_WIDTH = 64;
const RAIL_CENTER = RAIL_WIDTH / 2;
const PREVIEW_SIZE = 48;
const CIRCLE_COLORS = [
    '#3659C9',
    '#7748B8',
    '#087F8C',
    '#347A46',
    '#A65D00',
    '#B54156',
    '#5551A8',
    '#2D6F91',
];

export const getCircleColor = (circleId: string) => {
    const hash = Array.from(circleId).reduce((value, character) => (
        (value * 31 + character.charCodeAt(0)) % 1000003
    ), 0);
    return CIRCLE_COLORS[hash % CIRCLE_COLORS.length];
};

type FolderDropGroupProps = {
    folderId: string;
    expanded: boolean;
    activeFolderId: SharedValue<string>;
    style: StyleProp<ViewStyle>;
    children: React.ReactNode;
};

function FolderDropGroup({ folderId, expanded, activeFolderId, style, children }: FolderDropGroupProps) {
    const colors = useTheme();
    const targetBackground = colors.background === '#000000'
        ? 'rgba(112, 183, 255, 0.2)'
        : 'rgba(0, 102, 204, 0.14)';
    const expandedBackground = colors.background === '#000000'
        ? 'rgba(112, 183, 255, 0.09)'
        : 'rgba(0, 102, 204, 0.06)';
    const dropStyle = useAnimatedStyle(() => {
        const isTarget = activeFolderId.value === folderId;
        return {
            backgroundColor: withTiming(
                isTarget ? targetBackground : expanded ? expandedBackground : 'transparent',
                { duration: 110 },
            ),
            borderColor: withTiming(
                isTarget ? colors.accent : expanded ? colors.divider : 'transparent',
                { duration: 110 },
            ),
            borderWidth: isTarget ? 2 : expanded ? 1 : 0,
            transform: [{ scale: withTiming(isTarget ? 1.035 : 1, { duration: 110 }) }],
        };
    }, [colors.accent, colors.divider, expanded, expandedBackground, folderId, targetBackground]);

    return (
        <Animated.View layout={LinearTransition.springify().damping(18)} style={[style, dropStyle]}>
            {children}
        </Animated.View>
    );
}

export default function CircleRail({
    circles, folders, selectedCircleId, loading, error, onChooseCircle,
    onCreateCircle, onManageFolders, onRetry, onDropCircle, onReorder,
}: CircleRailProps) {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const rootRef = useRef<View>(null);
    const targetRefs = useRef(new Map<string, View>());
    const slotRefs = useRef(new Map<string, View>());
    const [draggedEntity, setDraggedEntity] = useState<CircleDragEntity | null>(null);
    const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set());
    const rootOriginX = useSharedValue(0);
    const rootOriginY = useSharedValue(0);
    const dragY = useSharedValue(0);
    const dropLineY = useSharedValue(0);
    const isDragging = useSharedValue(false);
    const draggedType = useSharedValue<CircleDragEntity['type'] | ''>('');
    const activeFolderId = useSharedValue('');
    const dragSlots = useSharedValue<Array<{ top: number; height: number }>>([]);
    const folderBounds = useSharedValue<Array<{ id: string; left: number; top: number; width: number; height: number }>>([]);
    const layout = useMemo(() => buildCircleLayout(circles, folders), [circles, folders]);
    const circleMap = useMemo(() => new Map(circles.map(circle => [circle.id, circle])), [circles]);
    const folderMap = useMemo(() => new Map(folders.map(folder => [folder.id, folder])), [folders]);

    const setRootPosition = () => {
        rootRef.current?.measureInWindow((x, y) => {
            rootOriginX.value = x;
            rootOriginY.value = y;
        });
    };

    const measureRefs = (refs: Map<string, View>) => Promise.all(
        Array.from(refs.entries()).map(([key, ref]) => new Promise<{ key: string; left: number; top: number; width: number; height: number }>(resolve => {
            ref.measureInWindow((left, top, width, height) => resolve({ key, left, top, width, height }));
        })),
    );

    const prepareDropSlots = (entity: CircleDragEntity) => {
        Promise.all([measureRefs(slotRefs.current), measureRefs(targetRefs.current)]).then(([slots, targets]) => {
            dragSlots.value = slots
                .filter(slot => slot.key !== `${entity.type}:${entity.id}`)
                .sort((a, b) => a.top - b.top)
                .map(slot => ({ top: slot.top, height: slot.height }));
            folderBounds.value = targets
                .filter(target => target.key.includes(':folder:'))
                .map(target => ({
                    id: target.key.split(':').slice(2).join(':'),
                    left: target.left,
                    top: target.top,
                    width: target.width,
                    height: target.height,
                }));
        }).catch(measureError => {
            console.warn('Could not measure circle rail drop positions', measureError);
        });
    };

    const handleDrop = async (entity: CircleDragEntity, x: number, y: number) => {
        try {
            if (entity.type === 'circle') {
                const targets = await measureRefs(targetRefs.current);
                const hitTarget = targets.find(target => {
                    if (target.key === `${TARGET_KEY_PREFIX}circle:${entity.id}`) {
                        return false;
                    }
                    const isCircle = target.key.includes(':circle:');
                    const horizontalInset = isCircle ? target.width * 0.25 : 0;
                    const verticalInset = isCircle ? target.height * 0.25 : 0;
                    return x >= target.left + horizontalInset
                        && x <= target.left + target.width - horizontalInset
                        && y >= target.top + verticalInset
                        && y <= target.top + target.height - verticalInset;
                });
                if (hitTarget) {
                    const [type, ...idParts] = hitTarget.key
                        .slice(TARGET_KEY_PREFIX.length)
                        .split(':');
                    const id = idParts.join(':');
                    onDropCircle(entity.id, { type: type as CircleDropTarget['type'], id });
                    return;
                }
                const folderTarget = targets.find(target =>
                    target.key.includes(':folder:')
                    && x >= target.left && x <= target.left + target.width
                    && y >= target.top && y <= target.top + target.height,
                );
                if (folderTarget) {
                    onDropCircle(entity.id, { type: 'folder', id: folderTarget.key.split(':').slice(2).join(':') });
                    return;
                }
            }

            const slots = await measureRefs(slotRefs.current);
            const orderedSlots = slots
                .filter(slot => slot.key !== `${entity.type}:${entity.id}`)
                .sort((a, b) => a.top - b.top);
            const targetIndex = orderedSlots.findIndex(slot => y < slot.top + slot.height / 2);
            onReorder(entity, targetIndex < 0 ? orderedSlots.length : targetIndex);
        } catch (measureError) {
            console.warn('Could not determine circle drop target', measureError);
        }
    };

    const registerTarget = (type: CircleDropTarget['type'], id: string, ref: View | null) => {
        const key = `${TARGET_KEY_PREFIX}${type}:${id}`;
        if (ref) {
            targetRefs.current.set(key, ref);
        } else {
            targetRefs.current.delete(key);
        }
    };

    const registerSlot = (type: CircleDragEntity['type'], id: string, ref: View | null) => {
        const key = `${type}:${id}`;
        if (ref) {
            slotRefs.current.set(key, ref);
        } else {
            slotRefs.current.delete(key);
        }
    };

    const floatingStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: RAIL_CENTER - PREVIEW_SIZE / 2 },
            { translateY: dragY.value - rootOriginY.value - 24 },
        ],
        opacity: isDragging.value && draggedType.value === 'circle' ? 1 : 0,
    }));

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: dropLineY.value }],
        opacity: isDragging.value && !activeFolderId.value ? 1 : 0,
    }));

    const makeDragGesture = (entity: CircleDragEntity) => Gesture.Pan()
        .activateAfterLongPress(350)
        .onStart(event => {
            runOnJS(setRootPosition)();
            runOnJS(prepareDropSlots)(entity);
            dragY.value = event.absoluteY;
            isDragging.value = true;
            draggedType.value = entity.type;
            activeFolderId.value = '';
            dropLineY.value = event.absoluteY - rootOriginY.value;
            runOnJS(setDraggedEntity)(entity);
        })
        .onUpdate(event => {
            dragY.value = event.absoluteY;
            const railX = rootOriginX.value + RAIL_CENTER;
            const folder = draggedType.value === 'circle'
                ? folderBounds.value.find(target =>
                    railX >= target.left
                    && railX <= target.left + target.width
                    && event.absoluteY >= target.top
                    && event.absoluteY <= target.top + target.height,
                )
                : undefined;
            const nextFolderId = folder?.id ?? '';
            if (activeFolderId.value !== nextFolderId) {
                activeFolderId.value = nextFolderId;
            }

            const nextSlot = dragSlots.value.find(slot => event.absoluteY < slot.top + slot.height / 2);
            const lastSlot = dragSlots.value.length ? dragSlots.value[dragSlots.value.length - 1] : undefined;
            const lineTop = nextSlot?.top ?? (lastSlot ? lastSlot.top + lastSlot.height : undefined);
            if (lineTop !== undefined) {
                dropLineY.value = lineTop - rootOriginY.value;
            }
        })
        .onEnd(event => {
            runOnJS(handleDrop)(entity, rootOriginX.value + RAIL_CENTER, event.absoluteY);
            isDragging.value = false;
            draggedType.value = '';
            activeFolderId.value = '';
            runOnJS(setDraggedEntity)(null);
        })
        .onFinalize(() => {
            isDragging.value = false;
            draggedType.value = '';
            activeFolderId.value = '';
            runOnJS(setDraggedEntity)(null);
        });

    const renderCircle = (circleId: string) => {
        const circle = circleMap.get(circleId);
        if (!circle) {return null;}
        const circleColor = getCircleColor(circle.id);
        const initials = circle.name.trim().split(/\s+/).slice(0, 2)
            .map(part => part[0]?.toUpperCase() ?? '').join('') || '?';
        return (
            <GestureDetector key={circle.id} gesture={makeDragGesture({ type: 'circle', id: circle.id })}>
                <View
                    ref={ref => registerTarget('circle', circle.id, ref)}
                    collapsable={false}
                >
                    <Animated.View
                        layout={LinearTransition.springify().damping(18)}
                        style={[styles.circleButton, selectedCircleId === circle.id && styles.circleButtonActive, draggedEntity?.type === 'circle' && draggedEntity.id === circle.id && styles.draggedCircle]}
                    >
                        <Pressable
                            onPress={() => onChooseCircle(circle.id)}
                            accessibilityRole="button"
                            accessibilityLabel={circle.name}
                            accessibilityHint="Hold and drag onto another circle to create a folder, or onto a folder to move it."
                        >
                            <View style={[styles.circleMark, { backgroundColor: circleColor }]}>
                                <Text style={styles.circleInitials}>{initials}</Text>
                            </View>
                        </Pressable>
                        {selectedCircleId === circle.id ? <View style={styles.circleIndicator} /> : null}
                    </Animated.View>
                </View>
            </GestureDetector>
        );
    };

    const renderFolder = (folderId: string) => {
        const folder = folderMap.get(folderId);
        if (!folder) {return null;}
        const folderCircles = circles.filter(circle => circle.folder_id === folder.id)
            .sort((a, b) => a.display_order - b.display_order);
        const expanded = expandedFolderIds.has(folder.id);
        const selectedInFolder = folderCircles.some(circle => circle.id === selectedCircleId);
        return (
            <FolderDropGroup
                key={folder.id}
                folderId={folder.id}
                expanded={expanded}
                activeFolderId={activeFolderId}
                style={[
                    styles.folderGroup,
                    expanded && styles.folderGroupExpanded,
                    draggedEntity?.type === 'folder' && draggedEntity.id === folder.id && styles.draggedCircle,
                ]}
            >
                <GestureDetector gesture={makeDragGesture({ type: 'folder', id: folder.id })}>
                    <View
                        ref={ref => {
                            registerTarget('folder', folder.id, ref);
                            registerSlot('folder', folder.id, ref);
                        }}
                        collapsable={false}
                        style={styles.folderTarget}
                    >
                        {!expanded && selectedInFolder ? <View style={styles.folderIndicator} /> : null}
                        <Pressable
                            onPress={() => setExpandedFolderIds(previous => {
                                const next = new Set(previous);
                                if (next.has(folder.id)) {
                                    next.delete(folder.id);
                                } else {
                                    next.add(folder.id);
                                }
                                return next;
                            })}
                            accessibilityRole="button"
                            accessibilityState={{ expanded }}
                            accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${folder.name}, ${folderCircles.length} circles`}
                            style={styles.folderButton}
                        >
                            <View style={styles.folderPreview}>
                                {folderCircles.slice(0, 4).map((circle, index) => {
                                    const initial = circle.name.trim()[0]?.toUpperCase() ?? '?';
                                    return (
                                        <View
                                            key={circle.id}
                                            style={[
                                                styles.folderMiniCircle,
                                                { backgroundColor: getCircleColor(circle.id) },
                                                index % 2 === 0 && styles.folderMiniLeft,
                                            ]}
                                        >
                                            <Text style={styles.folderMiniInitial}>{initial}</Text>
                                        </View>
                                    );
                                })}
                                {!folderCircles.length ? <Icon name="folder" size={24} color={colors.accent} /> : null}
                                {folderCircles.length > 4 ? (
                                    <View style={styles.folderOverflow}>
                                        <Text style={styles.folderOverflowText}>+{folderCircles.length - 4}</Text>
                                    </View>
                                ) : null}
                            </View>
                            <Text numberOfLines={1} style={styles.folderLabel}>{folder.name}</Text>
                            <Icon name={expanded ? 'expand-less' : 'expand-more'} size={15} color={colors.textSecondary} />
                        </Pressable>
                    </View>
                </GestureDetector>
                {expanded ? (
                    <Animated.View
                        entering={FadeIn.duration(140)}
                        exiting={FadeOut.duration(110)}
                        layout={LinearTransition.springify().damping(18)}
                        style={styles.folderContents}
                    >
                        {folderCircles.map(circle => renderCircle(circle.id))}
                    </Animated.View>
                ) : null}
            </FolderDropGroup>
        );
    };

    const renderLayoutEntry = (entry: CircleLayoutItem) => {
        if (entry.type === 'circle') {return renderCircle(entry.id);}
        const folder = renderFolder(entry.id);
        return (
            folder
        );
    };

    return (
        <View ref={rootRef} collapsable={false} onLayout={setRootPosition} style={styles.root}>
            <View style={styles.heading}>
                <Text style={styles.railLabel}>CIRCLES</Text>
                <View style={styles.headingActions}>
                    <Pressable onPress={onManageFolders} accessibilityRole="button" accessibilityLabel="Manage folders">
                        <Icon name="settings" size={17} color={colors.textSecondary} />
                    </Pressable>
                    <Pressable onPress={onCreateCircle} accessibilityRole="button" accessibilityLabel="Create circle">
                        <Icon name="add-circle-outline" size={20} color={colors.textSecondary} />
                    </Pressable>
                </View>
            </View>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? <Text style={styles.status}>Loading…</Text> : null}
                {error ? (
                    <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel="Retry loading circles">
                        <Icon name="refresh" size={20} color={colors.danger} />
                    </Pressable>
                ) : null}
                {layout.map(item => {
                    const id = item.id;
                    return item.type === 'circle' ? (
                        <View
                            key={`circle-slot-${id}`}
                            ref={ref => registerSlot('circle', id, ref)}
                            collapsable={false}
                        >
                            <Animated.View layout={LinearTransition.springify().damping(18)}>
                                {renderLayoutEntry(item)}
                            </Animated.View>
                        </View>
                    ) : renderLayoutEntry(item);
                })}
            </ScrollView>
            {draggedEntity ? (
                <Animated.View pointerEvents="none" style={[styles.dropIndicator, indicatorStyle]} />
            ) : null}
            {draggedEntity?.type === 'circle' ? (
                <Animated.View pointerEvents="none" style={[styles.dragPreview, floatingStyle]}>
                    <View style={styles.previewCircle}>
                        <Text style={styles.previewInitials}>
                            {circleMap.get(draggedEntity.id)?.name.trim().split(/\s+/).slice(0, 2)
                                .map(part => part[0]?.toUpperCase() ?? '').join('') || '?'}
                        </Text>
                    </View>
                    <View style={styles.copyBadge}><Icon name="content-copy" size={13} color="#FFFFFF" /></View>
                </Animated.View>
            ) : null}
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    root: { width: 64, height: '100%', flexGrow: 0, flexShrink: 0, backgroundColor: colors.iconBg, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.divider, overflow: 'visible' },
    heading: { alignItems: 'center', gap: 6, paddingTop: 12, paddingBottom: 8 },
    headingActions: { flexDirection: 'row', gap: 7 },
    railLabel: { color: colors.textSecondary, fontSize: 9, fontWeight: '800' },
    scroll: { flex: 1 },
    content: { alignItems: 'center', gap: 7, paddingBottom: 16 },
    status: { color: colors.textSecondary, fontSize: 8 },
    circleButton: { width: 58, height: 50, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    circleButtonActive: { width: 64 },
    draggedCircle: { opacity: 0.35 },
    circleMark: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.24)' },
    circleInitials: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
    circleIndicator: { position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: colors.accent },
    folderIndicator: { position: 'absolute', left: -3, top: 14, bottom: 14, width: 3, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: colors.accent },
    folderTarget: { width: 58, minHeight: 62, alignItems: 'center', justifyContent: 'center' },
    folderGroup: { alignItems: 'center', width: '100%', borderRadius: 12, paddingVertical: 4 },
    folderGroupExpanded: { backgroundColor: colors.background === '#000000' ? 'rgba(112, 183, 255, 0.09)' : 'rgba(0, 102, 204, 0.06)', marginVertical: 3, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.divider },
    folderContents: { width: '100%', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider, marginTop: 3, paddingTop: 3, gap: 2 },
    folderButton: { width: 58, minHeight: 62, alignItems: 'center', justifyContent: 'center' },
    folderPreview: { width: 38, height: 34, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', alignItems: 'center', justifyContent: 'center', gap: 1, borderRadius: 9, backgroundColor: colors.background, position: 'relative' },
    folderMiniCircle: { width: 15, height: 15, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    folderMiniLeft: { marginRight: 1 },
    folderMiniInitial: { color: '#FFFFFF', fontSize: 7, fontWeight: '800' },
    folderOverflow: { position: 'absolute', right: -5, bottom: -4, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.iconBg },
    folderOverflowText: { color: '#FFFFFF', fontSize: 7, fontWeight: '800' },
    folderLabel: { maxWidth: 58, color: colors.text, fontSize: 8, fontWeight: '700' },
    dragPreview: { position: 'absolute', left: 0, top: 0, width: 48, height: 48, zIndex: 20, alignItems: 'center', justifyContent: 'center' },
    dropIndicator: { position: 'absolute', left: 5, right: 5, top: 0, height: 3, borderRadius: 2, backgroundColor: colors.accent, zIndex: 19, elevation: 8 },
    previewCircle: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 7 },
    previewInitials: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
    copyBadge: { position: 'absolute', right: 0, bottom: 0, width: 19, height: 19, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
