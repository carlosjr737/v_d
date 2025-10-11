import { useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';
import {
  checkEntitlement,
  createCheckoutSession,
  type EntitlementResponse,
  type Plan,
} from '@/services/entitlementApi';

type EntitlementState = {
  active: boolean;
  expiresAt: string | null;
  loading: boolean;
  plan: Plan | null;
};

export function useEntitlement() {
  const [state, setState] = useState<EntitlementState>({
    active: false,
    loading: true,
    expiresAt: null,
    plan: null,
  });

  const refresh = useCallback(async (): Promise<EntitlementResponse> => {
    try {
      setState((s) => ({ ...s, loading: true }));
      const data = await checkEntitlement();
      setState({
        active: !!data.active,
        expiresAt: data.expiresAt ?? null,
        loading: false,
        plan: data.plan ?? null,
      });
      return data;
    } catch (err) {
      setState((s) => ({ ...s, loading: false }));
      throw err;
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {
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

    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      return;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code;
        if (code === 'auth/user-not-found') {
          try {
            await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
            return;
          } catch (createErr: unknown) {
            if (createErr && typeof createErr === 'object' && 'code' in createErr) {
              const createCode = (createErr as { code: string }).code;
              if (createCode === 'auth/weak-password') {
                throw new Error('Sua senha precisa ter pelo menos 6 caracteres.');
              }
              if (createCode === 'auth/email-already-in-use') {
                throw new Error('E-mail já cadastrado. Entre com sua senha.');
              }
            }
            if (createErr instanceof Error) {
              throw createErr;
            }
            throw new Error('Não foi possível criar sua conta.');
          }
        }

        if (code === 'auth/wrong-password') {
          throw new Error('Senha incorreta. Tente novamente.');
        }

        if (code === 'auth/invalid-credential') {
          throw new Error('Credenciais inválidas. Verifique os dados informados.');
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

  return { ...state, refresh, loginGoogle, loginEmailPassword, openCheckout };
}
