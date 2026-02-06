import { io } from 'socket.io-client';

const normalizeSocketUrl = (value) => {
  if (!value) {
    return '';
  }
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const resolveSocketUrl = () => {
  const explicit = normalizeSocketUrl(import.meta.env.VITE_SOCKET_URL);
  if (explicit) {
    return explicit;
  }

  const apiBase = normalizeSocketUrl(import.meta.env.VITE_API_URL) || 'http://localhost:5000/api';
  if (apiBase.endsWith('/api')) {
    return apiBase.slice(0, -4);
  }

  const apiIndex = apiBase.indexOf('/api/');
  if (apiIndex !== -1) {
    return apiBase.slice(0, apiIndex);
  }

  return apiBase;
};

export const createSocket = (token) =>
  io(resolveSocketUrl(), {
    auth: token ? { token } : undefined,
    // Keep polling fallback so realtime still connects when direct WebSocket fails.
    transports: ['polling', 'websocket'],
    upgrade: true,
    reconnection: true,
    reconnectionAttempts: 10,
    timeout: 10000,
    autoConnect: true
  });
