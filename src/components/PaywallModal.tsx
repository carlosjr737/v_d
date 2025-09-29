import React, { useState } from 'react';
import { useEntitlement } from '@/hooks/useEntitlement';

type Props = { isOpen: boolean; onClose: () => void; promoCode?: string };

export function PaywallModal({ isOpen, onClose, promoCode }: Props) {
  const { loginGoogle, loginApple, loginEmailLink, openCheckout } = useEntitlement();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'auth' | 'loading' | 'error'>('auth');
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!isOpen) return null;

  const doCheckout = async () => {
    try {
      setStep('loading');
      setInfo(null);
      await openCheckout(promoCode);
    } catch (e: any) {
      setErr(e?.message || 'Falha ao abrir o checkout');
      setInfo(null);
      setStep('error');
    }
  };

  const afterLogin = async (fn: () => Promise<any>) => {
    try {
      setStep('loading');
      setErr(null);
      setInfo(null);
      const result = await fn();
      if (result === 'link_sent') {
        setInfo('Enviamos um link mágico para o seu e-mail. Abra-o pelo mesmo dispositivo para continuar.');
        setStep('auth');
        return;
      }
      await doCheckout();
    } catch (e: any) {
      setErr(e?.message || 'Falha na autenticação');
      setInfo(null);
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded-2xl bg-bg-800 p-6">
        <h2 className="text-xl font-semibold text-white">Libere as Ações Especiais por 1 ano</h2>
        <p className="mt-1 text-sm text-white/70">Crie cartas personalizadas, escolha o destino e desbloqueie animações exclusivas.</p>
        <div className="my-4 rounded-lg bg-bg-900 p-3 text-sm">
          <div>
            <del>R$ 59,90</del> <strong>R$ 29,90</strong> (promo de lançamento)
          </div>
        </div>

        {step === 'auth' && (
          <>
            {info && <p className="mb-3 rounded-lg bg-bg-900/80 p-3 text-sm text-white/80">{info}</p>}
            <button className="mb-2 w-full rounded-xl bg-white py-2 text-black" onClick={() => afterLogin(() => loginGoogle())}>
              Continuar com Google
            </button>
            <button className="mb-2 w-full rounded-xl bg-white py-2 text-black" onClick={() => afterLogin(() => loginApple())}>
              Continuar com Apple
            </button>
            <div className="mt-2">
              <label className="text-xs text-white/70">Ou e-mail (link mágico)</label>
              <input
                className="mt-1 w-full rounded-xl bg-bg-900 p-2"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="mt-2 w-full rounded-xl bg-accent-500 py-2" onClick={() => afterLogin(() => loginEmailLink(email))}>
                Enviar link e continuar
              </button>
            </div>
            <button className="mt-4 w-full rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 py-2" onClick={doCheckout}>
              Já tenho conta — Ir para o pagamento
            </button>
            <button className="mt-2 w-full text-sm text-white/60" onClick={onClose}>
              Continuar grátis
            </button>
          </>
        )}

        {step === 'loading' && <p className="text-white/80">Preparando seu acesso seguro…</p>}
        {step === 'error' && (
          <>
            <p className="text-red-400">{err}</p>
            <button className="mt-3 w-full rounded-xl bg-bg-700 py-2" onClick={() => setStep('auth')}>
              Tentar novamente
            </button>
          </>
        )}
      </div>
    </div>
  );
}
