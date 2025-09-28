import React from 'react';

export function BeatReveal({ run, children }: { run: boolean; children: React.ReactNode }) {
  return <div className={run ? 'vd-beat vd-flip' : ''}>{children}</div>;
}

export function WarmReveal({ show, children }: { show: boolean; children: React.ReactNode }) {
  return <div className={show ? 'vd-warm' : 'opacity-0'}>{children}</div>;
}

/** Aplica “Fagulha” quando success=true (ex.: após Cumprir) */
export function SparkOnSuccess({
  success, children, className = ''
}: { success: boolean; children: React.ReactNode; className?: string; }) {
  return <div className={`${className} ${success ? 'vd-spark' : ''}`}>{children}</div>;
}
