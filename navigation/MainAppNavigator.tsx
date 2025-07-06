import React from "react";
import { Text } from "react-native";
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { TimelineScreen } from "../screens/TimelineScreen";
import { ProfileScreen } from "../screens/profileScreen";


const Drawer = createDrawerNavigator();

function MainAppNavigator() {

    return (
        <Drawer.Navigator >
            <Drawer.Screen 
            name="Home" 
            component={TimelineScreen}
            options={{
                headerShown: false
                }}/>

            
        </Drawer.Navigator>
        );
}

export default MainAppNavigator;