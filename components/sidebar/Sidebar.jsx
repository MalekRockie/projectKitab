import { useNavigation } from "@react-navigation/native";
import { Image, StyleSheet, Text, View, Dimensions, Pressable, Platform } from "react-native";
import { useCUserStore } from "../../services/storage/store/cUserStore";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useEffect } from "react";
import {DropdownMenu} from '../MenuButton/DropDownMenu.jsx'
import Icon from 'react-native-vector-icons/Entypo';
import { Logout } from "../../services/api/auth/auth";


const SIDEBAR_TABS = [
    { label: 'Home', stack: 'MainApp', screen: 'Home' },
    { label: 'Messages', stack: 'MainApp', screen: 'Messages' },
    { label: 'Bookmarks', stack: 'MainApp', screen: 'Bookmarks' },
    { label: 'Profile', stack: 'MainApp', screen: 'Profile' },
    { label: 'Settings', stack: 'MainApp', screen: 'Settings' },
];

export const Sidebar = ({visible, onClose, onOpen}) => {

    let windowWidth = Dimensions.get('window').width;

    const offset = useSharedValue(windowWidth);
    const pressed = useSharedValue(false);
    const startOffset = useSharedValue(windowWidth);
    const navigation = useNavigation();

    const redirect = (stack, screen) => {
        navigation.navigate(stack, { screen: screen })
    };

    const openTab = (stack, screen) => {
        offset.value = withTiming(windowWidth, {}, (finished) => {
            if (finished) {
                runOnJS(onClose)();
                runOnJS(redirect)(stack, screen);
            }
        });
    };

    const menuItems = [
        {
            id: 'settings',
            label: 'Settings & Privacy',
            icon: 'settings-outline',
            onPress: () => openTab('MainApp', 'Settings'),
        },
        {
            id: 'help',
            label: 'Help & Support',
            icon: 'help-circle-outline',
            onPress: () => console.log('Navigate to help'),
        },
        {
            id: 'logout',
            label: 'Log Out',
            icon: 'log-out-outline',
            onPress: () => Logout(),
            isDestructive: true,
        },
    ];

    useEffect(() => {
        offset.value = withTiming(visible ? 0 : windowWidth);
    }, [visible])


    const slidingAnimation = useAnimatedStyle(() => ({
        transform: [
            { translateX: Math.max(0, offset.value) },
        ],
    }));

    const ShadowAnimation = useAnimatedStyle(() => ({
        backgroundColor: `rgba(0, 0, 0, ${(Math.abs((windowWidth * 0.97) - offset.value) / (windowWidth * 0.97)) * 0.5})`,
        opacity: 1,
    }));

    const pan = Gesture.Pan()
        .onBegin(() => {
            pressed.value = true;
            startOffset.value = offset.value;
        })
        .onChange((event) => {
            const newValue = startOffset.value + event.translationX;
            offset.value = Math.max(0, Math.min((windowWidth * 0.8), newValue));
        })
        .onFinalize((event) => {
            pressed.value = false;
            const midpoint = (windowWidth)/2;
            
            const shouldSnapRight = (offset.value > midpoint || 
                (Math.abs(event.velocityX) > 500 && event.velocityX > 0));
            const vis = visible;
            if(shouldSnapRight) {
                runOnJS(onClose)();
            } else if(!shouldSnapRight) {
                runOnJS(onOpen)();
            }
            if(vis == visible){
                offset.value = withTiming(shouldSnapRight ? (windowWidth * 1) : 0, {
                });
            }
        });

    const toggleSidebar = (() => {
            visible ? onClose() : onOpen();
    })

    return(
        <View style={{height: '100%',
            width: '100%',
            position: 'absolute',
            right: 0,}}>
            
            <GestureDetector gesture={pan}>
                <Animated.View style={[slidingAnimation, styles.container]}>
                    <View style={styles.sidebarContainer}>
                        <CustomDrawerContent/>
                        <View style={styles.sidebarTabsContainer}>
                            {SIDEBAR_TABS.map(({ label, stack, screen }) => (
                                <Pressable
                                key={label}
                                onPress={() => openTab(stack, screen)}
                                android_disableSound={true}
                                style={({ pressed }) => [styles.sidebarBtns, { backgroundColor: pressed ? '#3e3e3e62' : '#29292905' }]}>
                                    <Text style={styles.sidebarBtnsText}>{label}</Text>
                                </Pressable>
                            ))}
                        </View>

                        <View style={styles.bottomMenuWrapper}>
                            <DropdownMenu
                                items={menuItems}
                                align="stretch"
                                position="top"
                                triggerStyle={styles.sidebarBtns}
                                trigger={
                                    <View style={styles.menuTriggerContent}>
                                        <View>
                                            <Text>
                                                
                                            </Text>
                                        </View>
                                        <Icon 
                                            name="dots-three-horizontal"
                                            size={20}
                                            color={'#ffffff'}
                                        />
                                    </View>
                                }
                            />
                        </View>
                    </View>
                </Animated.View>
            </GestureDetector>


            {visible && (
                <Pressable 
                    style={[styles.sidebarShadow, { position: 'absolute', zIndex: 1 }]}
                    pointerEvents={visible ? 'auto' : 'none'}
                    android_disableSound={true}
                    onPress={toggleSidebar}>
                    <Animated.View style={[ShadowAnimation, { height: '100%', width: '100%' }]} 
                        pointerEvents="none"
                    />
                </Pressable>
            )}
        </View>
    )
    
    function CustomDrawerContent() {        
        return (
            <View style={{
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: '#333',
                alignItems: 'center',
                marginBottom: 10
            }}>
                <Pressable
                    style={({ pressed }) => [
                        { opacity: pressed ? 0.5 : 1.0 }
                    ]}
                    android_disableSound={true}
                    onPress={() => openTab('MainApp', 'Profile')}>
                    <Image
                    source={require('../../icons/avatarB.png')}
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        marginBottom: 10
                    }}
                    />
                </Pressable>
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                {useCUserStore((state) => state.username)}
                </Text>
                <Text style={{ color: '#aaa', fontSize: 14 }}>
                Follower 122 • Following 10
                </Text>
            </View>
        );
    };
}

const styles = StyleSheet.create({
    container: {
        zIndex: 2,
        height: '100%',
        width: '90%',
        right: 0,
        position: 'absolute',
    },
    sidebarEdge: {
        height: '100%',
        width: '90%',
    },
    sidebarContainer: {
        flex: 1,
        height: '100%',
        width: '100%',
        backgroundColor: '#131313ff',
    },
    sidebarShadow: {
        height: '100%',
        width: '100%',
    },
    sidebarTabsContainer:{
        marginTop: 50,
        gap: 18,
    },
    sidebarBtns: {
        backgroundColor: '#2626266c',
        borderRadius: 15,
        width: '95%',
        margin: 'auto',
    },
    sidebarBtnsText:{
        color: 'white',
        fontSize: 24,
        padding: 30,
        paddingTop: 5,
        paddingBottom: 5,
        fontFamily: Platform.select({
            ios: 'System',
            android: 'Roboto',
            default: 'System',
        }),
    },
    bottomMenuWrapper: {
        width: '100%',
        marginTop: 'auto',
        paddingBottom: Platform.select({ ios: 30, android: 20, default: 20 }),
    },
    menuTriggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
    },
});


export default Sidebar