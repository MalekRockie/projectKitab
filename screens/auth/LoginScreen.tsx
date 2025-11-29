import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import LoginForm from '../../components/auth/LoginForm';
import api from '../../services/api/base';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigation';
import { useUTStore } from '../../services/storage/store/tstore';
import { auth } from '../../services/api/auth/auth';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {

  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };


  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = React.useState(false);

  const loginCred = async (data: {emailaddess: string; password: string}) => {
    setIsLoading(true);
    try {
      const result = await auth(data.emailaddess, data.password);
    } catch (error) {
      console.error("Error: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  //TODO: add a proper loading screen
  if(isLoading){
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={[backgroundStyle, { height: Dimensions.get('window').height }]}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between'
        }}
        style={{
          flex: 1
        }}>
        <LoginForm LoginUpdate={loginCred}/>
        <View style={styles.registerContainer}>
          <Text
            style={[styles.linkText, { color: isDarkMode ? Colors.light : Colors.dark }]}
            onPress={() => console.log('Register pressed')}>
            Don't have an account? Register now
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  registerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 20,
    height: 'auto',
  },
  linkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});



export default LoginScreen;