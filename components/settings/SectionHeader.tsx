import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
    title: string;
}

const SectionHeader: React.FC<Props> = ({ title }) => (
    <View style={styles.container}>
        <Text style={styles.text}>{title}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 8,
        backgroundColor: 'transparent',
    },
    text: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: '#8E8E93', // iOS system gray
    },
});

export default SectionHeader;