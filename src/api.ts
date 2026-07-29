const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── Local Storage Helper para Modo Demo / Pruebas ─
const getLocalPedidos = (): any[] => {
  const data = localStorage.getItem('nexus_local_pedidos');
  if (!data) {
    const initial = [
      {
        id: '1',
        cliente: 'Juan Pérez (Ejemplo)',
        telefono: '5493512345678',
        color: 'ByN',
        anillado: true,
        caras: 'Doble',
        distribucion: 'Normal',
        seña: 500,
        importe: 1500,
        notas: 'Imprimir 2 copias del manual de usuario',
        estado: 'Nuevo',
        fecha: new Date().toLocaleDateString('es-AR'),
        archivos: [{ id: 1, nombre: 'Manual.pdf', url: 'https://example.com/manual.pdf' }]
      }
    ];
    localStorage.setItem('nexus_local_pedidos', JSON.stringify(initial));
    return initial;
  }
  try {
    let parsed: any[] = JSON.parse(data);
    // Sanear / Renumerar IDs si hay timestamps largos residuales
    let updated = false;
    parsed = parsed.map((item, index) => {
      const num = parseInt(item.id, 10);
      if (isNaN(num) || String(item.id).length > 5) {
        updated = true;
        return { ...item, id: String(index + 1) };
      }
      return item;
    });
    if (updated) {
      localStorage.setItem('nexus_local_pedidos', JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return [];
  }
};

const saveLocalPedidos = (pedidos: any[]) => {
  localStorage.setItem('nexus_local_pedidos', JSON.stringify(pedidos));
};

// ── Auth ──────────────────────────────────────────
export const apiLogin = async (password: string) => {
  try {
    const res = await fetch(`${API_URL}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Contraseña incorrecta');
      throw new Error(`Error del servidor (${res.status})`);
    }
    const data = await res.json();
    localStorage.setItem('crm_access_token', data.access);
    localStorage.setItem('crm_refresh_token', data.refresh);
    return data;
  } catch (err: any) {
    if (err.message === 'Contraseña incorrecta') throw err;
    // Si la conexión falla (por ejemplo por CORS al probar en localhost contra el backend en producción)
    if (password === 'nexus2026') {
      const mockData = { access: 'demo-token', refresh: 'demo-refresh' };
      localStorage.setItem('crm_access_token', mockData.access);
      localStorage.setItem('crm_refresh_token', mockData.refresh);
      return mockData;
    }
    throw new Error('No se pudo conectar con el servidor backend (' + (err.message || 'Error de red') + ')');
  }
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
    if (refresh && refresh !== 'demo-refresh') {
      const refreshRes = await fetch(`${API_URL}/api/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem('crm_access_token', data.access);
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
  if (getToken() === 'demo-token') return getLocalPedidos();
  const res = await fetchWithRefresh(`${API_URL}/api/pedidos/`, {
    headers: authHeaders() as HeadersInit,
  });
  if (!res.ok) throw new Error('Error al obtener pedidos');
  return res.json();
};

export const apiCreatePedido = async (pedido: any) => {
  if (getToken() === 'demo-token') {
    const local = getLocalPedidos();
    const maxId = local.reduce((max, p) => {
      const num = parseInt(p.id, 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const nextId = String(maxId + 1);
    const newPedido = {
      ...pedido,
      id: nextId,
      fecha: new Date().toLocaleDateString('es-AR'),
      archivos: []
    };
    saveLocalPedidos([newPedido, ...local]);
    return newPedido;
  }
  const res = await fetchWithRefresh(`${API_URL}/api/pedidos/`, {
    method: 'POST',
    headers: authHeaders() as HeadersInit,
    body: JSON.stringify(pedido),
  });
  if (!res.ok) throw new Error('Error al crear pedido');
  return res.json();
};

export const apiUpdatePedido = async (id: string, pedido: any) => {
  if (getToken() === 'demo-token') {
    const local = getLocalPedidos();
    const index = local.findIndex(p => String(p.id) === String(id));
    if (index !== -1) {
      local[index] = { ...local[index], ...pedido };
      saveLocalPedidos(local);
      return local[index];
    }
    return { id, ...pedido };
  }
  const res = await fetchWithRefresh(`${API_URL}/api/pedidos/${id}/`, {
    method: 'PATCH',
    headers: authHeaders() as HeadersInit,
    body: JSON.stringify(pedido),
  });
  if (!res.ok) throw new Error('Error al actualizar pedido');
  return res.json();
};

export const apiDeletePedido = async (id: string) => {
  if (getToken() === 'demo-token') {
    const local = getLocalPedidos();
    saveLocalPedidos(local.filter(p => String(p.id) !== String(id)));
    return;
  }
  const res = await fetchWithRefresh(`${API_URL}/api/pedidos/${id}/`, {
    method: 'DELETE',
    headers: authHeaders() as HeadersInit,
  });
  if (!res.ok) throw new Error('Error al eliminar pedido');
};

// ── Archivos ──────────────────────────────────────
export const apiAgregarArchivo = async (pedidoId: string, nombre: string, url: string) => {
  if (getToken() === 'demo-token') {
    const local = getLocalPedidos();
    const index = local.findIndex(p => String(p.id) === String(pedidoId));
    const nuevoArchivo = { id: Date.now(), nombre, url };
    if (index !== -1) {
      if (!local[index].archivos) local[index].archivos = [];
      local[index].archivos.push(nuevoArchivo);
      saveLocalPedidos(local);
    }
    return nuevoArchivo;
  }
  const res = await fetchWithRefresh(`${API_URL}/api/pedidos/${pedidoId}/archivos/`, {
    method: 'POST',
    headers: authHeaders() as HeadersInit,
    body: JSON.stringify({ nombre, url }),
  });
  if (!res.ok) throw new Error('Error al agregar archivo');
  return res.json();
};

export const apiEliminarArchivo = async (archivoId: number) => {
  if (getToken() === 'demo-token') {
    const local = getLocalPedidos();
    local.forEach(p => {
      if (p.archivos) {
        p.archivos = p.archivos.filter((a: any) => a.id !== archivoId);
      }
    });
    saveLocalPedidos(local);
    return;
  }
  const res = await fetchWithRefresh(`${API_URL}/api/archivos/${archivoId}/`, {
    method: 'DELETE',
    headers: authHeaders() as HeadersInit,
  });
  if (!res.ok) throw new Error('Error al eliminar archivo');
};