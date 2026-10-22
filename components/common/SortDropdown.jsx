import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';

// A trigger button that opens a small menu anchored beneath it, right
// aligned to the trigger. options are { name, value } pairs.
const SortDropdown = ({ options, selected, onSelect }) => {
    const colors = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [visible, setVisible] = useState(false);
    const [anchor, setAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const triggerRef = useRef(null);

    const open = () => {
        triggerRef.current?.measureInWindow((x, y, width, height) => {
            setAnchor({ x, y, width, height });
            setVisible(true);
        });
    };

    const choose = (option) => {
        setVisible(false);
        onSelect(option);
    };

    return (
        <View style={styles.header}>
            <Pressable
                android_disableSound={true}
                ref={triggerRef}
                style={styles.trigger}
                onPress={open}
                accessibilityRole="button"
                accessibilityLabel={`Sort comments: ${selected.name}`}
            >
                <Text style={styles.text}>{selected.name}</Text>
            </Pressable>
            <Modal
                visible={visible}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={() => setVisible(false)}
            >
                <Pressable
                    android_disableSound={true}
                    style={StyleSheet.absoluteFill}
                    onPress={() => setVisible(false)}
                />
                <View
                    style={[
                        styles.menu,
                        {
                            top: anchor.y + anchor.height + 1,
                            right: Dimensions.get('window').width - (anchor.x + anchor.width),
                        },
                    ]}
                >
                    {options.map(option => {
                        const isSelected = option.value === selected.value;
                        return (
                            <Pressable
                                android_disableSound={true}
                                key={option.value}
                                style={[styles.option, isSelected && styles.optionSelected]}
                                onPress={() => choose(option)}
                            >
                                <Text style={[styles.text, isSelected && styles.textSelected]}>
                                    {option.name}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </Modal>
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    header: {
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    trigger: {
        margin: 'auto',
        marginRight: 30,
        minWidth: 110,
        paddingHorizontal: 6,
        paddingVertical: 6,
    },
    menu: {
        position: 'absolute',
        backgroundColor: colors.surface,
        minWidth: 110,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 3,
        overflow: 'hidden',
    },
    option: {
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    optionSelected: {
        backgroundColor: colors.iconBg,
    },
    text: {
        fontSize: 14,
        color: colors.text,
        textAlign: 'center',
    },
    textSelected: {
        fontWeight: '600',
    },
});

export default SortDropdown;
