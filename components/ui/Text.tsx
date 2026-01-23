import { useTheme } from "@/lib/theme";
import React from "react";
import { Text as RNText, TextProps as RNTextProps } from "react-native";

type TextVariant =
  | "headlineLarge"
  | "headlineMedium"
  | "headlineSmall"
  | "titleLarge"
  | "titleMedium"
  | "titleSmall"
  | "bodyLarge"
  | "bodyMedium"
  | "bodySmall"
  | "labelLarge"
  | "labelMedium"
  | "labelSmall";

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
}

export const Text: React.FC<TextProps> = ({
  variant = "bodyMedium",
  color,
  style,
  children,
  ...rest
}) => {
  const { theme } = useTheme();
  const fontStyle = theme.fonts[variant];

  return (
    <RNText
      style={[
        {
          fontSize: fontStyle.fontSize,
          fontWeight: fontStyle.fontWeight,
          lineHeight: fontStyle.lineHeight,
          fontFamily: fontStyle.fontFamily,
          color: color || theme.colors.onBackground,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
};
