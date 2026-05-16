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
import { useNavigation } from '@react-navigation/native';
import { MMKVLoader } from "react-native-mmkv-storage";
import { auth } from '../../services/api/auth/auth';
import { authenticate } from '../../services/auth/checkAuth';


export const LoginScreen: React.FC = () => {

  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const MMKV = new MMKVLoader().initialize();

  const navigation = useNavigation();
  const [isLoading, setIsLoading] = React.useState(false);

  const loginCred = async (data: {emailaddess: string; password: string}) => {
    setIsLoading(true);
    try {
      await authenticate(data.emailaddess, data.password);
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
            onPress={() => navigation.navigate('Registration')}>
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