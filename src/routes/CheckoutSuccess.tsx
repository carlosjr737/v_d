import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useHandleStripeReturn } from '@/hooks/useHandleStripeReturn';

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const logSessionId = useCallback(() => {
    if (sessionId) {
      console.debug('Stripe session_id:', sessionId);
    }
  }, [sessionId]);

  useHandleStripeReturn({ onBeforeRefresh: logSessionId });

  return (
    <div className="p-6 text-white">
      Concluindo seu acesso Premium… ⏳
    </div>
  );
}
