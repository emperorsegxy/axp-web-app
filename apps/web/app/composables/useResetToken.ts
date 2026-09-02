export function useResetToken() {
  return useState<string | null>('reset-token', () => null);
}
