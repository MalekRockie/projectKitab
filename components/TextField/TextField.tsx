import React from "react";
import { TextFieldProps } from "./types";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export const TextField: React.FC<TextFieldProps> = ({
    prefix = null,
    placeholder,
    label,
    editable,
    value,
    error,
    errorPosition = 'above',
    suggestions = null,
    onSuggestionPress,
    style = null,
    ...rest
}) => {
    const hasPrefix = !!prefix;

    return (
    <View>
        {label && (
            <Text style={{ fontSize: 16, fontWeight: 500 }}>{label}</Text>
        )}
        {errorPosition == 'above' && error && (
            <Text style={{ color: '#ed4141' }}>
                {error}
            </Text>
        )}

        {hasPrefix ? (
            <View style={styles.containerWithPrefix}>
            <Text style={styles.prefixText}>
                {prefix}
            </Text>
            <TextInput
                editable={editable}
                placeholder={placeholder}
                value={value ?? ''}
                style={[styles.inputWithPrefix, style]}
                {...rest}
            />
            </View>
        ) : (
            <TextInput
            editable={editable}
            placeholder={placeholder}
            value={value ?? ''}
            style={[styles.defaultInput, style]}
            {...rest}
            />
        )}

        {errorPosition == 'below' && error && (
            <View style={{ gap: 6, marginTop: 10, zIndex: 999 }}>
                <Text style={{ color: '#ed4141' }}>
                    {error}
                </Text>
                {Array.isArray(suggestions) && suggestions.length > 0 && (
                    <Text>
                        {'Suggestions: '}
                        {suggestions.map((suggestion, index) =>
                            <Text key={index}>
                                <Text
                                    onPress={() => onSuggestionPress?.(suggestion)}
                                    style={{ textDecorationLine: 'underline', color: '#646464' }}>
                                    @{suggestion}
                                </Text>
                                {index < suggestions.length - 1 ? ',  ' : ''}
                            </Text>
                        )}
                    </Text>
                )}
            </View>
        )}
        </View>
    );
};

const styles = StyleSheet.create({
    defaultInput: {
        borderWidth: 0,
        borderBottomWidth: 1,
        borderColor: "#ccc",
        height: 40,
        padding: 10,
        backgroundColor: '#fff',
    },
    containerWithPrefix: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 0,
        borderBottomWidth: 1,
        borderColor: "#ccc",
        height: 40,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
    },
    prefixText: {
        fontSize: 16,
        color: '#666',
        marginRight: 6,
    },
    inputWithPrefix: {
        flex: 1,
        height: 40,
        padding: 0,
        textAlignVertical: 'center',
    },
});