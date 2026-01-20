import React, { useEffect } from "react";
import { createDrawerNavigator, DrawerItemList } from '@react-navigation/drawer';
import { TimelineScreen } from "../screens/TimelineScreen";
import { ProfileScreen } from "../screens/profileScreen";
import { HomeScreen } from "../screens/HomeScreen"; 
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useCUserStore } from "../services/storage/store/cUserStore";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DrawerParamList } from "./navigation";

// const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator<DrawerParamList>();

function CustomDrawerContent(props: DrawerContentComponentProps) {
    const navigation = props.navigation;

    return (
        <DrawerContentScrollView {...props} style={{ backgroundColor: '#0e0e0e' }}>
        <View style={{
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#333',
            alignItems: 'center',
            marginBottom: 10
        }}>
            <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}>
                <Image 
                source={require('../icons/avatarB.png')}
                style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    marginBottom: 10
                }}
                />
            </TouchableOpacity>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
            {useCUserStore((state) => state.username)}
            </Text>
            <Text style={{ color: '#aaa', fontSize: 14 }}>
            Follower 122 • Following 10
            </Text>
        </View>
        
        <DrawerItemList {...props} />
        </DrawerContentScrollView>
    );
};


function ProfileStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen 
            name="ProfileMain" 
                options={{
                headerShown: false,
                presentation: 'modal',
                animationTypeForReplace: 'push',
                animation:'slide_from_right'
            }}
            component={ProfileScreen} />
        </Stack.Navigator>
    );
}

function MainAppNavigator() {



    return (
        <Drawer.Navigator 
        drawerContent={(props) => <CustomDrawerContent {...props}/>}
        screenOptions={{
            drawerStyle: {
                backgroundColor: '#0e0e0e',
            },
            drawerLabelStyle: {
                color: 'white',
                fontSize: 24,
            },
            drawerActiveBackgroundColor: '#1a1a1a',
            drawerPosition: 'right',
            drawerType: 'front',
        }}
        >
            
            <Drawer.Screen 
                name="Home" 
                component={HomeScreen}
                options={{
                headerShown: false
            }}/>
            <Drawer.Screen 
                name="Profile"
                component={ProfileStack}
                options={{
                headerShown: false
            }}/>
            <Drawer.Screen 
                name="Hubs"
                component={HomeScreen}
                options={{
                headerShown: false
            }}/>
            <Drawer.Screen 
                name="Messages"
                component={ProfileScreen}
                options={{
                headerShown: false
            }}/>
            <Drawer.Screen 
                name="Settings"
                component={ProfileScreen}
                options={{
                headerShown: false
            }}/>
        </Drawer.Navigator>
        );
}

export default MainAppNavigator;