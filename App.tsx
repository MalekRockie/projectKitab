import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import LoginScreen from './screens/auth/LoginScreen';
import MainAppNavigator from './navigation/MainAppNavigator';
import { ProfileScreen } from './screens/profileScreen';
import { SplashScreen } from './components/splashScreen';
import { useUTStore } from './services/storage/store/tstore';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const isAuth = useUTStore((state) => state.isLoggedIn);
  const [isLoading, setIsLoading] = React.useState(true);


  useEffect(() => {
    if (isAuth !== null){
      setIsLoading(false);
    }
  }, []);


  if (isLoading) {
    return (
      <SplashScreen />
    )
  }

  return (
    <NavigationContainer>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? Colors.darker : Colors.lighter}
      />
      <Stack.Navigator 
      screenOptions={{ headerShown: false }}>

        {!isAuth ? (
          <Stack.Screen name={"Login"} component={LoginScreen}/>
        ) : (
          <>
            <Stack.Screen name={"MainApp"} component={MainAppNavigator}/>
            <Stack.Screen name={"Profile"} component={ProfileScreen}/>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
export default App;
