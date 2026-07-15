import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Pressable 
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp, FadeInUp, FadeOutDown } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons'; 

export const DropdownMenu = ({ 
  items, 
  trigger,
  align = 'right',   
  position = 'bottom',
  triggerStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const opensUpward = position === 'top';

  const handleItemPress = (item) => {
    setIsOpen(false);
    // Small delay to let the exit animation play before triggering the action
    setTimeout(() => item.onPress(), 150); 
  };

  return (
    <View style={[styles.container, triggerStyle]}>
      {/* The Trigger Button */}
      <Pressable 
        onPress={() => setIsOpen(!isOpen)}
        style={({ pressed }) => [
          styles.triggerPressable,
          pressed && styles.triggerPressed,
        ]}
      >
        {trigger}
      </Pressable>

      {/* The Backdrop (Catches taps outside the menu to close it).
          Sized larger than the trigger itself so taps anywhere above it
          (inside the sidebar) still close the menu — a plain absoluteFill
          would only cover the trigger's own small box. */}
      {isOpen && (
        <Pressable 
          style={styles.backdrop} 
          onPress={() => setIsOpen(false)} 
        />
      )}

      {/* The Animated Menu */}
      {isOpen && (
        <Animated.View 
          entering={(opensUpward ? FadeInDown : FadeInUp).duration(200).duration(250)}
          exiting={(opensUpward ? FadeOutDown : FadeOutUp).duration(150)}
          style={[
            styles.menuContainer,
            opensUpward ? styles.positionTop : styles.positionBottom,
            align === 'right' && styles.alignRight,
            align === 'left' && styles.alignLeft,
            align === 'stretch' && styles.alignStretch,
          ]}
        >
          {items.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === items.length - 1 && styles.lastItem
              ]}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.7}
            >
              {item.icon && (
                <Ionicons 
                  name={item.icon} 
                  size={20} 
                  color={item.isDestructive ? '#FF3B30' : '#fff'} 
                  style={styles.icon} 
                />
              )}
              <Text style={[
                styles.menuText, 
                item.isDestructive && styles.destructiveText
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000, 
  },
  triggerPressable: {
    width: '100%',
    borderRadius: 15,
  },
  triggerPressed: {
    backgroundColor: '#3e3e3e62',
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    bottom: -50,
    left: -50,
    right: -50,
    backgroundColor: 'transparent', 
    zIndex: 999,
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#282828',
    borderRadius: 12,
    shadowColor: '#00000000',
    elevation: 8,
    minWidth: 180,
    overflow: 'hidden',
    zIndex: 1001,
  },
  positionBottom: {
    top: '110%', 
  },
  positionTop: {
    bottom: '110%',
  },
  alignRight: {
    right: 0,
  },
  alignLeft: {
    left: 0,
  },
  alignStretch: {
    left: 0,
    right: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3d3d3d',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  icon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
  },
  destructiveText: {
    color: '#FF3B30', 
  },
});