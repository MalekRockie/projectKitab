import React, { useMemo, useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import DatePicker from "react-native-date-picker";
import { getformatDateUS } from "../../utils/date";
import { DatefieldProps } from "./types";
import { useTheme } from "../../theme/useTheme";
import { ThemeColors } from "../../theme/colors";
import { useUserSettingsStore } from "../../services/storage/store/useSettingsStore";

export const Datefield: React.FC<DatefieldProps> = ({
    date,
    label,
    error,
    onChange,
}) => {
    const [open, setOpen] = useState(false);
    const colors = useTheme();
    const themePreference = useUserSettingsStore((state) => state.theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const pickerDate = date || new Date();


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
                <Text style={date ? styles.dateText : styles.placeholderText}>
                    {date ? getformatDateUS(date) : "Select date"}
                </Text>
            </Pressable>
            <DatePicker
                modal
                mode="date"
                open={open}
                date={pickerDate}
                theme={themePreference === "system" ? "auto" : themePreference}
                onConfirm={(selectedDate) => {
                    setOpen(false);
                    onChange?.(selectedDate);
                }}
                onCancel={() => setOpen(false)}
            />
        </View>
    );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    label: {
        textAlign: "left",
        fontSize: 16,
        fontWeight: "500",
        color: colors.textSecondary,
    },
    error: {
        color: "#ed4141",
        fontSize: 14,
        marginTop: 4,
    },
    pressable: {
        borderWidth: 0,
        borderBottomWidth: 1,
        borderColor: colors.divider,
        height: 40,
        paddingHorizontal: 10,
        justifyContent: "center",
    },
    dateText: {
        fontSize: 16,
        color: colors.text,
    },
    placeholderText: {
        fontSize: 16,
        color: colors.textSecondary,
    },
});