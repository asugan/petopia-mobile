import React from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/lib/theme";
import { Text } from "./Text";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface SegmentedButton {
  value: string;
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap | React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedButtonsProps {
  value: string;
  onValueChange: (value: string) => void;
  buttons: SegmentedButton[];
  style?: ViewStyle;
  density?: "regular" | "small" | "medium" | "high";
  testID?: string;
}

export const SegmentedButtons: React.FC<SegmentedButtonsProps> = ({
  value,
  onValueChange,
  buttons,
  style,
  density = "regular",
}) => {
  const { theme } = useTheme();

  const flatStyle = StyleSheet.flatten(style);
  const borderRadius = typeof flatStyle?.borderRadius === 'number'
    ? flatStyle.borderRadius
    : theme.roundness;

  const getPadding = () => {
    switch (density) {
      case "small":
        return 6;
      case "medium":
        return 8;
      case "high":
        return 10;
      default:
        return 12;
    }
  };

  const padding = getPadding();

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: theme.roundness,
          borderColor: theme.colors.onSurfaceVariant,
          borderWidth: 1,
        },
        style,
      ]}
    >
      {buttons.map((button, index) => {
        const isSelected = value === button.value;
        const isFirst = index === 0;
        const isLast = index === buttons.length - 1;

        return (
          <TouchableOpacity
            key={button.value}
            style={[
              styles.button,
              {
                backgroundColor: isSelected
                  ? theme.colors.secondary
                  : theme.colors.surface,
                borderLeftWidth: isFirst ? 0 : 1,
                borderLeftColor: theme.colors.onSurfaceVariant,
                borderTopLeftRadius: isFirst ? borderRadius : 0,
                borderBottomLeftRadius: isFirst ? borderRadius : 0,
                borderTopRightRadius: isLast ? borderRadius : 0,
                borderBottomRightRadius: isLast ? borderRadius : 0,
                paddingVertical: padding,
                paddingHorizontal: padding * 1.5,
              },
            ]}
            onPress={() => !button.disabled && onValueChange(button.value)}
            disabled={button.disabled}
            activeOpacity={0.7}
          >
            {button.icon && (
              <>{typeof button.icon === "string" ? <MaterialCommunityIcons name={button.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={16} color={isSelected ? theme.colors.onSecondary : theme.colors.onSurface} /> : button.icon}</>
            )}
            <Text
              variant="labelMedium"
              style={{
                color: isSelected
                  ? theme.colors.onSecondary
                  : theme.colors.onSurface,
              }}
            >
              {button.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    overflow: "hidden",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
});
