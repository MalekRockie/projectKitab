import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}