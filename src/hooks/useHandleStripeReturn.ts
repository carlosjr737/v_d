import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '@/config/firebase';
import { refreshEntitlementRequest } from '@/services/entitlementApi';

type HandleStripeReturnOptions = {
  onBeforeRefresh?: () => void;
  redirectTo?: string;
};

export function useHandleStripeReturn({
  onBeforeRefresh,
  redirectTo = '/',
}: HandleStripeReturnOptions = {}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth) {
      navigate(redirectTo, { replace: true });
      return;
    }

    let cancelled = false;

    const goToDestination = () => {
      if (!cancelled) {
        navigate(redirectTo, { replace: true });
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (cancelled) {
        return;
      }

      if (!user) {
        goToDestination();
        return;
      }

      try {
        onBeforeRefresh?.();
        const token = await user.getIdToken();
        await refreshEntitlementRequest(token);
      } catch (err) {
        console.error(err);
      } finally {
        goToDestination();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [navigate, onBeforeRefresh, redirectTo]);
}
