import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const ActionBar = ({
    onComment,
    onRepost,
    onLike,
    onBookmark,
    onShare,
    isLiked = false,
    iconSize = 18,
    gap = 24,
    style,
}) => (
    <View style={[styles.actionBar, { gap }, style]}>
        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <Icon name="chat-bubble-outline" size={iconSize} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onRepost}>
            <Icon name="repeat" size={iconSize} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Icon
                name={isLiked ? "favorite" : "favorite-border"}
                size={iconSize}
                color={isLiked ? "#ff4444" : "#888"}
            />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onBookmark}>
            <Icon name="bookmark-border" size={iconSize} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <Icon name="share" size={iconSize} color="#888" />
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    actionBar: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
    },
    actionButton: {
        padding: 4,
    },
});

export default ActionBar;