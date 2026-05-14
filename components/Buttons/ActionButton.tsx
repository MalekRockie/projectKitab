import React from 'react';
import { Pressable, Text, StyleSheet, StyleProp, ViewStyle, TextStyle, PressableProps } from 'react-native';

type Variant = 'primary' | 'gray' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface VariantConfig {
    bg: string;
    bgPressed: string;
    text: string;
    borderWidth?: number;
    borderColor?: string;
}

interface SizeConfig {
    height: number;
    paddingHorizontal: number;
    fontSize: number;
    defaultWidth: number;
}

const VARIANTS: Record<Variant, VariantConfig> = {
    primary: { bg: '#0037ff', bgPressed: '#0028b3', text: '#FFFFFF' },
    gray:    { bg: '#E5E7EB', bgPressed: '#D1D5DB', text: '#374151' },
    outline: { bg: 'transparent', bgPressed: '#F3F4F6', text: '#0037ff', borderWidth: 1, borderColor: '#0037ff' },
};

const SIZES: Record<Size, SizeConfig> = {
    sm: { height: 36, paddingHorizontal: 12, fontSize: 14, defaultWidth: 80 },
    md: { height: 44, paddingHorizontal: 16, fontSize: 16, defaultWidth: 100 },
    lg: { height: 52, paddingHorizontal: 20, fontSize: 18, defaultWidth: 140 },
};

interface ActionButtonProps extends Omit<PressableProps, 'style'> {
    title: string;
    onPress?: () => void;
    variant?: Variant;
    size?: Size;
    disabled?: boolean;
    width?: number;
    height?: number;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

export default function ActionButton({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    width,
    height,
    style,
    textStyle,
    ...rest
}: ActionButtonProps) {
    const colors = VARIANTS[variant] ?? VARIANTS.primary;
    const sizeConfig = SIZES[size] ?? SIZES.md;
    const finalWidth = width ?? sizeConfig.defaultWidth;
    const finalHeight = height ?? sizeConfig.height;

    return (
        <Pressable
        disabled={disabled}
        android_disableSound
        style={({ pressed }) => [
            styles.base,
            {
            backgroundColor: disabled ? '#D1D5DB' : pressed ? colors.bgPressed : colors.bg,
            width: finalWidth,
            height: finalHeight,
            borderRadius: 8,
            paddingHorizontal: sizeConfig.paddingHorizontal,
            borderWidth: colors.borderWidth ?? 0,
            borderColor: colors.borderColor ?? 'transparent',
            opacity: disabled ? 0.6 : 1,
            },
            style,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        {...rest}
        >
        <Text
            style={[
            styles.text,
            {
                color: disabled ? '#9CA3AF' : colors.text,
                fontSize: sizeConfig.fontSize,
            },
            textStyle,
            ]}
        >
            {title}
        </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontWeight: '600',
        textAlign: 'center',
    },
});