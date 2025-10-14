import React, { useEffect, useState } from 'react';
import { useEntitlement } from '@/hooks/useEntitlement';

type Props = { isOpen: boolean; onClose: () => void; promoCode?: string };

export function PaywallModal({ isOpen, onClose, promoCode }: Props) {
  const {
    loginGoogle,
    loginEmailPassword,
    openCheckout,
    refresh,
    active,
    loading,
    user,
  } = useEntitlement();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [step, setStep] = useState<'auth' | 'plan' | 'loading' | 'error'>('auth');
  const [err, setErr] = useState<string | null>(null);
  const [retryStep, setRetryStep] = useState<'auth' | 'plan'>('auth');

  const handleContinueFree = () => {
    onClose();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setStep('auth');
      setErr(null);
      setEmail('');
      setPassword('');
      setRetryStep('auth');
      return;
    }

    if (loading) {
      return;
    }

    if (active) {
      onClose();
      return;
    }

    if (user) {
      setEmail('');
      setPassword('');
      setSelectedPlan('annual');
      setRetryStep('plan');
      setStep('plan');
      return;
    }

    setStep('auth');
    setRetryStep('auth');
  }, [isOpen, loading, active, user, onClose]);

  if (!isOpen) return null;

  const doCheckout = async () => {
    try {
      setStep('loading');
      await openCheckout(promoCode, selectedPlan);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao abrir o checkout';
      setErr(message);
      setRetryStep('plan');
      setStep('error');
    }
  };

  const afterLogin = async (fn: () => Promise<unknown>) => {
    try {
      setStep('loading');
      setErr(null);
      setRetryStep('auth');
      await fn();
      try {
        const entitlement = await refresh();
        if (entitlement?.active) {
          setStep('auth');
          onClose();
          return;
        }
      } catch (refreshErr: unknown) {
        const message = refreshErr instanceof Error ? refreshErr.message : 'Falha ao verificar sua assinatura';
        setErr(message);
        setRetryStep('auth');
        setStep('error');
        return;
      }
      setEmail('');
      setPassword('');
      setSelectedPlan('annual');
      setRetryStep('plan');
      setStep('plan');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha na autenticação';
      setErr(message);
      setRetryStep('auth');
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded-2xl bg-bg-800 p-6">
        <h2 className="text-xl font-semibold text-white">Libere as Ações Especiais por 1 ano</h2>
        <p className="mt-1 text-sm text-white/70">Crie cartas personalizadas, escolha o destino e desbloqueie animações exclusivas.</p>
        
        {step === 'auth' && (
          <>
            <button className="mb-2 w-full rounded-xl bg-white py-2 text-black" onClick={() => afterLogin(() => loginGoogle())}>
              Continuar com Google
            </button>
            <div className="mt-2 space-y-2">
              <label className="text-xs text-white/70">Ou crie uma conta com e-mail e senha</label>
              <input
                className="mt-1 w-full rounded-xl bg-bg-900 p-2"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="w-full rounded-xl bg-bg-900 p-2"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="w-full rounded-xl bg-accent-500 py-2"
                onClick={() => afterLogin(() => loginEmailPassword(email, password))}
              >
                Criar conta e continuar
              </button>
            </div>
            <button className="mt-2 w-full text-sm text-white/60" onClick={handleContinueFree}>
              Continuar grátis
            </button>
          </>
        )}

        {step === 'plan' && (
          <>
            <div className="my-4 space-y-3">
              <div className="text-sm font-semibold text-white">Escolha seu plano:</div>

              <div className="grid gap-2">
                <button
                  onClick={() => setSelectedPlan('annual')}
                  className={`rounded-lg border p-3 text-left transition ${
                    selectedPlan === 'annual'
                      ? 'border-accent-500 bg-accent-500/10'
                      : 'border-white/20 bg-bg-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Anual</div>
                      <div className="text-sm text-white/70">R$ 97,90/ano</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-accent-400 font-semibold">ECONOMIZE 70%</div>
                      <div className="text-xs text-white/60">~R$ 8/mês</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`rounded-lg border p-3 text-left transition ${
                    selectedPlan === 'monthly'
                      ? 'border-accent-500 bg-accent-500/10'
                      : 'border-white/20 bg-bg-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Mensal</div>
                      <div className="text-sm text-white/70">R$ 29,90/mês</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            <button
              className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 py-2"
              onClick={doCheckout}
            >
              {selectedPlan === 'annual' ? 'Assinar Anual (R$ 97,90)' : 'Assinar Mensal (R$ 29,90)'}
            </button>
            <button className="mt-3 w-full text-sm text-white/60" onClick={handleContinueFree}>
              Continuar na versão gratuita
            </button>
          </>
        )}

        {step === 'loading' && <p className="text-white/80">Preparando seu acesso seguro…</p>}
        {step === 'error' && (
          <>
            <p className="text-red-400">{err}</p>
            <button
              className="mt-3 w-full rounded-xl bg-bg-700 py-2"
              onClick={() => {
                setErr(null);
                setStep(retryStep);
              }}
            >
              Tentar novamente
            </button>
          </>
        )}
      </div>
    </div>
  );
}
