import { useEffect } from 'react';
import { useEntitlement } from '@/hooks/useEntitlement';

export default function CheckoutSuccess() {
  const { refresh } = useEntitlement();
  useEffect(() => {
    refresh();
  }, [refresh]);
  return <div className="p-6 text-white">Concluído! Seu Premium foi ativado. 🎉</div>;
}
