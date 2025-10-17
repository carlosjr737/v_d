import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onBusyChange?: (busy: boolean) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isPremium?: boolean;
  onManageSubscription?: () => Promise<void>;
}

function normalizeError(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  user,
  onClose,
  onBusyChange,
  loginWithGoogle,
  loginWithEmailPassword,
  logout,
  isPremium = false,
  onManageSubscription,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const userLabel = useMemo(() => {
    if (!user) return null;
    return user.displayName || user.email || user.phoneNumber || 'Conta logada';
  }, [user]);

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setError(null);
  }, []);

  useEffect(() => {
    onBusyChange?.(isBusy);
  }, [isBusy, onBusyChange]);

  useEffect(() => {
    if (!isOpen) {
      setIsBusy(false);
      onBusyChange?.(false);
      resetForm();
    }
  }, [isOpen, onBusyChange, resetForm]);

  const handleClose = useCallback(() => {
    if (isBusy) return;
    onClose();
  }, [isBusy, onClose]);

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      handleClose();
    },
    [handleClose]
  );

  const handleLoginGoogle = useCallback(async () => {
    if (isBusy) return;
    setIsBusy(true);
    setError(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      setError(normalizeError(err, 'Falha ao tentar entrar.'));
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, loginWithGoogle, onClose]);

  const handleLoginEmailPassword = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isBusy) return;
      setIsBusy(true);
      setError(null);
      try {
        await loginWithEmailPassword(email, password);
        onClose();
      } catch (err) {
        setError(normalizeError(err, 'Falha ao tentar entrar.'));
      } finally {
        setIsBusy(false);
      }
    },
    [email, password, isBusy, loginWithEmailPassword, onClose]
  );

  const handleLogout = useCallback(async () => {
    if (isBusy) return;
    setIsBusy(true);
    setError(null);
    try {
      await logout();
      onClose();
    } catch (err) {
      setError(normalizeError(err, 'Falha ao sair da conta.'));
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, logout, onClose]);

  const handleManageSubscription = useCallback(async () => {
    if (isBusy || !onManageSubscription) return;
    setIsBusy(true);
    setError(null);
    try {
      await onManageSubscription();
    } catch (err) {
      setError(normalizeError(err, 'Falha ao abrir o gerenciamento da assinatura.'));
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, onManageSubscription]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-bg-900/95 p-6 text-left text-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          disabled={isBusy}
          className="absolute right-4 top-4 rounded-full border border-white/10 p-1 text-white/70 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-60"
          aria-label="Fechar"
        >
          ×
        </button>

        {user ? (
          <div className="space-y-5">
            <div>
              <h2 id="auth-modal-title" className="text-lg font-semibold">
                Conta
              </h2>
              {userLabel && (
                <p className="mt-1 text-sm text-white/70">Logado como {userLabel}</p>
              )}
            </div>
            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-3">
              {isPremium && onManageSubscription && (
                <button
                  type="button"
                  onClick={handleManageSubscription}
                  disabled={isBusy}
                  className="w-full rounded-pill border border-red-400/60 px-4 py-2 text-sm font-semibold text-red-200 transition hover:border-red-300 hover:text-red-100 focus:outline-none focus:ring-2 focus:ring-red-300/60 disabled:opacity-60"
                >
                  {isBusy ? 'Carregando...' : 'Cancelar assinatura'}
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isBusy}
                className="w-full rounded-pill border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:border-white focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-60"
              >
                {isBusy ? 'Saindo...' : 'Sair da conta'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isBusy}
                className="w-full rounded-pill border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-60"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h2 id="auth-modal-title" className="text-lg font-semibold">
                Entrar
              </h2>
              <p className="mt-1 text-sm text-white/70">
                Use sua conta do Google ou e-mail e senha para continuar.
              </p>
            </div>
            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleLoginGoogle}
                disabled={isBusy}
                className="w-full rounded-pill bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-60 disabled:hover:scale-100"
              >
                {isBusy ? 'Carregando...' : 'Entrar com Google'}
              </button>
              <div className="text-center text-[0.65rem] uppercase tracking-[0.3em] text-white/30">
                ou
              </div>
              <form className="space-y-3" onSubmit={handleLoginEmailPassword}>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-[0.65rem] uppercase tracking-wide text-white/50">E-mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) {
                        setError(null);
                      }
                    }}
                    disabled={isBusy}
                    className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none"
                    placeholder="seuemail@exemplo.com"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-[0.65rem] uppercase tracking-wide text-white/50">Senha</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) {
                        setError(null);
                      }
                    }}
                    disabled={isBusy}
                    className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full rounded-pill bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-60 disabled:hover:scale-100"
                >
                  {isBusy ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

AuthModal.displayName = 'AuthModal';

export default AuthModal;
