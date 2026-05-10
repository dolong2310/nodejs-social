export function normalizeUserEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username?: string | null): string | undefined {
  const normalized = username?.trim().toLowerCase();
  return normalized || undefined;
}
