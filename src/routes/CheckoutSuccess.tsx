import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { refreshEntitlementRequest } from '@/services/entitlementApi';

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        console.debug('Stripe session_id:', params.get('session_id'));
        const token = await getAuth().currentUser?.getIdToken();
        if (!token) throw new Error('no-auth');
        await refreshEntitlementRequest(token);
        navigate('/');
      } catch (e) {
        console.error(e);
        navigate('/');
      }
    })();
  }, [params, navigate]);

  return (
    <div className="p-6 text-white">
      Concluindo seu acesso Premium… ⏳
    </div>
  );
}
