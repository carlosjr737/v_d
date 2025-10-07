const scheduleTimeout = (handler: () => void, delay: number) => {
  if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
    return window.setTimeout(handler, delay);
  }
  return setTimeout(handler, delay);
};

export async function playDeltaThen(
  setDelta: (playerId: string, delta: number | null) => void,
  playerId: string,
  delta: number,
  delayMs = 900
) {
  if (!playerId || !Number.isFinite(delta) || delta === 0) {
    return;
  }

  setDelta(playerId, delta);

  await new Promise<void>(resolve => {
    scheduleTimeout(() => {
      setDelta(playerId, null);
      resolve();
    }, delayMs);
  });
}
