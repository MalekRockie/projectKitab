import React, { useEffect, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCUserStore } from '../services/storage/store/cUserStore';
import { getCurrentUser } from '../services/api/user/currentUser';
import ScreenHeader from '../components/common/ScreenHeader';
import ProfilePostsPager from '../components/profile/ProfilePostsPager';
import { useTheme } from '../theme/useTheme';

export const ProfileScreen = () => {
    const updateProfile = useCUserStore(state => state.updateProfile);
    const username = useCUserStore(state => state.username);
    const profilePic = useCUserStore(state => state.profilePic);
    const bio = useCUserStore(state => state.bio);
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    useEffect(() => {
        getCurrentUser(updateProfile);
    }, [updateProfile]);

    return (
        <View style={styles.container}>
            <ScreenHeader title={username} subtitle="Profile" />
            <View style={styles.profileSummary}>
                <View style={styles.cover}>
                    {profilePic ? <Image source={{ uri: profilePic }} style={styles.coverImage} /> : null}
                </View>
                <View style={styles.identityRow}>
                    <Image
                        source={profilePic ? { uri: profilePic } : require('../icons/avatarB.png')}
                        style={styles.avatar}
                    />
                    <Pressable
                        android_disableSound={true}
                        style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
                        onPress={() => console.log('Edit Profile')}
                    >
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </Pressable>
                </View>
                <Text style={styles.username}>{username}</Text>
                {bio ? <Text style={styles.bio}>{bio}</Text> : null}
                <View style={styles.profileDetails}>
                    <Text style={styles.summaryMeta}>Location not set</Text>
                    <Text style={styles.summaryMeta}>Joined [date]</Text>
                </View>
            </View>
            <ProfilePostsPager />
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
    bio: {
        color: colors.textSecondary,
        fontSize: 14,
        marginHorizontal: 20,
        marginTop: 5,
    },
    profileDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
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
