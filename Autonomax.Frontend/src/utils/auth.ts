// Utilitários para gestão segura de autenticação e tokens no cliente

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    // Decodifica a carga do JWT de forma segura
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(payloadBase64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);

    if (!parsed.exp) return false;

    // Margem de segurança de 10 segundos
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    return parsed.exp < currentTimeInSeconds + 10;
  } catch {
    return true;
  }
}

export function getToken(): string | null {
  const token = localStorage.getItem('@Autonomax:token');
  if (isTokenExpired(token)) {
    clearAuthSession();
    return null;
  }
  return token;
}

export function clearAuthSession() {
  localStorage.removeItem('@Autonomax:token');
  localStorage.removeItem('@Autonomax:user');
  sessionStorage.clear();
}
