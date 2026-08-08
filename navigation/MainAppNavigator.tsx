import React, { useState } from "react";
import { ProfileScreen } from "../screens/profileScreen";
import { HomeScreen } from "../screens/HomeScreen"; 
import { PostScreen } from "../screens/PostScreen";
import { View, Dimensions } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { Sidebar } from "../components/sidebar/Sidebar";
import { CommentComposer } from "../screens/CommentComposerScreen";
import { CommentFocusScreen } from "../screens/CommentFocusScreen";
import { useSharedValue } from "react-native-reanimated";

const Stack = createStackNavigator();

function MainAppNavigator() {
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const windowWidth = Dimensions.get('window').width;

    const sidebarOffset = useSharedValue(windowWidth);

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
                            onOpenSidebar={() => setSidebarVisible(true)}
                            sidebarOffset={sidebarOffset}
                        />
                    }
                </Stack.Screen>
                <Stack.Screen name={"Profile"} component={ProfileScreen}/>
                <Stack.Screen name={"PostScreen"} component={PostScreen} />
                <Stack.Screen 
                    name={"CommentScreen"} component={CommentFocusScreen}
                    options={{ animation: 'slide_from_right' }}/>
                <Stack.Screen 
                    name={"CommentComposerScreen"} 
                    options={{ animation: 'slide_from_bottom' }} 
                    component={CommentComposer}/>
                {/* <Stack.Screen name="Messages" component={ProfileScreen} /> */}
                {/* <Stack.Screen name="Settings" component={ProfileScreen} /> */}
            </Stack.Navigator>

            <Sidebar 
                visible={sidebarVisible}
                onClose={() => setSidebarVisible(false)}
                onOpen={() => setSidebarVisible(true)}
                sidebarOffset={sidebarOffset}
            />
        </View>
    );
}

export default MainAppNavigator;