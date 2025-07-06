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

export const LoginScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

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
        <LoginForm />
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
  },
  linkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;