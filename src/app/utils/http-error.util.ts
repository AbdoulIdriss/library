export function formatHttpError(err: any, byStatus: Record<number, string | undefined>, fallback: string): string {
  const status = err?.status ?? -1;
  if (status in byStatus && byStatus[status]) return byStatus[status] as string;
  const backendMsg = err?.error?.error || err?.error?.message;
  if (backendMsg && typeof backendMsg === 'string') return backendMsg;
  if (status === 0) return byStatus[0] || 'Cannot reach the server. Please check your connection and try again.';
  return fallback;
}


