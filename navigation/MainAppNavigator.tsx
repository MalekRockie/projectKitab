import React from "react";
import { Text, View, Image } from "react-native";
import { createDrawerNavigator, DrawerItemList } from '@react-navigation/drawer';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { TimelineScreen } from "../screens/TimelineScreen";
import { ProfileScreen } from "../screens/profileScreen";
import { DrawerContentScrollView } from '@react-navigation/drawer';

const dummyUser = {
    name: "John Doe", 
    username: "johndoe",
    profilePicture: "https://i.ytimg.com/vi/L_KySG9EDZg/maxresdefault.jpg",
    followers: 1200,
    following: 300,
};

function CustomDrawerContent(props) {
    return (
        <DrawerContentScrollView {...props}>
            <View style={{paddingTop: 40, alignItems: 'center', marginBottom: 20}}>
                <Image
                    source={{ uri: dummyUser.profilePicture }}
                    style={{ width: 80, height: 80, borderRadius: 40 }}/>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 5, color: 'white' }}>
                    {dummyUser.name}
                </Text>
                <View style={{ alignItems: 'center', marginTop: 5, display: 'flex', flexDirection: 'row', gap: 30}}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', marginTop: 5, color: 'white' }}>Follower: {dummyUser.followers}</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', marginTop: 5, color: 'white' }}>Following: {dummyUser.following}</Text>
                </View>
            </View>
            <DrawerItemList {...props} />
        </DrawerContentScrollView>
    )
}

const Drawer = createDrawerNavigator();

function MainAppNavigator() {

    return (
        <Drawer.Navigator 
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
        }}
        drawerContent={props => <CustomDrawerContent {...props} />}
        >
            <Drawer.Screen 
                name="Home" 
                component={TimelineScreen}
                options={{
                headerShown: false
            }}/>
            <Drawer.Screen 
                name="Profile"
                component={ProfileScreen}
                options={{
                headerShown: false
            }}/>
            <Drawer.Screen 
                name="Hubs"
                component={ProfileScreen}
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