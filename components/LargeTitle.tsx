import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { Text } from "@/components/ui";
import { useTheme } from "@/lib/theme";

interface LargeTitleProps {
  title: string;
  style?: ViewStyle;
}

export const LargeTitle = ({ title, style }: LargeTitleProps) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Text
        variant="headlineLarge"
        style={[styles.title, { color: theme.colors.onBackground }]}
      >
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  title: {
    fontWeight: "700",
  },
});
