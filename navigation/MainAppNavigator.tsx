import React, { useEffect } from "react";
import { createDrawerNavigator } from '@react-navigation/drawer';
import { TimelineScreen } from "../screens/TimelineScreen";
import { ProfileScreen } from "../screens/profileScreen";
import api from "../services/api/base";



const Drawer = createDrawerNavigator();

function MainAppNavigator() {

    useEffect(() => {
        console.log("Fetching API health...");
        const fetchHealth = async () => {
            try {
                const response = await api.get('/health');
                console.log(response.data);
            } catch (error) {
                console.error("Error fetching API health:", error);
            }
        }

        fetchHealth();
    }, []); 

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