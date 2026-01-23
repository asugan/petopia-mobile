import { useTheme } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ImageSourcePropType, StyleProp, StyleSheet, TextStyle, View, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Text } from "./Text";

export interface AvatarProps {
  source?: ImageSourcePropType;
  label?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export interface AvatarImageProps {
  source: ImageSourcePropType;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export interface AvatarTextProps {
  label: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export interface AvatarIconProps {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  style?: StyleProp<ViewStyle>;
  color?: string;
}

// Avatar.Image sub-component
const AvatarImage: React.FC<AvatarImageProps> = ({ source, size = 40, style }) => {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <Image
        source={source}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    </View>
  );
};

// Avatar.Text sub-component
const AvatarText: React.FC<AvatarTextProps> = ({ label, size = 40, style, labelStyle }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.primary,
        },
        style,
      ]}
    >
      <Text
        variant="labelLarge"
        style={[
          {
            color: theme.colors.onPrimary,
            fontSize: size * 0.4,
          },
          labelStyle,
        ]}
      >
        {label.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
};

// Avatar.Icon sub-component
const AvatarIcon: React.FC<AvatarIconProps> = ({ icon, size = 40, style, color }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.primary,
        },
        style,
      ]}
    >
      <Ionicons
        name={icon}
        size={size * 0.5}
        color={color || theme.colors.onPrimary}
      />
    </View>
  );
};

// Main Avatar component
const AvatarBase: React.FC<AvatarProps> = ({
  source,
  label,
  size = 40,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.primary,
        },
        style,
      ]}
    >
      {source ? (
        <Image
          source={source}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : label ? (
        <Text
          variant="labelLarge"
          style={{
            color: theme.colors.onPrimary,
            fontSize: size * 0.4,
          }}
        >
          {label.charAt(0).toUpperCase()}
        </Text>
      ) : null}
    </View>
  );
};

// Compose Avatar with sub-components
export const Avatar = Object.assign(AvatarBase, {
  Image: AvatarImage,
  Text: AvatarText,
  Icon: AvatarIcon,
});

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
