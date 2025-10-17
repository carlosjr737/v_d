import { useCallback, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';
import {
  checkEntitlement,
  createCheckoutSession,
  createBillingPortalSession,
  type EntitlementResponse,
  type Plan,
} from '@/services/entitlementApi';

type EntitlementState = {
  active: boolean;
  expiresAt: string | null;
  loading: boolean;
  plan: Plan | null;
  user: User | null;
};

export function useEntitlement() {
  const [state, setState] = useState<EntitlementState>({
    active: false,
    loading: true,
    expiresAt: null,
    plan: null,
    user: auth?.currentUser ?? null,
  });

  const refresh = useCallback(async (): Promise<EntitlementResponse> => {
    try {
      setState((s) => ({ ...s, loading: true }));
      const data = await checkEntitlement();
      setState((prev) => ({
        ...prev,
        active: !!data.active,
        expiresAt: data.expiresAt ?? null,
        loading: false,
        plan: data.plan ?? null,
      }));
      return data;
    } catch (err) {
      setState((s) => ({ ...s, loading: false }));
      throw err;
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setState((prev) => ({ ...prev, user: firebaseUser ?? null }));
      refresh().catch(() => {});
    });
    return () => unsub();
  }, [refresh]);

  const loginGoogle = async () => signInWithPopup(auth, googleProvider);
  const loginEmailPassword = async (email: string, password: string) => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      throw new Error('Informe um e-mail válido');
    }

    if (!trimmedPassword) {
      throw new Error('Informe uma senha');
    }


    const createAccount = async () => {
      try {
        await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      } catch (createErr: unknown) {
        if (createErr && typeof createErr === 'object' && 'code' in createErr) {
          const createCode = (createErr as { code: string }).code;
          if (createCode === 'auth/weak-password') {
            throw new Error('Sua senha precisa ter pelo menos 6 caracteres.');
          }
          if (createCode === 'auth/email-already-in-use') {
            throw new Error('Senha incorreta. Tente novamente.');
          }
        }
        if (createErr instanceof Error) {
          throw createErr;
        }
        throw new Error('Não foi possível criar sua conta.');
      }
    };

    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code;

        if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
          await createAccount();
          return;

        }

        if (code === 'auth/wrong-password') {
          throw new Error('Senha incorreta. Tente novamente.');
        }


        if (code === 'auth/invalid-email') {
          throw new Error('Informe um e-mail válido');

        }
      }

      if (err instanceof Error) {
        throw err;
      }

      throw new Error('Não foi possível autenticar.');
    }
  };

  const openCheckout = async (promoCode?: string, plan: Plan = 'monthly') => {
    const { url } = await createCheckoutSession(promoCode, plan);
    window.location.href = url;
  };

  const openCustomerPortal = async () => {
    const { url } = await createBillingPortalSession();
    window.location.href = url;
  };

  const logout = async () => {
    await signOut(auth);
    setState((prev) => ({
      ...prev,
      active: false,
      expiresAt: null,
      plan: null,
      user: null,
    }));
  };

  return {
    ...state,
    refresh,
    loginGoogle,
    loginEmailPassword,
    openCheckout,
    openCustomerPortal,
    logout,
  };
}
