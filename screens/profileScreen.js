import { View, Text, Image, StyleSheet, Button } from 'react-native';
import { removeData } from '../services/storage/localstorage';
import { createStaticNavigation, useNavigation } from '@react-navigation/native';
import { useUTStore } from '../services/storage/store/tstore';


export const ProfileScreen = () => {

    const navigation = useNavigation();
    const removeUserToken = useUTStore((state) => state.logout);
    

    const handleLogout = () => {
        console.log("User logged out");
        removeUserToken();
        // navigation.navigate('Login');

    }   
    return (
        <View style={styles.container}>
            <Image
                source={{ uri: 'https://i.imgur.com/profile.jpg' }}
                style={styles.avatar}
            />
            <Text style={styles.username}>johndoe</Text>
            <Text style={styles.bio}>
                Hi! I'm John Doe. I love coding and sharing knowledge. 🚀
            </Text>
            <View style={styles.statsContainer}>
                <View style={styles.stat}>
                    <Text style={styles.statNumber}>120</Text>
                    <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statNumber}>350</Text>
                    <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statNumber}>180</Text>
                    <Text style={styles.statLabel}>Following</Text>
                </View>
            </View>
            <Button
            style={{fontSize: 20, color: 'green'}}
            styleDisabled={{color: 'red'}}
            title="Sign Out"
            onPress={handleLogout}
            >
            </Button>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff',
        flex: 1,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    bio: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
    },
    stat: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 14,
        color: '#888',
    },
});

export default ProfileScreen;