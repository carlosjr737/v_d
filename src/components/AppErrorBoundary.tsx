import React from 'react';

const STORAGE_KEY = 'verdade-ou-desafio-game';

type Props = { children: React.ReactNode };

export function AppErrorBoundary({ children }: Props) {
  const [error, setError] = React.useState<Error | null>(null);

  if (error) {
    return (
      <div className="min-h-dvh grid place-items-center p-6 text-center text-white">
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-semibold">Ops! Algo deu errado.</h2>
          <p className="text-sm opacity-80">
            Podemos reiniciar a sessão para corrigir dados corrompidos.
          </p>
          <button
            onClick={() => {
              try {
                localStorage.removeItem(STORAGE_KEY);
              } catch {
                // ignore
              }
              location.reload();
            }}
            className="px-5 h-12 rounded-full text-white"
            style={{ background: 'linear-gradient(135deg,#FF2E7E 0%,#FF6B4A 50%,#C400FF 100%)' }}
          >
            Reiniciar sessão
          </button>
          <details className="text-left text-xs opacity-70">
            <summary>Detalhes técnicos</summary>
            <pre className="whitespace-pre-wrap">{String(error?.stack || error?.message)}</pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={e => setError(e as Error)}
      fallbackRender={() => null}
    >
      {children}
    </ErrorBoundary>
  );
}

// Implementação mínima de ErrorBoundary (sem libs)
class ErrorBoundary extends React.Component<
  { fallbackRender: () => React.ReactNode; onError?: (e: unknown) => void },
  { hasError: boolean }
> {
  constructor(props: { fallbackRender: () => React.ReactNode; onError?: (e: unknown) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError?.(error);
  }

  render() {
    return this.state.hasError ? this.props.fallbackRender() : this.props.children;
  }
}
