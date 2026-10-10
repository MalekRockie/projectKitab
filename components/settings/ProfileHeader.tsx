import React, { useMemo } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';

interface Props {
  handle: string;
  onPress?: () => void;
}

const ProfileHeader: React.FC<Props> = ({ handle, onPress }) =>{
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.avatar}>
                <Icon name="person" size={24} color="#8E8E93" />
            </View>
            <View>
                <Text style={styles.handle}>{handle}</Text>
                <Text style={styles.hint}>Tap to edit profile</Text>
            </View>
        </TouchableOpacity>
)};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#C6C6C8',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    handle: {
        fontSize: 17,
        fontWeight: '600',
        color: colors.text,
    },
    hint: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
});

export default ProfileHeader;