import React, { useEffect, useMemo } from 'react';
import { View, Text, Image, StyleSheet, Button, Pressable } from 'react-native';
import { Logout } from '../services/api/auth/auth';
import { useCUserStore } from '../services/storage/store/cUserStore';
import { getCurrentUser } from '../services/api/user/currentUser';
import ScreenHeader from '../components/common/ScreenHeader';
import { useTheme } from '../theme/useTheme';


export const ProfileScreen = () => {

    // const removeUserToken = useUTStore((state) => state.logout);
    const  updateProfile  = useCUserStore(state => state.updateProfile);
    const username = useCUserStore(state => state.username);
    const profilePic = useCUserStore(state => state.profilePic);
    const bio = useCUserStore(state => state.bio);
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const handleLogout = () => {
        Logout();
    }

    useEffect(() => {
        getCurrentUser(updateProfile);
    }, [updateProfile]);
    return (
        <View style={styles.container}>
            <ScreenHeader title={username} subtitle="150 posts" />

            <View
                style={styles.pageContainer}>
                <Image
                    source={profilePic ? { uri: profilePic } : undefined}
                    style={styles.userPanel}
                />
                <View
                    style={styles.innerUserHeader}>
                    <View style={{flexDirection:'row'}}>
                        <Image
                            source={profilePic ? { uri: profilePic } : require('../icons/avatarB.png')}
                            style={styles.avatar}/>
                            <Pressable
                                android_disableSound={true}
                                style={({ pressed }) => [
                                    {
                                    backgroundColor: pressed ? colors.iconBg : colors.surface,
                                    borderColor: colors.divider,
                                    borderWidth: 1,
                                    borderRadius: 20,
                                    height: 35,
                                    width: 100,
                                    marginTop: 50,
                                    marginLeft: 'auto',
                                    marginRight: 20,
                                    alignItems:'center',
                                    },
                                ]}
                                onPress={() => {
                                    console.log("Edit Profile")
                                }}>
                                <Text style={{color: colors.text, alignContent: 'center', margin:'auto'}}>
                                    Edit Profile</Text>
                            </Pressable>
                    </View>

                    <Text style={styles.username}>
                        {username}
                    </Text>
                    <Text style={styles.bio}>
                        {bio}
                    </Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.stat}>
                            <Text style={styles.statNumber}>351</Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statNumber}>180</Text>
                            <Text style={styles.statLabel}>Following</Text>
                        </View>
                    </View>
                </View>
                    <Button
                    style={{fontSize: 20, color: 'green'}}
                    styleDisabled={{color: 'red'}}
                    title="Sign Out"
                    color={colors.accent}
                    onPress={handleLogout}
                    >
                    </Button>
                <View
                    style={styles.postSection}>
                    {/* posts */}
                </View>
            </View>

        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    pageTitleContainer: {
        marginLeft: 20,
        marginTop: 0,
    },
    pageTitle: {
        // backgroundColor: '#ff0073ff',
        fontSize: 19,
    },
    pageDesc: {
        // backgroundColor: '#ff0073ff',
    },
    container: {
        alignItems: 'center',
        backgroundColor: colors.background,
        flex: 1,
    },
    backButton: {
        // backgroundColor: '#ff0000ff',
        marginLeft: 10,
        marginTop: 10,
        borderRadius: 50,
    },
    pageContainer: {
        // margin: 'auto',
        marginTop: 0,
        // backgroundColor: '#ff0000ff',
        width: '100%'
    },
    innerUserHeader: {
        marginTop: 80,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 50,
        marginLeft: '20',
        marginBottom: 0,
        borderWidth: 3,
        borderColor: colors.divider
    },
    userPanel:{
        width: '100%',
        height: 120,
        top: 0,
        position: 'absolute',
        backgroundColor: colors.iconBg,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginLeft: '20',
        marginTop: '15',
        marginBottom: 8,
    },
    bio: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: 15,
        marginLeft: '20',

    },
    statsContainer: {
        flexDirection: 'row',
        // justifyContent: 'space-between',
        // width: '100%',
        // backgroundColor: '#3eda00ff',
        // margin: 'auto',
    },
    stat: {
        alignItems: 'center',
        // margin: 'auto',
        marginLeft: 20,
        flexDirection: 'row',
        gap: 5,
    },
    statNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text,
    },
    statLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    header: {
        marginTop: 0,
        backgroundColor: colors.surface,
        width: '100%',
        flexDirection: 'row',
        paddingBottom: 10,
        height: 50,
    },
    hamburgerButtonContainer: {
        margin: 'auto',
        marginRight: 20,
        width: 32,
        height: 32,
    },
    postSection:{
        marginTop: 20,
        borderColor: colors.divider,
        borderTopWidth: 1,
        width: '100%',
        // backgroundColor: '#0077ffff',
    }
});

export default ProfileScreen;