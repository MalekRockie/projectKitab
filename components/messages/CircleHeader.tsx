import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';
import { CircleDetails } from '../../services/api/messages/circles';
import { getCircleColor } from './CircleRail';

type CircleHeaderProps = {
    circleId: string;
    name: string;
    details: CircleDetails | null;
    canEdit: boolean;
    showName?: boolean;
    onEdit: () => void;
    onOpenMembers: () => void;
};

// Banner, icon and name for the opened circle. Falls back to the circle's
// color and initials until (or unless) details with images are available.
export default function CircleHeader({ circleId, name, details, canEdit, showName = true, onEdit, onOpenMembers }: CircleHeaderProps) {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const circleColor = getCircleColor(circleId);
    const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('') || '?';

    return (
        <View style={styles.root}>
            <View style={[styles.banner, { backgroundColor: circleColor }]}>
                {details?.banner_url ? <Image source={{ uri: details.banner_url }} style={styles.bannerImage} resizeMode="cover" /> : null}
                {canEdit ? (
                    <Pressable onPress={onEdit} style={styles.editButton} accessibilityRole="button" accessibilityLabel="Edit circle">
                        <Icon name="edit" size={15} color="#FFFFFF" />
                    </Pressable>
                ) : null}
            </View>
            <View style={styles.identity}>
                <View style={[styles.icon, { backgroundColor: circleColor }]}>
                    {details?.icon_url
                        ? <Image source={{ uri: details.icon_url }} style={styles.iconImage} />
                        : <Text style={styles.initials}>{initials}</Text>}
                </View>
                {showName ? (
                    <View style={styles.nameBlock}>
                        <Text numberOfLines={2} style={styles.name}>{name}</Text>
                        {details ? (
                            <Pressable onPress={onOpenMembers} accessibilityRole="button" accessibilityLabel="View members">
                                <Text style={styles.members}>{details.member_count} {details.member_count === 1 ? 'member' : 'members'}</Text>
                            </Pressable>
                        ) : null}
                    </View>
                ) : null}
            </View>
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    root: { marginBottom: 6 },
    banner: { height: 64, borderRadius: 12, overflow: 'hidden', alignItems: 'flex-end' },
    bannerImage: { ...StyleSheet.absoluteFillObject },
    editButton: { margin: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
    identity: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 8, marginTop: -18 },
    icon: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.background },
    iconImage: { width: '100%', height: '100%' },
    initials: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
    nameBlock: { flex: 1, paddingBottom: 2 },
    name: { color: colors.text, fontSize: 16, fontWeight: '700' },
    members: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
