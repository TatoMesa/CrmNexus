const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── Auth ──────────────────────────────────────────
export const apiLogin = async (password: string) => {
  const res = await fetch(`${API_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error('Contraseña incorrecta');
  const data = await res.json();
  localStorage.setItem('crm_access_token', data.access);
  localStorage.setItem('crm_refresh_token', data.refresh);
  return data;
};

export const apiLogout = () => {
  localStorage.removeItem('crm_access_token');
  localStorage.removeItem('crm_refresh_token');
};

export const getToken = () => localStorage.getItem('crm_access_token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

// Refresca el token automáticamente si expiró
const fetchWithRefresh = async (url: string, options: RequestInit): Promise<Response> => {
  let res = await fetch(url, options);
  if (res.status === 401) {
    const refresh = localStorage.getItem('crm_refresh_token');
    if (refresh) {
      const refreshRes = await fetch(`${API_URL}/api/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem('crm_access_token', data.access);
        // Reintentar con nuevo token
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${data.access}`,
        };
        res = await fetch(url, options);
      }
    }
  }
  return res;
};

// ── Pedidos ───────────────────────────────────────
export const apiGetPedidos = async () => {
  const res = await fetchWithRefresh(`${API_URL}/api/pedidos/`, {
    headers: authHeaders() as HeadersInit,
  });
  if (!res.ok) throw new Error('Error al obtener pedidos');
  return res.json();
};

export const apiCreatePedido = async (pedido: object) => {
  const res = await fetchWithRefresh(`${API_URL}/api/pedidos/`, {
    method: 'POST',
    headers: authHeaders() as HeadersInit,
    body: JSON.stringify(pedido),
  });
  if (!res.ok) throw new Error('Error al crear pedido');
  return res.json();
};

export const apiUpdatePedido = async (id: string, pedido: object) => {
  const res = await fetchWithRefresh(`${API_URL}/api/pedidos/${id}/`, {
    method: 'PATCH',
    headers: authHeaders() as HeadersInit,
    body: JSON.stringify(pedido),
  });
  if (!res.ok) throw new Error('Error al actualizar pedido');
  return res.json();
};

export const apiDeletePedido = async (id: string) => {
  const res = await fetchWithRefresh(`${API_URL}/api/pedidos/${id}/`, {
    method: 'DELETE',
    headers: authHeaders() as HeadersInit,
  });
  if (!res.ok) throw new Error('Error al eliminar pedido');
};

// ── Archivos ──────────────────────────────────────
export const apiAgregarArchivo = async (pedidoId: string, nombre: string, url: string) => {
  const res = await fetchWithRefresh(`${API_URL}/api/pedidos/${pedidoId}/archivos/`, {
    method: 'POST',
    headers: authHeaders() as HeadersInit,
    body: JSON.stringify({ nombre, url }),
  });
  if (!res.ok) throw new Error('Error al agregar archivo');
  return res.json();
};

export const apiEliminarArchivo = async (archivoId: number) => {
  const res = await fetchWithRefresh(`${API_URL}/api/archivos/${archivoId}/`, {
    method: 'DELETE',
    headers: authHeaders() as HeadersInit,
  });
  if (!res.ok) throw new Error('Error al eliminar archivo');
};