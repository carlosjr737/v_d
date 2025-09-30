import { useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '@/config/firebase';
import { checkEntitlement, createCheckoutSession } from '@/services/entitlementApi';

type Entitlement = { active: boolean; expiresAt?: string | null; loading: boolean };

export function useEntitlement() {
  const [state, setState] = useState<Entitlement>({ active: false, loading: true, expiresAt: null });

  const refresh = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true }));
      const data = await checkEntitlement();
      setState({ active: !!data.active, expiresAt: data.expiresAt ?? null, loading: false });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {
      refresh().catch(() => {});
    });
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const email = window.localStorage.getItem('magic_email') || window.prompt('Confirme seu e-mail');
      if (email) {
        signInWithEmailLink(auth, email, window.location.href).finally(() => {
          window.localStorage.removeItem('magic_email');
        });
      }
    }
    return () => unsub();
  }, [refresh]);

  const loginGoogle = async () => signInWithPopup(auth, googleProvider);
  const loginApple = async () => signInWithPopup(auth, appleProvider);
  const loginEmailLink = async (email: string, continueUrl?: string) => {
    const trimmed = email.trim();
    if (!trimmed) {
      throw new Error('Informe um e-mail válido');
    }
    await sendSignInLinkToEmail(auth, trimmed, {
      url: continueUrl || window.location.href,
      handleCodeInApp: true,
    });
    window.localStorage.setItem('magic_email', trimmed);
    return 'link_sent' as const;
  };

  const openCheckout = async (promoCode?: string, plan: 'monthly' | 'annual' = 'monthly') => {
    const { url } = await createCheckoutSession(promoCode, plan);
    window.location.href = url;
  };

  return { ...state, refresh, loginGoogle, loginApple, loginEmailLink, openCheckout };
}
