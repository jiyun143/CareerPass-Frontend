const ACCESS_TOKEN_KEY = "careerpass_access_token";

const safeStorage = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage;
};

export function getAccessToken(): string | null {
  const storage = safeStorage();
  if (!storage) return null;
  return storage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  const storage = safeStorage();
  if (!storage) return;
  storage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  const storage = safeStorage();
  if (!storage) return;
  storage.removeItem(ACCESS_TOKEN_KEY);
}
