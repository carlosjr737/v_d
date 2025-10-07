import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { refreshEntitlementRequest } from '@/services/entitlementApi';
import { auth } from '@/config/firebase';

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth) {
      navigate('/');
      return;
    }

    let cancelled = false;

    const goHome = () => {
      if (!cancelled) {
        navigate('/', { replace: true });
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) {
        return;
      }

      if (!user) {
        goHome();
        return;
      }

      try {
        console.debug('Stripe session_id:', params.get('session_id'));
        const token = await user.getIdToken();
        await refreshEntitlementRequest(token);
      } catch (e) {
        console.error(e);
      } finally {
        goHome();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [navigate, params]);

  return (
    <div className="p-6 text-white">
      Concluindo seu acesso Premium… ⏳
    </div>
  );
}
