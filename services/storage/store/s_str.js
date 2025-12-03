import { create, MMKVLoader } from "react-native-mmkv-storage";

const MMKV = new MMKVLoader()
    .withEncryption()
    .initialize();

export const useStorage = (key, defaultValue) => {
    const [value, setValue] = useMMKVStorage(key, defaultValue);
    return [value, setValue];
}