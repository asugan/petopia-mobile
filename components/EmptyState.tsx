import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, useWindowDimensions } from 'react-native';
import { Card, Text, Button } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  buttonText?: string;
  onButtonPress?: () => void;
  buttonColor?: string;
  style?: StyleProp<ViewStyle>;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'emoticon-sad-outline',
  buttonText,
  onButtonPress,
  buttonColor,
  style,
  actionLabel,
  onAction,
}) => {
  const { theme } = useTheme();
  const isSmallScreen = useWindowDimensions().height < 700;

  return (
    <View style={[styles.container, isSmallScreen && styles.containerSmall, style]}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={[styles.content, isSmallScreen && styles.contentSmall]}>
          <MaterialCommunityIcons
            name={icon}
            size={isSmallScreen ? 48 : 64}
            color={theme.colors.onSurfaceVariant}
            style={styles.icon}
          />

          <Text
            variant={isSmallScreen ? "titleLarge" : "headlineSmall"}
            style={[styles.title, { color: theme.colors.onSurfaceVariant }]}
          >
            {title}
          </Text>

          {description && (
            <Text
              variant="bodyMedium"
              style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
            >
              {description}
            </Text>
          )}

          {(buttonText && onButtonPress) || (actionLabel && onAction) ? (
            <Button
              mode="contained"
              buttonColor={buttonColor || theme.colors.primary}
              textColor={theme.colors.onPrimary}
              onPress={onButtonPress || onAction}
              style={styles.button}
              labelStyle={isSmallScreen ? { fontSize: 14 } : undefined}
            >
              {buttonText || actionLabel}
            </Button>
          ) : null}
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  containerSmall: {
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    elevation: 2,
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  contentSmall: {
    padding: 20,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    minWidth: 160,
  },
});

export default EmptyState;