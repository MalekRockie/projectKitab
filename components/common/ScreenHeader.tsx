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
  titleInBackButton?: boolean;
  rightElement?: React.ReactNode;
  children?: React.ReactNode; // custom title area, overrides title/subtitle
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBackPress,
  showBackButton = true,
  titleInBackButton = false,
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
          accessibilityRole="button"
          accessibilityLabel={titleInBackButton && title ? `Back, ${title}` : 'Go back'}
          style={({ pressed }) => [
            titleInBackButton && title ? styles.backButtonWithTitle : styles.backButton,
            { opacity: pressed ? 0.5 : 1.0 },
          ]}
          onPress={onBackPress ?? (() => navigation.goBack())}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
          {titleInBackButton && title ? <Text style={styles.title}>{title}</Text> : null}
        </Pressable>
      )}

      {!(titleInBackButton && title) ? (
        <View style={styles.titleContainer}>
          {children ?? (
            <>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </>
          )}
        </View>
      ) : null}

      {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      marginTop: 0,
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 10,
      paddingTop: 70,
      height: 110,
      zIndex: 1,
    },
    backButton: {
      marginLeft: 10,
      // marginTop: 70,
      borderRadius: 50,
    },
    backButtonWithTitle: {
      marginLeft: 10,
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 12,
      borderRadius: 8,
      gap: 8,
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
      // paddingTop: 5,
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