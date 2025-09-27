import React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

type AppErrorBoundaryProps = { children: React.ReactNode; onError?: (e: unknown) => void };
const Fallback = (_: FallbackProps) => null;
export function AppErrorBoundary({ children, onError }: AppErrorBoundaryProps) {
  return (
    <ErrorBoundary onError={e => onError?.(e)} fallbackRender={Fallback}>
      {children}
    </ErrorBoundary>
  );
}
