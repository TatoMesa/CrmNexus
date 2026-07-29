import { apiLogin, apiLogout, apiGetPedidos, apiCreatePedido, apiUpdatePedido, apiDeletePedido, apiAgregarArchivo, apiEliminarArchivo} from './api';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  Upload, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  ChevronLeft, 
  Phone, 
  MessageCircle, 
  DollarSign, 
  Layers, 
  FileText,
  X,
  Link as LinkIcon,
  Paperclip,
  Lock,
  LogOut,
  Archive,
  RotateCcw,
  CheckCircle,
  FileCheck
} from 'lucide-react';

interface ArchivoAdjunto {
  id?: number;
  nombre: string;
  url: string;
}

interface Pedido {
  id: string;
  cliente: string;
  telefono: string;
  color: 'ByN' | 'Color';
  anillado: boolean;
  caras: 'Simple' | 'Doble';
  distribucion: 'Normal' | 'Apaisada';
  seña: number;
  importe: number;
  notas: string;
  estado: 'Nuevo' | 'En proceso' | 'Terminado' | 'Cliente Avisado' | 'Entregado';
  fecha: string;
  archivos?: ArchivoAdjunto[];
}

type ColumnStatus = 'Nuevo' | 'En proceso' | 'Terminado' | 'Cliente Avisado';

const COLUMNS: { key: ColumnStatus; label: string; badgeClass: string }[] = [
  { key: 'Nuevo', label: 'Nuevo', badgeClass: 'nuevo' },
  { key: 'En proceso', label: 'En proceso', badgeClass: 'proceso' },
  { key: 'Terminado', label: 'Terminado', badgeClass: 'terminado' },
  { key: 'Cliente Avisado', label: 'Cliente Avisado', badgeClass: 'avisado' }
];

const formatPedidoId = (id: string | number) => {
  const str = String(id);
  if (/^\d+$/.test(str)) {
    return `#${str.padStart(3, '0')}`;
  }
  return `#${str}`;
};

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('nexus_authenticated') === 'true';
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Main navigation Tab
  const [activeTab, setActiveTab] = useState<'board' | 'history'>('board');

  // Pedidos State
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [,setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [activeMobileCol, setActiveMobileCol] = useState<ColumnStatus>('Nuevo');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Form States
  const [formCliente, setFormCliente] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formColor, setFormColor] = useState<'ByN' | 'Color'>('ByN');
  const [formAnillado, setFormAnillado] = useState(false);
  const [formCaras, setFormCaras] = useState<'Simple' | 'Doble'>('Simple');
  const [formDistribucion, setFormDistribucion] = useState<'Normal' | 'Apaisada'>('Normal');
  const [formSeña, setFormSeña] = useState('');
  const [formImporte, setFormImporte] = useState('');
  const [formEstado, setFormEstado] = useState<Pedido['estado']>('Nuevo');
  const [formNotas, setFormNotas] = useState('');
  const [formArchivos, setFormArchivos] = useState<ArchivoAdjunto[]>([]);
  const [newArchivoNombre, setNewArchivoNombre] = useState('');
  const [newArchivoUrl, setNewArchivoUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

// Cargar pedidos desde la API al autenticarse
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      apiGetPedidos()
        .then(data => setPedidos(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);
  

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiLogin(loginPassword);
      setIsAuthenticated(true);
      sessionStorage.setItem('nexus_authenticated', 'true');
      setLoginError('');
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err?.message || 'Contraseña incorrecta. Inténtalo de nuevo.');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    apiLogout();
    setIsAuthenticated(false);
    setPedidos([]);
    sessionStorage.removeItem('nexus_authenticated');
  };

  // Open Modal for Create
  const handleOpenCreateModal = () => {
    setEditingPedido(null);
    setFormCliente('');
    setFormTelefono('');
    setFormColor('ByN');
    setFormAnillado(false);
    setFormCaras('Simple');
    setFormDistribucion('Normal');
    setFormSeña('');
    setFormImporte('');
    setFormEstado('Nuevo');
    setFormNotas('');
    setFormArchivos([]);
    setNewArchivoNombre('');
    setNewArchivoUrl('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (pedido: Pedido) => {
    setEditingPedido(pedido);
    setFormCliente(pedido.cliente);
    setFormTelefono(pedido.telefono);
    setFormColor(pedido.color);
    setFormAnillado(pedido.anillado);
    setFormCaras(pedido.caras);
    setFormDistribucion(pedido.distribucion);
    setFormSeña(pedido.seña.toString());
    setFormImporte(pedido.importe.toString());
    setFormEstado(pedido.estado);
    setFormNotas(pedido.notas);
    setFormArchivos(pedido.archivos || []);
    setNewArchivoNombre('');
    setNewArchivoUrl('');
    setIsModalOpen(true);
  };

  // Save Form (Create or Update)
  const handleSavePedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCliente.trim()) {
      alert('Por favor ingresá el nombre del cliente');
      return;
    }
    const señaVal = parseFloat(formSeña) || 0;
    const importeVal = parseFloat(formImporte) || 0;
    const data = {
      cliente: formCliente.trim(),
      telefono: formTelefono.trim(),
      color: formColor,
      anillado: formAnillado,
      caras: formCaras,
      distribucion: formDistribucion,
      seña: señaVal,
      importe: importeVal,
      estado: formEstado,
      notas: formNotas.trim(),
    };
    try {
      if (editingPedido) {
        const updated = await apiUpdatePedido(editingPedido.id, data);
        setPedidos(prev => prev.map(p => p.id === editingPedido.id ? updated : p));
      } else {
        const created = await apiCreatePedido(data);
        // Guardar archivos adjuntos si los hay
        if (formArchivos.length > 0) {
          const archivosGuardados = await Promise.all(
            formArchivos.map(a => apiAgregarArchivo(created.id, a.nombre, a.url))
          );
          created.archivos = archivosGuardados;
        }
        setPedidos(prev => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Error al guardar el pedido. Intentá de nuevo.');
    }
  };

  // Delete Pedido
  const handleDeletePedido = async (id: string) => {
    if (window.confirm('¿Estás seguro de que querés eliminar este pedido permanentemente?')) {
      try {
        await apiDeletePedido(id);
        setPedidos(prev => prev.filter(p => p.id !== id));
      } catch {
        alert('Error al eliminar el pedido.');
      }
    }
  };

  // Archive / Deliver Pedido
  const handleDeliverPedido = async (id: string) => {
    if (window.confirm('¿Confirmás que el pedido fue entregado? Se moverá al historial.')) {
      try {
        const updated = await apiUpdatePedido(id, { estado: 'Entregado' });
        setPedidos(prev => prev.map(p => p.id === id ? updated : p));
      } catch {
        alert('Error al actualizar el pedido.');
      }
    }
  };

  // Reopen Pedido (from History to Active Board)
  const handleReopenPedido = async (id: string) => {
    if (window.confirm('¿Deseás reabrir este pedido y devolverlo al tablero activo?')) {
      try {
        const updated = await apiUpdatePedido(id, { estado: 'Cliente Avisado' });
        setPedidos(prev => prev.map(p => p.id === id ? updated : p));
      } catch {
        alert('Error al reabrir el pedido.');
      }
    }
  };

  // Move Column via Buttons
  const movePedido = async (id: string, direction: 'prev' | 'next') => {
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) return;

    if (pedido.estado === 'Cliente Avisado' && direction === 'next') {
      handleDeliverPedido(id);
      return;
    }

    const currentIndex = COLUMNS.findIndex(c => c.key === pedido.estado);
    let nextIndex = currentIndex;
    if (direction === 'prev' && currentIndex > 0) nextIndex--;
    if (direction === 'next' && currentIndex < COLUMNS.length - 1) nextIndex++;

    if (nextIndex !== currentIndex) {
      try {
        const updated = await apiUpdatePedido(id, { estado: COLUMNS[nextIndex].key });
        setPedidos(prev => prev.map(p => p.id === id ? updated : p));
      } catch {
        alert('Error al mover el pedido.');
      }
    }
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = async (e: React.DragEvent, targetCol: ColumnStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      try {
        const updated = await apiUpdatePedido(id, { estado: targetCol });
        setPedidos(prev => prev.map(p => p.id === id ? updated : p));
      } catch {
        alert('Error al mover el pedido.');
      }
    }
  };

  // Export Data to JSON
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pedidos, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nexus_crm_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Data from JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          if (window.confirm(`Se importarán ${imported.length} pedidos. Esto combinará con tus datos actuales. ¿Deseas continuar?`)) {
            setPedidos(prev => {
              // Merge, avoiding duplicate IDs
              const existingIds = new Set(prev.map(p => p.id));
              const newItems = imported.filter((p: any) => p.id && !existingIds.has(p.id));
              return [...prev, ...newItems];
            });
          }
        } else {
          alert('El archivo no tiene el formato correcto (debe ser una lista JSON).');
        }
      } catch (err) {
        alert('Error al leer el archivo. Asegúrate de que sea un JSON válido.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // LOGIN SCREEN RENDER
  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: 'Outfit, sans-serif',
        padding: '1.5rem'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '2.5rem 2rem',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          {/* Logo */}
          <div style={{
            backgroundColor: '#ecfdf5',
            color: '#10b981',
            width: '60px',
            height: '60px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            border: '2px solid rgba(16, 185, 129, 0.2)',
            marginBottom: '1rem',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
          }}>N</div>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0' }}>Nexus CRM</h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.75rem' }}>
            Control de Pedidos e Impresiones
          </p>

          <form onSubmit={handleLoginSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                Contraseña de Negocio
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Introduce la contraseña"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            {loginError && (
              <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>{loginError}</span>
            )}

            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', marginTop: '0.5rem' }}>
              Ingresar al CRM
            </button>
          </form>
          
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2rem' }}>
            Acceso administrativo exclusivo de Nexus
          </span>
        </div>
      </div>
    );
  }

  // ACTIVE BOARD AND HISTORIAL SEGREGATION
  const activePedidos = pedidos.filter(p => p.estado !== 'Entregado');
  const deliveredPedidos = pedidos.filter(p => p.estado === 'Entregado');

  // Filtered Pedidos
  const filteredActivePedidos = activePedidos.filter(p => {
    const query = search.toLowerCase();
    const formattedId = formatPedidoId(p.id).toLowerCase();
    return (
      p.cliente.toLowerCase().includes(query) ||
      p.telefono.includes(query) ||
      p.notas.toLowerCase().includes(query) ||
      String(p.id).includes(query) ||
      formattedId.includes(query)
    );
  });

  const filteredHistoryPedidos = deliveredPedidos.filter(p => {
    const query = historySearch.toLowerCase();
    const formattedId = formatPedidoId(p.id).toLowerCase();
    return (
      p.cliente.toLowerCase().includes(query) ||
      p.telefono.includes(query) ||
      p.notas.toLowerCase().includes(query) ||
      String(p.id).includes(query) ||
      formattedId.includes(query)
    );
  });

  // Calculate Metrics (Active board only)
  const totalActivePedidos = activePedidos.length;
  const totalSeñas = activePedidos.reduce((acc, curr) => acc + curr.seña, 0);
  const totalImportes = activePedidos.reduce((acc, curr) => acc + curr.importe, 0);
  const totalPendiente = totalImportes - totalSeñas;

  // History Metrics
  const totalDeliveredCount = deliveredPedidos.length;
  const totalRevenueDelivered = deliveredPedidos.reduce((acc, curr) => acc + curr.importe, 0);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">N</div>
          <div className="logo-text">Nexus<span>CRM</span></div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={18} />
            <span>Nuevo Pedido</span>
          </button>
          <button className="btn btn-secondary btn-icon" onClick={handleLogout} title="Cerrar Sesión">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div style={{
        maxWidth: '1600px',
        width: '100%',
        margin: '1.25rem auto 0',
        padding: '0 2rem',
        display: 'flex',
        borderBottom: '2px solid var(--border-color)',
        gap: '1.5rem'
      }}>
        <button 
          onClick={() => setActiveTab('board')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'board' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'board' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '1rem',
            padding: '0.75rem 0.5rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Layers size={18} />
          Tablero Kanban
          <span style={{
            fontSize: '0.75rem',
            backgroundColor: activeTab === 'board' ? 'var(--primary)' : 'var(--border-color)',
            color: activeTab === 'board' ? 'white' : 'var(--text-muted)',
            padding: '0.125rem 0.5rem',
            borderRadius: '999px',
            marginLeft: '0.25rem'
          }}>{activePedidos.length}</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('history')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'history' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'history' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '1rem',
            padding: '0.75rem 0.5rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Archive size={18} />
          Historial de Entregados
          <span style={{
            fontSize: '0.75rem',
            backgroundColor: activeTab === 'history' ? 'var(--primary)' : 'var(--border-color)',
            color: activeTab === 'history' ? 'white' : 'var(--text-muted)',
            padding: '0.125rem 0.5rem',
            borderRadius: '999px',
            marginLeft: '0.25rem'
          }}>{deliveredPedidos.length}</span>
        </button>
      </div>

      {activeTab === 'board' ? (
        <>
          {/* Metrics Dashboard */}
          <section className="dashboard-metrics">
            <div className="metric-card">
              <div className="metric-icon blue">
                <Layers size={22} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Pedidos Activos</span>
                <span className="metric-value">{totalActivePedidos}</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon green">
                <DollarSign size={22} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Seña Recibida</span>
                <span className="metric-value">${totalSeñas.toLocaleString('es-AR')}</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon amber">
                <DollarSign size={22} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Saldo Pendiente</span>
                <span className="metric-value">${totalPendiente.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </section>

          {/* Search & Actions Bar */}
          <section className="control-bar">
            <div className="search-container">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Buscar por cliente, teléfono o notas..." 
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="backup-actions">
              <button className="btn btn-secondary" onClick={handleExportData} title="Exportar Copia de Seguridad">
                <Download size={16} />
                <span>Exportar</span>
              </button>
              <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} title="Importar Copia de Seguridad">
                <Upload size={16} />
                <span>Importar</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".json"
                onChange={handleImportData}
              />
            </div>
          </section>

          {/* Mobile Column Tabs */}
          <section className="mobile-col-selector">
            {COLUMNS.map(col => {
              const count = filteredActivePedidos.filter(p => p.estado === col.key).length;
              return (
                <button 
                  key={col.key}
                  className={`mobile-tab-btn ${activeMobileCol === col.key ? 'active' : ''}`}
                  onClick={() => setActiveMobileCol(col.key)}
                >
                  <span>{col.label}</span>
                  <span className={`col-badge ${col.badgeClass}`}>{count}</span>
                </button>
              );
            })}
          </section>

          {/* Board */}
          <main className="board-container">
            {COLUMNS.map(col => {
              const colPedidos = filteredActivePedidos.filter(p => p.estado === col.key);
              const isMobileActive = activeMobileCol === col.key;

              return (
                <div 
                  key={col.key} 
                  className={`kanban-col ${isMobileActive ? '' : 'hidden'}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, col.key)}
                >
                  <div className="kanban-col-header">
                    <div className="col-title-area">
                      <span className={`col-badge ${col.badgeClass}`}>{colPedidos.length}</span>
                      <h3 className="col-title">{col.label}</h3>
                    </div>
                  </div>

                  <div className="cards-list">
                    {colPedidos.length === 0 ? (
                      <div className="empty-col-state">
                        <FileText size={28} className="empty-col-icon" />
                        <p className="empty-col-text">Sin pedidos aquí</p>
                      </div>
                    ) : (
                      colPedidos.map(pedido => {
                        const saldoRestante = pedido.importe - pedido.seña;
                        const formatPhone = pedido.telefono.replace(/\D/g, '');
                        const hasWsp = formatPhone.length > 5;

                        return (
                          <div 
                            key={pedido.id} 
                            className="kanban-card"
                            draggable
                            onDragStart={(e) => handleDragStart(e, pedido.id)}
                          >
                            <div className="card-header">
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                                  <span style={{ 
                                    fontSize: '0.75rem', 
                                    fontWeight: 800, 
                                    backgroundColor: '#ecfdf5', 
                                    color: '#047857', 
                                    padding: '0.15rem 0.45rem', 
                                    borderRadius: '6px',
                                    border: '1px solid #a7f3d0',
                                    letterSpacing: '0.02em'
                                  }}>
                                    {formatPedidoId(pedido.id)}
                                  </span>
                                  <h4 className="card-client" style={{ margin: 0 }}>{pedido.cliente}</h4>
                                </div>
                                <span className="card-date">{pedido.fecha}</span>
                              </div>
                            </div>

                            {pedido.telefono && (
                              <div className="card-phone-row">
                                <Phone size={12} />
                                <a href={`tel:${pedido.telefono}`} className="phone-link">
                                  {pedido.telefono}
                                </a>
                              </div>
                            )}

                            {/* Print Badges */}
                            <div className="card-badges">
                              <span className={`badge ${pedido.color === 'Color' ? 'badge-color' : 'badge-byn'}`}>
                                {pedido.color}
                              </span>
                              <span className={`badge ${pedido.caras === 'Simple' ? 'badge-simple' : 'badge-doble'}`}>
                                {pedido.caras === 'Simple' ? 'Simple Faz' : 'Doble Faz'}
                              </span>
                              <span className={`badge ${pedido.distribucion === 'Normal' ? 'badge-normal' : 'badge-apaisada'}`}>
                                {pedido.distribucion === 'Normal' ? 'Normal' : 'Apaisada 2p/h'}
                              </span>
                              {pedido.anillado && (
                                <span className="badge badge-anillado">
                                  Anillado
                                </span>
                              )}
                            </div>

                            {/* Notes */}
                            {pedido.notas ? (
                              <div className="card-notes">{pedido.notas}</div>
                            ) : null}

                            {/* Files / Links */}
                            {pedido.archivos && pedido.archivos.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.15rem' }}>
                                {pedido.archivos.map((file, idx) => {
                                  const isExternal = file.url.startsWith('http://') || file.url.startsWith('https://');
                                  return (
                                    <a 
                                      key={idx}
                                      href={isExternal ? file.url : '#'} 
                                      target={isExternal ? "_blank" : undefined}
                                      rel={isExternal ? "noreferrer" : undefined}
                                      className="badge badge-normal"
                                      style={{ textDecoration: 'none', cursor: isExternal ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#ecfdf5', color: '#065f46', borderColor: 'rgba(16, 185, 129, 0.2)' }}
                                      title={file.url}
                                      onClick={(e) => {
                                        if (!isExternal) {
                                          e.preventDefault();
                                          alert(`Ruta del archivo local: ${file.url} \n(Copiado al portapapeles)`);
                                          navigator.clipboard.writeText(file.url);
                                        }
                                      }}
                                    >
                                      <Paperclip size={10} />
                                      <span>{file.nombre}</span>
                                    </a>
                                  );
                                })}
                              </div>
                            )}

                            {/* Pricing / Financials */}
                            <div className="card-financials">
                              <div className="fin-item">
                                <span className="fin-label">Seña</span>
                                <span className="fin-val">${pedido.seña}</span>
                              </div>
                              <div className="fin-item">
                                <span className="fin-label">Total</span>
                                <span className="fin-val">${pedido.importe}</span>
                              </div>
                              <div className="fin-item">
                                <span className="fin-label">Saldo</span>
                                <span className={`fin-val ${saldoRestante <= 0 ? 'saldo-ok' : 'saldo-debt'}`}>
                                  ${saldoRestante}
                                </span>
                              </div>
                            </div>

                            {/* Footer Controls */}
                            <div className="card-footer">
                              {/* Column move buttons */}
                              <div className="col-movement-btns">
                                <button 
                                  className="btn-card-action"
                                  title="Mover a la columna anterior"
                                  onClick={() => movePedido(pedido.id, 'prev')}
                                  disabled={pedido.estado === 'Nuevo'}
                                  style={{ opacity: pedido.estado === 'Nuevo' ? 0.3 : 1 }}
                                >
                                  <ChevronLeft size={14} />
                                </button>
                                <button 
                                  className="btn-card-action"
                                  title={pedido.estado === 'Cliente Avisado' ? "Entregar y Archivar" : "Mover a la siguiente columna"}
                                  onClick={() => movePedido(pedido.id, 'next')}
                                  style={{ 
                                    backgroundColor: pedido.estado === 'Cliente Avisado' ? 'var(--primary-light)' : 'var(--bg-card)',
                                    color: pedido.estado === 'Cliente Avisado' ? 'var(--primary-dark)' : 'var(--text-muted)',
                                    borderColor: pedido.estado === 'Cliente Avisado' ? 'var(--primary)' : 'var(--border-color)',
                                  }}
                                >
                                  {pedido.estado === 'Cliente Avisado' ? <CheckCircle size={14} /> : <ChevronRight size={14} />}
                                </button>
                              </div>

                              {/* Quick Actions */}
                              <div className="card-control-btns">
                                {hasWsp && (
                                  <>
                                    <button 
                                      type="button"
                                      className="btn-card-action wsp" 
                                      title="Copiar teléfono (ideal para pegar en WhatsApp Web sin abrir pestañas extras)"
                                      onClick={() => {
                                        navigator.clipboard.writeText(formatPhone);
                                        showToast(`Teléfono ${formatPhone} copiado. Pégalo en tu WhatsApp Web (Ctrl+V)`);
                                      }}
                                      style={{ backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
                                    >
                                      <MessageCircle size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-card-action"
                                      title="Copiar mensaje de aviso listo para enviar"
                                      onClick={() => {
                                        const msg = `Hola ${pedido.cliente}, tu pedido de impresión en Nexus está listo. Saldo pendiente: $${saldoRestante}.`;
                                        navigator.clipboard.writeText(msg);
                                        showToast(`Aviso para ${pedido.cliente} copiado al portapapeles`);
                                      }}
                                      style={{ fontSize: '0.7rem', color: '#0284c7', borderColor: '#bae6fd', backgroundColor: '#f0f9ff' }}
                                    >
                                      Copiar Aviso
                                    </button>
                                  </>
                                )}
                                <button 
                                  className="btn-card-action edit" 
                                  title="Editar pedido"
                                  onClick={() => handleOpenEditModal(pedido)}
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button 
                                  className="btn-card-action delete" 
                                  title="Eliminar pedido"
                                  onClick={() => handleDeletePedido(pedido.id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </main>
        </>
      ) : (
        /* HISTORIAL TAB VIEW */
        <div style={{ maxWidth: '1600px', width: '100%', margin: '0 auto', padding: '1.5rem 2rem' }}>
          {/* History Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="metric-card">
              <div className="metric-icon green" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                <FileCheck size={22} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Pedidos Entregados (Histórico)</span>
                <span className="metric-value">{totalDeliveredCount}</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon green" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                <DollarSign size={22} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Caja Histórica (Cobrado)</span>
                <span className="metric-value">${totalRevenueDelivered.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>

          {/* Search bar for history */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="search-container" style={{ maxWidth: '400px' }}>
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Buscar entregados..." 
                className="search-input"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
          </div>

          {/* History Table */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            overflowX: 'auto'
          }}>
            {filteredHistoryPedidos.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Archive size={40} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
                <p style={{ fontWeight: 600, fontSize: '1rem' }}>No hay pedidos entregados en el historial</p>
                <p style={{ fontSize: '0.875rem' }}>Los pedidos se archivarán cuando los marques como Entregados en el tablero.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cliente</th>
                    <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Teléfono</th>
                    <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Impresión</th>
                    <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Importe Total</th>
                    <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Notas</th>
                    <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Archivos</th>
                    <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistoryPedidos.map(pedido => (
                    <tr key={pedido.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color var(--transition-fast)' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 800, 
                            backgroundColor: '#f1f5f9', 
                            color: '#475569', 
                            padding: '0.1rem 0.35rem', 
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1'
                          }}>
                            {formatPedidoId(pedido.id)}
                          </span>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{pedido.cliente}</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Entregado: {pedido.fecha}</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {pedido.telefono ? (
                          <a href={`tel:${pedido.telefono}`} className="phone-link" style={{ fontSize: '0.85rem' }}>
                            {pedido.telefono}
                          </a>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          <span className={`badge ${pedido.color === 'Color' ? 'badge-color' : 'badge-byn'}`} style={{ fontSize: '0.65rem' }}>{pedido.color}</span>
                          <span className={`badge ${pedido.caras === 'Simple' ? 'badge-simple' : 'badge-doble'}`} style={{ fontSize: '0.65rem' }}>{pedido.caras === 'Simple' ? 'Simple' : 'Doble'}</span>
                          {pedido.anillado && <span className="badge badge-anillado" style={{ fontSize: '0.65rem' }}>Anillado</span>}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '0.95rem' }}>
                        ${pedido.importe}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: '#475569', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={pedido.notas}>
                        {pedido.notas || '-'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {pedido.archivos && pedido.archivos.length > 0 ? (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {pedido.archivos.map((file, idx) => {
                              const isExternal = file.url.startsWith('http://') || file.url.startsWith('https://');
                              return (
                                <a 
                                  key={idx}
                                  href={isExternal ? file.url : '#'}
                                  target={isExternal ? "_blank" : undefined}
                                  rel={isExternal ? "noreferrer" : undefined}
                                  title={file.url}
                                  style={{ color: 'var(--primary)', cursor: 'pointer' }}
                                  onClick={(e) => {
                                    if (!isExternal) {
                                      e.preventDefault();
                                      navigator.clipboard.writeText(file.url);
                                      alert(`Copiado: ${file.url}`);
                                    }
                                  }}
                                >
                                  <Paperclip size={14} />
                                </a>
                              );
                            })}
                          </div>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button 
                            className="btn-card-action edit"
                            title="Reabrir pedido (devolver a tablero)"
                            onClick={() => handleReopenPedido(pedido.id)}
                            style={{ width: '32px', height: '32px', color: 'var(--primary)' }}
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button 
                            className="btn-card-action edit"
                            title="Editar"
                            onClick={() => handleOpenEditModal(pedido)}
                            style={{ width: '32px', height: '32px' }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            className="btn-card-action delete"
                            title="Eliminar permanentemente"
                            onClick={() => handleDeletePedido(pedido.id)}
                            style={{ width: '32px', height: '32px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingPedido ? `Editar Pedido ${formatPedidoId(editingPedido.id)}` : 'Nuevo Pedido'}
              </h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePedido}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Cliente *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="Nombre del cliente"
                    value={formCliente}
                    onChange={(e) => setFormCliente(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder="Ej: 5493512345678 (incluye código de país/área)"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                  />
                </div>

                <div className="form-group-grid">
                  <div className="form-group">
                    <label className="form-label">Color de Impresión</label>
                    <div className="choices-row">
                      <button
                        type="button"
                        className={`choice-btn ${formColor === 'ByN' ? 'active' : ''}`}
                        onClick={() => setFormColor('ByN')}
                      >
                        Blanco y Negro
                      </button>
                      <button
                        type="button"
                        className={`choice-btn ${formColor === 'Color' ? 'active' : ''}`}
                        onClick={() => setFormColor('Color')}
                      >
                        Color
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Acabado Anillado</label>
                    <div className="choices-row">
                      <button
                        type="button"
                        className={`choice-btn ${!formAnillado ? 'active' : ''}`}
                        onClick={() => setFormAnillado(false)}
                      >
                        Sin Anillar
                      </button>
                      <button
                        type="button"
                        className={`choice-btn ${formAnillado ? 'active' : ''}`}
                        onClick={() => setFormAnillado(true)}
                      >
                        Anillado
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Caras / Faz</label>
                    <div className="choices-row">
                      <button
                        type="button"
                        className={`choice-btn ${formCaras === 'Simple' ? 'active' : ''}`}
                        onClick={() => setFormCaras('Simple')}
                      >
                        Simple Faz
                      </button>
                      <button
                        type="button"
                        className={`choice-btn ${formCaras === 'Doble' ? 'active' : ''}`}
                        onClick={() => setFormCaras('Doble')}
                      >
                        Doble Faz
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Distribución</label>
                    <div className="choices-row">
                      <button
                        type="button"
                        className={`choice-btn ${formDistribucion === 'Normal' ? 'active' : ''}`}
                        onClick={() => setFormDistribucion('Normal')}
                      >
                        Normal
                      </button>
                      <button
                        type="button"
                        className={`choice-btn ${formDistribucion === 'Apaisada' ? 'active' : ''}`}
                        onClick={() => setFormDistribucion('Apaisada')}
                      >
                        Apaisada (2 p/h)
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Seña Entregada ($)</label>
                    <input 
                      type="number" 
                      min="0"
                      step="any"
                      className="form-input" 
                      placeholder="0"
                      value={formSeña}
                      onChange={(e) => setFormSeña(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Importe Total ($)</label>
                    <input 
                      type="number" 
                      min="0"
                      step="any"
                      className="form-input" 
                      placeholder="0"
                      value={formImporte}
                      onChange={(e) => setFormImporte(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select 
                    className="form-select"
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value as Pedido['estado'])}
                  >
                    {COLUMNS.map(col => (
                      <option key={col.key} value={col.key}>{col.label}</option>
                    ))}
                    <option value="Entregado">Entregado / Archivado</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Notas / Instrucciones</label>
                  <textarea 
                    className="form-textarea" 
                    placeholder="Detalles sobre hojas, papel, encuadernación especial..."
                    value={formNotas}
                    onChange={(e) => setFormNotas(e.target.value)}
                  />
                </div>

                {/* Attachments Section */}
                <div className="form-group full-width" style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <label className="form-label">Archivos / Enlaces Adjuntos</label>
                  
                  {formArchivos.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                      {formArchivos.map((file, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <LinkIcon size={12} style={{ color: 'var(--primary)' }} /> {file.nombre} 
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>({file.url})</span>
                          </span>
                          <button 
                            type="button" 
                            className="btn-card-action delete" 
                            style={{ width: '22px', height: '22px' }} 
                            onClick={async () => {
                              if (editingPedido && (file as any).id) {
                                try {
                                  await apiEliminarArchivo((file as any).id);
                                  setFormArchivos(prev => prev.filter((_, i) => i !== idx));
                                  setPedidos(prev => prev.map(p =>
                                    p.id === editingPedido.id
                                      ? { ...p, archivos: (p.archivos || []).filter((_, i) => i !== idx) }
                                      : p
                                  ));
                                } catch {
                                  alert('Error al eliminar el archivo.');
                                }
                              } else {
                                setFormArchivos(prev => prev.filter((_, i) => i !== idx));
                              }
                            }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>Etiqueta</span>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Ej: Archivo PDF, Drive..." 
                        value={newArchivoNombre}
                        onChange={(e) => setNewArchivoNombre(e.target.value)}
                        style={{ padding: '0.5rem' }}
                      />
                    </div>
                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>URL o Ruta del Archivo</span>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Ej: https://... o C:\Impresiones\file.pdf" 
                        value={newArchivoUrl}
                        onChange={(e) => setNewArchivoUrl(e.target.value)}
                        style={{ padding: '0.5rem' }}
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '0.5rem 0.75rem' }}
                      onClick={async () => {
                        if (!newArchivoNombre.trim() || !newArchivoUrl.trim()) {
                          alert('Ingresá una etiqueta y la URL/Ruta');
                          return;
                        }
                        if (editingPedido) {
                          // Si estamos editando, guardamos directo en la API
                          try {
                            const adjunto = await apiAgregarArchivo(
                              editingPedido.id,
                              newArchivoNombre.trim(),
                              newArchivoUrl.trim()
                            );
                            setFormArchivos(prev => [...prev, adjunto]);
                            // Actualizar también el estado global
                            setPedidos(prev => prev.map(p =>
                              p.id === editingPedido.id
                                ? { ...p, archivos: [...(p.archivos || []), adjunto] }
                                : p
                            ));
                          } catch {
                            alert('Error al guardar el archivo.');
                          }
                        } else {
                          // Si es nuevo pedido, lo guardamos en el estado local hasta que se cree
                          setFormArchivos(prev => [...prev, { nombre: newArchivoNombre.trim(), url: newArchivoUrl.trim() }]);
                        }
                        setNewArchivoNombre('');
                        setNewArchivoUrl('');
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPedido ? 'Guardar Cambios' : 'Crear Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.9rem',
          fontWeight: 600,
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <CheckCircle size={18} style={{ color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Nexus CRM. Todos los derechos reservados. Desarrollado con tecnología moderna.</p>
      </footer>
    </div>
  );
}
