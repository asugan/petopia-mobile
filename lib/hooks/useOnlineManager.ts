import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useOnlineManager() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      void state;
    });

    return () => unsubscribe();
  }, []);
}
