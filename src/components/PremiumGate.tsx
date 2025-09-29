import React, { useState } from 'react';
import { useEntitlement } from '@/hooks/useEntitlement';
import { PaywallModal } from './PaywallModal';

type Props = { children: (canUse: boolean, openPaywall: () => void) => React.ReactNode; promoCode?: string };

export function PremiumGate({ children, promoCode }: Props) {
  const { active, loading } = useEntitlement();
  const [open, setOpen] = useState(false);
  const openPaywall = () => setOpen(true);
  return (
    <>
      {children(!loading && active, openPaywall)}
      <PaywallModal isOpen={open} onClose={() => setOpen(false)} promoCode={promoCode} />
    </>
  );
}
