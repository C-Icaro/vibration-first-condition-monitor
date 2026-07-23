export function formatRelativeTime(value: string, now = Date.now()): string {
  const deltaSeconds = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000));

  if (deltaSeconds < 5) return "agora";
  if (deltaSeconds < 60) return `há ${deltaSeconds}s`;

  const minutes = Math.floor(deltaSeconds / 60);
  if (minutes < 60) return `há ${minutes}min`;

  const hours = Math.floor(minutes / 60);
  return `há ${hours}h`;
}

export function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}
