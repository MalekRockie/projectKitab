import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Button, TouchableOpacity, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Logout } from '../services/api/auth/auth';
import { useCUserStore } from '../services/storage/store/cUserStore';
import { getCurrentUser } from '../services/api/user/currentUser';
import Icon from 'react-native-vector-icons/Ionicons';


export const ProfileScreen = () => {

    const navigation = useNavigation();
    // const removeUserToken = useUTStore((state) => state.logout);
    const  updateProfile  = useCUserStore(state => state.updateProfile);

    const handleLogout = () => {
        Logout();
    }

    useEffect(() => {
        getCurrentUser(updateProfile);
    })
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <View
                    style={styles.pageTitleContainer}>
                    <Text style={styles.pageTitle}>
                        {useCUserStore((state) => state.username)}
                    </Text>
                    <Text>
                        150 posts
                    </Text>
                </View>
                <TouchableOpacity
                    title="Open Drawer"
                    onPress={() => navigation.toggleDrawer()}
                    style={styles.hamburgerButtonContainer}
                    >
                    <Image 
                        style={styles.hamburgerButton}
                        source={require('../icons/burger-menu.png')}
                        />
                </TouchableOpacity>
            </View>

            <View
                style={styles.pageContainer}>
                <Image
                    source={useCUserStore((state) => state.profilePic) ? { uri: useCUserStore((state) => state.profilePic) } : styles.userPanel}
                    style={styles.userPanel}
                />
                <View
                    style={styles.innerUserHeader}>
                    <View style={{flexDirection:'row'}}>
                        <Image
                            source={useCUserStore((state) => state.profilePic) ? { uri: useCUserStore((state) => state.profilePic) } : require('../icons/avatarB.png')}
                            style={styles.avatar}/>
                            <Pressable
                                style={({ pressed }) => [
                                    {
                                    backgroundColor: pressed ? "#373737ff" : "#242424ff",
                                    borderColor: pressed ?'#bdbdbdff': '#161616ff',
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
                                <Text style={{color: '#ffffff', alignContent: 'center', margin:'auto'}}>
                                    Edit Profile</Text>
                            </Pressable>
                    </View>

                    <Text style={styles.username}>
                        {useCUserStore((state) => state.username)}
                    </Text>
                    <Text style={styles.bio}>
                        {useCUserStore((state) => state.bio)}
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
                    {/* <Button
                    style={{fontSize: 20, color: 'green'}}
                    styleDisabled={{color: 'red'}}
                    title="Sign Out"
                    onPress={handleLogout}
                    >
                    </Button> */}
                <View
                    style={styles.postSection}>
                    {/* posts */}
                </View>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
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
        backgroundColor: '#fff',
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
        width: 100,
        height: 100,
        borderRadius: 50,
        marginLeft: '20',
        marginBottom: 0,
        borderWidth: 3,
        borderColor: '#161616ff'
    },
    userPanel:{
        width: '100%',
        height: 120,
        top: 0,
        position: 'absolute',
        backgroundColor: '#7471d0ff',
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: '20',
        marginTop: '15',
        marginBottom: 8,
    },
    bio: {
        fontSize: 16,
        color: '#666',
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
    },
    statLabel: {
        fontSize: 14,
        color: '#888',
    },
    header: {
        marginTop: 0,
        backgroundColor: '#f4f4f4ff',
        width: '100%',
        flexDirection: 'row',
        paddingBottom: 10,
        height: 50,
    },
    hamburgerButton: {
        padding: 10,
        width: 32,
        height: 32,
    },
    hamburgerButtonContainer: {
        margin: 'auto',
        marginRight: 20,
        width: 32,
        height: 32,
    },
    postSection:{
        marginTop: 20,
        borderColor: '#e8e8e8ff',
        borderTopWidth: 1,
        width: '100%',
        // backgroundColor: '#0077ffff',
    }
});

export default ProfileScreen;