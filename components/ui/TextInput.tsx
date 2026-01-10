import { useTheme } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    InputAccessoryView,
    Keyboard,
    Platform,
    Pressable,
    TextInput as RNTextInput,
    TextInputProps as RNTextInputProps,
    StyleProp,
    StyleSheet,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";
import { Text } from "./Text";

export interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: boolean;
  disabled?: boolean;
  mode?: "flat" | "outlined";
  left?: React.ReactNode;
  right?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export interface TextInputIconProps {
  icon?: keyof typeof Ionicons.glyphMap;
  name?: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
}

export interface TextInputAffixProps {
  text: string;
  type?: "prefix" | "suffix";
}

type TextInputComponent = React.FC<TextInputProps> & {
  Icon: React.FC<TextInputIconProps>;
  Affix: React.FC<TextInputAffixProps>;
};

const TextInputBase: React.FC<TextInputProps> = ({
  label,
  error = false,
  disabled = false,
  mode = "outlined",
  left,
  right,
  containerStyle,
  inputStyle,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);

  const {
    multiline,
    returnKeyType,
    blurOnSubmit,
    inputAccessoryViewID,
    ...inputProps
  } = rest;

  const showDoneAccessory = Platform.OS === "ios";
  const fallbackAccessoryViewID = React.useMemo(
    () => `textinput-done-${Math.random().toString(36).slice(2)}`,
    []
  );
  const resolvedAccessoryViewID =
    inputAccessoryViewID ?? (showDoneAccessory ? fallbackAccessoryViewID : undefined);
  const resolvedReturnKeyType = returnKeyType ?? (multiline ? undefined : "done");
  const resolvedBlurOnSubmit = blurOnSubmit ?? !multiline;
  const dismissKeyboard = React.useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    return theme.colors.onSurfaceVariant;
  };

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.surfaceVariant;
    if (mode === "flat") return theme.colors.surfaceVariant;
    return theme.colors.surface;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          variant="bodySmall"
          style={[
            styles.label,
            { color: error ? theme.colors.error : theme.colors.onSurfaceVariant },
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderWidth: mode === "outlined" ? 1 : 0,
            borderRadius: theme.roundness / 2,
            borderBottomWidth: mode === "flat" ? 2 : mode === "outlined" ? 1 : 0,
          },
        ]}
      >
        {left && <View style={styles.leftElement}>{left}</View>}
        <RNTextInput
          style={[
            styles.input,
            {
              color: disabled ? theme.colors.onSurfaceVariant : theme.colors.onSurface,
            },
            inputStyle,
            style,
          ]}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          returnKeyType={resolvedReturnKeyType}
          blurOnSubmit={resolvedBlurOnSubmit}
          inputAccessoryViewID={resolvedAccessoryViewID}
          {...inputProps}
        />
        {right && <View style={styles.rightElement}>{right}</View>}
      </View>
      {showDoneAccessory && resolvedAccessoryViewID ? (
        <InputAccessoryView nativeID={resolvedAccessoryViewID}>
          <View
            style={[
              styles.inputAccessory,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderTopColor: theme.colors.outline,
              },
            ]}
          >
            <View style={styles.inputAccessorySpacer} />
            <Pressable
              onPress={dismissKeyboard}
              accessibilityRole="button"
              style={styles.doneButton}
            >
              <Text
                variant="bodyMedium"
                style={[styles.doneButtonText, { color: theme.colors.primary }]}
              >
                {t("common.done", "Done")}
              </Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </View>
  );
};

// Icon subcomponent for backward compatibility
const TextInputIcon: React.FC<TextInputIconProps> = ({ icon, name, size = 24, color }) => {
  const { theme } = useTheme();
  const iconName = icon || name || "help-circle";
  return <Ionicons name={iconName} size={size} color={color || theme.colors.onSurfaceVariant} />;
};

// Affix subcomponent for backward compatibility
const TextInputAffix: React.FC<TextInputAffixProps> = ({ text }) => {
  const { theme } = useTheme();
  return (
    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
      {text}
    </Text>
  );
};

// Create TextInput with subcomponents
export const TextInput = TextInputBase as TextInputComponent;

// Attach subcomponents
TextInput.Icon = TextInputIcon;
TextInput.Affix = TextInputAffix;

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  label: {
    marginBottom: 4,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    minHeight: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  leftElement: {
    marginRight: 8,
  },
  rightElement: {
    marginLeft: 8,
  },
  inputAccessory: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputAccessorySpacer: {
    flex: 1,
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
