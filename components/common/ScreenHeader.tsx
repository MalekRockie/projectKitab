// components/common/ScreenHeader.tsx
import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/useTheme';
import { ThemeColors } from '../../theme/colors';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  onBackPress?: () => void;
  showBackButton?: boolean;
  rightElement?: React.ReactNode;
  children?: React.ReactNode; // custom title area, overrides title/subtitle
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBackPress,
  showBackButton = true,
  rightElement,
  children,
}) => {
  const navigation = useNavigation();
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.header}>
      {showBackButton && (
        <Pressable
          android_disableSound={true}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.5 : 1.0 }]}
          onPress={onBackPress ?? (() => navigation.goBack())}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
      )}

      <View style={styles.titleContainer}>
        {children ?? (
          <>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </>
        )}
      </View>

      {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      marginTop: 0,
      // backgroundColor: colors.surface,
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 10,
      height: 50,
      zIndex: 1,
    },
    backButton: {
      marginLeft: 10,
      marginTop: 10,
      borderRadius: 50,
    },
    titleContainer: {
      marginLeft: 10,
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '500',
      color: colors.text,
      paddingTop: 5,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    rightElement: {
      marginRight: 10,
      justifyContent: 'center',
    },
  });

export default ScreenHeader;