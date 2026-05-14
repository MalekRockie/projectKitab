import React, { useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import DatePicker from "react-native-date-picker";
import { getformatDateUS } from "../../utils/date";
import { DatefieldProps } from "./types";

export const Datefield: React.FC<DatefieldProps> = ({
    date,
    label,
    error,
    onChange,
}) => {
    const [open, setOpen] = useState(false);

    return (
        <View>
            <Text style={styles.label}>
                {label}
            </Text>
            {error && (
                <Text style={styles.error}>
                    {error}
                </Text>
            )}
            <Pressable
                android_disableSound={true}
                accessibilityLabel={label}
                onPress={() => setOpen(!open)}
                style={styles.pressable}
            >
                <Text>{getformatDateUS(date)}</Text>
            </Pressable>
            <DatePicker
                modal
                mode="date"
                open={open}
                date={date}
                onConfirm={(selectedDate) => {
                    setOpen(false);
                    onChange?.(selectedDate);
                }}
                onCancel={() => setOpen(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        textAlign: "left",
        fontSize: 16,
        fontWeight: "500",
    },
    error: {
        color: "#ed4141",
        fontSize: 14,
        marginTop: 4,
    },
    pressable: {
        borderWidth: 0,
        borderBottomWidth: 1,
        borderColor: "#ccc",
        height: 40,
        paddingHorizontal: 10,
        justifyContent: "center",
    },
});