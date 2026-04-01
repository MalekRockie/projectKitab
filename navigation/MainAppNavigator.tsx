import React, { useEffect, useState } from "react";
import { ProfileScreen } from "../screens/profileScreen";
import { HomeScreen } from "../screens/HomeScreen"; 
import { PostScreen } from "../screens/PostScreen";
import { View } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { Sidebar } from "../components/sidebar/Sidebar";
import { CommentComposer } from "../screens/CommentComposerScreen";

const Stack = createStackNavigator();


function MainAppNavigator() {
    const [sidebarVisible, setSidebarVisible] = useState(false);


    return (
        <View style={{ flex: 1 }}>
            
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    gestureEnabled: false,
                }}
            >
                <Stack.Screen name="Home" >
                    {props =>
                        <HomeScreen 
                            {...props}
                            visible={sidebarVisible} 
                            onOpenSidebar={() => setSidebarVisible(true)} />
                    }
                </Stack.Screen>
                <Stack.Screen name={"Profile"} component={ProfileScreen}/>
                <Stack.Screen name={"PostScreen"} component={PostScreen} />
                <Stack.Screen 
                    name={"CommentComposerScreen"} 
                    options={{ 
                        animation: 'slide_from_bottom',
                        // gestureEnabled: true, 
                    }} 
                    component={CommentComposer}/>
                {/* <Stack.Screen name="Messages" component={ProfileScreen} /> */}
                {/* <Stack.Screen name="Settings" component={ProfileScreen} /> */}
            </Stack.Navigator>

            <Sidebar 
                visible={sidebarVisible}
                onClose={() => setSidebarVisible(false)}
                onOpen={() => setSidebarVisible(true)}
            />
        </View>
    );
}

export default MainAppNavigator;