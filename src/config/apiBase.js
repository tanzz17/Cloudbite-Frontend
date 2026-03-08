const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();

const sanitizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");
const hasApiSuffix = /\/api$/i.test(sanitizedBaseUrl);

export const API_BASE_URL = hasApiSuffix
  ? sanitizedBaseUrl
  : `${sanitizedBaseUrl}/api`;

export const WS_BASE_URL = API_BASE_URL.replace(/\/api$/i, "");

export const apiUrl = (path = "") => {
  if (!path) return API_BASE_URL;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};
