import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { AUTH_ROUTES } from '@/constants/routes';

export default function SignupScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace(AUTH_ROUTES.login);
  }, [router]);

  return null;
}
