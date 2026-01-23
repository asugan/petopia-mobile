import { useState, useCallback } from 'react';

export function useSplashAnimation() {
  const [isVisible, setIsVisible] = useState(true);

  const hideSplash = useCallback(() => {
    setIsVisible(false);
  }, []);

  return { isVisible, hideSplash };
}
