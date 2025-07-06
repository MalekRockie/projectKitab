import React from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { useNavigation } from '@react-navigation/native';
import {TimelineScreen} from '../../screens/TimelineScreen';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginForm = () => {
  const navigation = useNavigation<NavigationProp>();
  const isDarkMode = useColorScheme() === 'dark';
  const safePadding = '5%';

  return (
    <View>
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Welcome to Kitab</Text>
      </View>
      <View
        style={{
          backgroundColor: isDarkMode ? Colors.black : Colors.white,
          paddingHorizontal: safePadding,
          paddingBottom: safePadding,
        }}>
        <TextInput
          style={{
            height: 40,
            borderColor: isDarkMode ? Colors.light : Colors.dark,
            borderWidth: 1,
            borderRadius: 5,
            marginBottom: 20,
            paddingHorizontal: 10,
            color: isDarkMode ? Colors.light : Colors.dark,
          }}
          placeholder="Email Address"
          placeholderTextColor={isDarkMode ? Colors.light : Colors.dark}
        />
        <TextInput
          style={{
            height: 40,
            borderColor: isDarkMode ? Colors.light : Colors.dark,
            borderWidth: 1,
            borderRadius: 5,
            marginBottom: 20,
            paddingHorizontal: 10,
            color: isDarkMode ? Colors.light : Colors.dark,
          }}
          placeholder="Password"
          placeholderTextColor={isDarkMode ? Colors.light : Colors.dark}
          secureTextEntry
        />
        <Button
          title="Sign In"
          color={isDarkMode ? Colors.light : Colors.dark}
          onPress={() => {
            navigation.navigate('MainApp');
          }}
        />
        <View style={styles.forgotContainer}>
          <Text
            style={[styles.linkText, { color: isDarkMode ? Colors.light : Colors.dark }]}
            onPress={() => console.log('Forgot username pressed')}>
            Forgot username
          </Text>
          <Text style={[{ color: isDarkMode ? Colors.light : Colors.dark }]}>|</Text>
          <Text
            style={[styles.linkText, { color: isDarkMode ? Colors.light : Colors.dark }]}
            onPress={() => console.log('Forgot password pressed')}>
            Forgot password
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  welcomeContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a73e8',
    textAlign: 'center',
    marginBottom: 20,
  },
  forgotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    gap: 5,
    alignSelf: 'center',
  },
  linkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default LoginForm;