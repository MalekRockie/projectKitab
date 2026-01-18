import { LoginScreen } from './../screens/auth/LoginScreen';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
    Login: undefined;
    TimelineScreen: undefined;
    MainApp: undefined;
    ProfileScreen: undefined;
};

export type DrawerParamList = {
    Home: undefined;
    Profile: undefined;
    Hubs: undefined;
    Messages: undefined;
    Settings: undefined;
};