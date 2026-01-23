import React from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import type { KeyboardAwareScrollViewProps } from 'react-native-keyboard-aware-scroll-view';

export interface KeyboardAwareViewProps extends Omit<KeyboardAwareScrollViewProps, 'children'> {
  children: React.ReactNode;
  /** Extra distance between keyboard and the focused input. Default: 50 */
  extraHeight?: number;
  /** Extra scroll space to add when keyboard appears. Default: 100 */
  extraScrollHeight?: number;
}

export function KeyboardAwareView({
  children,
  extraHeight = 50,
  extraScrollHeight = 100,
  ...props
}: KeyboardAwareViewProps) {
  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      extraHeight={extraHeight}
      extraScrollHeight={extraScrollHeight}
      {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
