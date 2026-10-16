import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCUserStore } from '../services/storage/store/cUserStore';
import { getCurrentUser, getPublicProfile } from '../services/api/user/currentUser';
import ScreenHeader from '../components/common/ScreenHeader';
import ProfilePostsPager from '../components/profile/ProfilePostsPager';
import { useTheme } from '../theme/useTheme';

export const ProfileScreen = ({ route }) => {
    const userId = route?.params?.userId;
    const updateProfile = useCUserStore(state => state.updateProfile);
    const currentUserId = useCUserStore(state => state.userId);
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [publicProfile, setPublicProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isCurrent = true;
        const loadProfile = async () => {
            setLoading(true);
            setPublicProfile(null);
            let profileId = userId ?? currentUserId;

            if (!profileId) {
                const account = await getCurrentUser(updateProfile);
                if (!isCurrent) return;
                profileId = account?.id;
            }

            const profile = profileId ? await getPublicProfile(profileId) : null;
            if (isCurrent) {
                setPublicProfile(profile);
                setLoading(false);
            }
        };

        loadProfile().catch(() => {
            if (isCurrent) setLoading(false);
        });
        return () => { isCurrent = false; };
    }, [currentUserId, updateProfile, userId]);

    const isSelf = publicProfile?.is_self === true;
    const shownUsername = publicProfile?.username;
    const shownDisplayName = publicProfile?.display_name;
    const shownProfilePic = publicProfile?.profile_pic;
    const shownBio = publicProfile?.bio;
    const joinedDate = publicProfile?.created_at
        ? new Date(publicProfile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
        : null;

    return (
        <View style={styles.container}>
            <ScreenHeader title={shownUsername || 'Profile'} subtitle="Profile" />
            {loading ? <ActivityIndicator style={styles.loading} color={colors.accent} /> : null}
            {!loading && !publicProfile ? (
                <Text style={styles.error}>Could not load this profile.</Text>
            ) : null}
            {!loading && publicProfile ? <>
            <View style={styles.profileSummary}>
                <View style={styles.cover}>
                    {shownProfilePic ? <Image source={{ uri: shownProfilePic }} style={styles.coverImage} /> : null}
                </View>
                <View style={styles.identityRow}>
                    <Image
                        source={shownProfilePic ? { uri: shownProfilePic } : require('../icons/avatarB.png')}
                        style={styles.avatar}
                    />
                    {isSelf ? <Pressable
                        android_disableSound={true}
                        style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
                        onPress={() => console.log('Edit Profile')}
                    >
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </Pressable> : null}
                </View>
                {shownDisplayName ? <Text style={styles.displayName}>{shownDisplayName}</Text> : null}
                <Text style={styles.username}>{shownUsername}</Text>
                {shownBio ? <Text style={styles.bio}>{shownBio}</Text> : null}
                <View style={styles.profileDetails}>
                    <Text style={styles.summaryMeta}>{publicProfile.followers_count ?? 0} followers</Text>
                    <Text style={styles.summaryMeta}>{publicProfile.following_count ?? 0} following</Text>
                    {joinedDate ? <Text style={styles.summaryMeta}>Joined {joinedDate}</Text> : null}
                </View>
            </View>
            <ProfilePostsPager available={isSelf} />
            </> : null}
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    profileSummary: {
        backgroundColor: colors.background,
    },
    loading: {
        marginTop: 32,
    },
    error: {
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 32,
    },
    cover: {
        height: 80,
        backgroundColor: colors.iconBg,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    identityRow: {
        minHeight: 58,
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
    },
    avatar: {
        width: 68,
        height: 68,
        marginTop: -28,
        borderRadius: 34,
        borderWidth: 3,
        borderColor: colors.background,
        backgroundColor: colors.iconBg,
    },
    editButton: {
        minHeight: 34,
        minWidth: 104,
        marginLeft: 'auto',
        marginTop: 10,
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.divider,
        backgroundColor: colors.surface,
    },
    editButtonPressed: {
        backgroundColor: colors.iconBg,
    },
    editButtonText: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '600',
    },
    username: {
        color: colors.text,
        fontSize: 21,
        fontWeight: '700',
        marginHorizontal: 20,
        marginTop: 4,
    },
    displayName: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '600',
        marginHorizontal: 20,
        marginTop: 4,
    },
    bio: {
        color: colors.textSecondary,
        fontSize: 14,
        marginHorizontal: 20,
        marginTop: 5,
    },
    profileDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 14,
        rowGap: 8,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 14,
    },
    summaryMeta: {
        color: colors.textSecondary,
        fontSize: 13,
    },
});

export default ProfileScreen;
