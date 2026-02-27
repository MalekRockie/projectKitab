import { useNavigation } from "@react-navigation/native";
import { Image, StyleSheet, Text, TouchableOpacity, View, Button, Dimensions, Pressable } from "react-native";
import { useCUserStore } from "../../services/storage/store/cUserStore";
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring, withTiming, Easing, withRepeat, withSequence, withDelay, withDecay, withClamp, runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useEffect, useState } from "react";
import Icon from 'react-native-vector-icons/Ionicons';


const SIDEBAR_TABS = [
    { label: 'Home', stack: 'MainApp', screen: 'Home' },
    { label: 'Messages', stack: 'MainApp', screen: 'Messages' },
    { label: 'Bookmarks', stack: 'MainApp', screen: 'Bookmarks' },
    { label: 'Profile', stack: 'MainApp', screen: 'Profile' },
    { label: 'Settings', stack: 'MainApp', screen: 'Settings' },
];

export const Sidebar = ({visible, onClose, onOpen}) => {

    const offset = useSharedValue(windowWidth);
    const pressed = useSharedValue(false);
    let windowWidth = Dimensions.get('window').width;
    const startOffset = useSharedValue(windowWidth);
    // const [shouldSnapRight, setShouldSnapRight] = useState(true);
    const navigation = useNavigation();




    useEffect(() => {
        offset.value = withTiming(visible ? 0 : windowWidth);
    }, [visible])


    const slidingAnimation = useAnimatedStyle(() => ({
        transform: [
            { translateX: Math.max(0, offset.value) },
        ],
        // backgroundColor: pressed.value ? '#FFE04B' : '#b58df1',
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
            // console.log(((offset.value -(windowWidth * 0.97)) / (windowWidth * 0.97)) * 0.5);

        })
        .onFinalize((event) => {
            pressed.value = false;
            const midpoint = (windowWidth)/2;
            
            const shouldSnapRight = (offset.value > midpoint || 
                (Math.abs(event.velocityX) > 500 && event.velocityX > 0));
            const vis = visible;
            if(shouldSnapRight) {
                runOnJS(onClose)();
                // console.log("open: ", shouldSnapRight)
            } else if(!shouldSnapRight) {
                runOnJS(onOpen)();
                // console.log("close: ", shouldSnapRight)
            }
            if(vis == visible){
                offset.value = withTiming(shouldSnapRight ? (windowWidth * 1) : 0, {
                });
            }
            // console.log(((offset.value -(windowWidth * 0.97)) / (windowWidth * 0.97)) * 0.5);
        });



    const openTab = (stack, screen) => {
        offset.value = withTiming(windowWidth, {}, (finished) => {
            if (finished) {
                runOnJS(onClose)();
                runOnJS(redirect)(stack, screen);
            }
        });
    };

    const redirect = (stack, screen) => {
        console.log("Reached", stack);
        console.log("Reached", screen);
        navigation.navigate(stack, { screen: screen })
    };
    const toggleSidebar = (() => {
            // offset.value = withSpring(visible ? (windowWidth * 0.85) : -20);
            visible ? onClose() : onOpen();
            // console.log("Visible: ",visible);
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
                        {/* <Pressable style={styles.menuButton}>
                            <Icon name="ellipsis-horizontal-circle-outline" size={24} color="white" />
                        </Pressable> */}
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
                        pointerEvents="none" // This prevents the animated view from blocking touches
                    />
                </Pressable>
            )}
        </View>
    )
    
    function CustomDrawerContent() {        

        return (
            // <DrawerContentScrollView {...props} style={{ backgroundColor: '#0e0e0e' }}>
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
                    onPress={() => 
                    {
                    offset.value = withTiming(windowWidth, {}, (finished) => {
                        if (finished) {
                            runOnJS(onClose)();
                            runOnJS(redirect)();
                        }
                    }) 
                    openTab('MainApp', 'Profile' )
                    }
                    
                    }>
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
            
            // <DrawerItemList {...props} />
            // </DrawerContentScrollView>
        );
    };


    // function Menu () {
    //     return(
    //         <View style={styles.menuContainer}>
    //             <Text>Hi</Text>
    //         </View>
    //     )
    // }
}

const styles = StyleSheet.create({
    container: {
        zIndex: 2,
        // backgroundColor: '#ff0000ff',
        height: '100%',
        width: '90%',
        right: 0,
        position: 'absolute',

    },
    sidebarEdge: {
        height: '100%',
        // backgroundColor: '#1313133b',
        width: '90%',
    },
    sidebarContainer: {
        height: '100%',
        width: '100%',
        // flex: 1,
        backgroundColor: '#131313ff',

    },
    sidebarShadow: {
        height: '100%',
        width: '100%',
    },
    sidebarTabsContainer:{
        // backgroundColor: '#ff0000ff',
        marginTop: '50',
        gap: 18,
        
    },
    sidebarBtns: {
        backgroundColor: '#ff000062',
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
        // fontWeight: '10',
        fontFamily: Platform.select({
            ios: 'System',
            android: 'Roboto',
            default: 'System',
        }),
    },
    // menuButton:{
    //     position: 'absolute',
    //     top: 20,
    //     right: 30
    // },
    // menuContainer:{
    //     backgroundColor: 'black',
    //     height: 150,
    //     width: 120
    // }
});



export default Sidebar