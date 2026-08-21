"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect, useRef } from 'react';
import { Home, RotateCcw, AlertTriangle, ChevronDown, Search, Check } from 'lucide-react';
import Image from 'next/image';

interface Approver {
  id: string;
  name: string;
  email: string;
}

interface Proveedor {
  id: string;
  nit: string;
  nombre: string;
}

function AnticiposForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tipo = searchParams.get('tipo');

  // Determinar el título basado en el tipo
  const getTitulo = () => {
    switch (tipo) {
      case 'gastos_viaje': return 'Gastos Viaje';
      case 'proveedor': return 'Proveedor';
      case 'proyecto': return 'Proyecto';
      case 'cefi': return 'CEFI';
      case 'viventta': return 'Viventta';
      default: return '';
    }
  };

  const isProveedorRequired = tipo === 'proveedor' || tipo === 'proyecto' || tipo === 'cefi' || tipo === 'viventta';

  const [formData, setFormData] = useState({
    titulo: '',
    concepto: '',
    valor: '',
    observaciones: ''
  });

  const [showErrors, setShowErrors] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // --- Usuarios y Comboboxes ---
  const [users, setUsers] = useState<Approver[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [aprobadorOpen, setAprobadorOpen] = useState(false);
  const [aprobadorSearch, setAprobadorSearch] = useState('');
  const [selectedAprobadorId, setSelectedAprobadorId] = useState<string>('');
  const aprobadorRef = useRef<HTMLDivElement>(null);

  const [solicitanteOpen, setSolicitanteOpen] = useState(false);
  const [solicitanteSearch, setSolicitanteSearch] = useState('');
  const [selectedSolicitanteId, setSelectedSolicitanteId] = useState<string>('');
  const solicitanteRef = useRef<HTMLDivElement>(null);

  // --- Proveedores ---
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [proveedorOpen, setProveedorOpen] = useState(false);
  const [proveedorSearch, setProveedorSearch] = useState('');
  const [selectedProveedorId, setSelectedProveedorId] = useState<string>('');
  const proveedorRef = useRef<HTMLDivElement>(null);

  // Debounce para búsqueda de proveedores
  useEffect(() => {
    if (!isProveedorRequired) return;
    
    const fetchProveedores = async () => {
      setLoadingProveedores(true);
      try {
        const res = await fetch(`/api/proveedores?search=${encodeURIComponent(proveedorSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setProveedores(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProveedores(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchProveedores();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [proveedorSearch, isProveedorRequired]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users?all=true');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aprobadorRef.current && !aprobadorRef.current.contains(event.target as Node)) {
        setAprobadorOpen(false);
      }
      if (solicitanteRef.current && !solicitanteRef.current.contains(event.target as Node)) {
        setSolicitanteOpen(false);
      }
      if (proveedorRef.current && !proveedorRef.current.contains(event.target as Node)) {
        setProveedorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAprobadores = users.filter((u) =>
    u.name.toLowerCase().includes(aprobadorSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(aprobadorSearch.toLowerCase())
  );

  const filteredSolicitantes = users.filter((u) =>
    u.name.toLowerCase().includes(solicitanteSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(solicitanteSearch.toLowerCase())
  );

  const selectedAprobador = users.find(u => u.id === selectedAprobadorId);
  const selectedSolicitante = users.find(u => u.id === selectedSolicitanteId);
  const selectedProveedor = proveedores.find(p => p.id === selectedProveedorId);
  // ------------------------------

  const handleReset = () => {
    setFormData({
      titulo: '',
      concepto: '',
      valor: '',
      observaciones: ''
    });
    setSelectedAprobadorId('');
    setSelectedSolicitanteId('');
    setSelectedProveedorId('');
    setShowErrors(false);
    setSuccessMessage('');
  };

  const isFormValid = () => {
    const isBasicValid = formData.titulo && formData.concepto && formData.valor && selectedAprobadorId && selectedSolicitanteId;
    if (isProveedorRequired) {
      return isBasicValid && selectedProveedorId;
    }
    return isBasicValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      setShowErrors(true);
      return;
    }
    
    setIsSubmitting(true);
    setSuccessMessage('');
    
    try {
      const payload = {
        titulo: formData.titulo,
        concepto: formData.concepto,
        valor: formData.valor,
        observaciones: formData.observaciones,
        tipo: tipo || 'general',
        solicitanteId: selectedSolicitanteId,
        solicitanteNombre: selectedSolicitante?.name,
        solicitanteEmail: selectedSolicitante?.email,
        aprobadorId: selectedAprobadorId,
        aprobadorNombre: selectedAprobador?.name,
        aprobadorEmail: selectedAprobador?.email,
        nitProveedor: isProveedorRequired ? selectedProveedor?.nit : undefined,
        nombreProveedor: isProveedorRequired ? selectedProveedor?.nombre : undefined
      };

      const res = await fetch('/api/anticipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Error al enviar el formulario a SharePoint');
      }

      setSuccessMessage('¡Solicitud enviada y guardada correctamente!');
      
      // Limpiar formulario después de enviar
      setFormData({
        titulo: '',
        concepto: '',
        valor: '',
        observaciones: ''
      });
      setSelectedAprobadorId('');
      setSelectedSolicitanteId('');
      setSelectedProveedorId('');
      setShowErrors(false);

    } catch (error) {
      console.error(error);
      alert('Hubo un error al guardar la solicitud. Por favor, intenta de nuevo o revisa la consola.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCombobox = (
    label: string,
    selectedUser: Approver | undefined,
    isOpen: boolean,
    setIsOpen: (v: boolean) => void,
    search: string,
    setSearch: (v: string) => void,
    filteredUsers: Approver[],
    selectedId: string,
    setSelectedId: (v: string) => void,
    ref: React.RefObject<HTMLDivElement | null>
  ) => (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-semibold text-[#3b5998] mb-1">
        <span className="text-red-500 mr-1">*</span>{label}
      </label>
      <div 
        className={`w-full border border-slate-300 p-2.5 flex items-center justify-between cursor-pointer rounded-md bg-white hover:border-[#3b5998] transition-colors ${loadingUsers ? 'opacity-70 cursor-not-allowed' : ''}`}
        onClick={() => !loadingUsers && setIsOpen(!isOpen)}
      >
        {selectedUser ? (
          <div className="flex items-center gap-3">
            <span className="truncate text-base text-slate-800 font-medium">{selectedUser.name}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-base">
            {loadingUsers ? 'Cargando usuarios...' : 'Buscar elementos'}
          </span>
        )}
        <ChevronDown size={20} className={`text-[#3b5998] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-xl max-h-60 overflow-y-auto">
          <div className="sticky top-0 bg-[#476097] border-b border-slate-200 p-2.5 flex items-center gap-2 z-20 text-white">
            <input
              type="text"
              placeholder="Buscar elementos..."
              className="w-full focus:outline-none text-sm text-white bg-[#476097] placeholder-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          
          <div className="p-0 relative z-10">
            {filteredUsers.length === 0 ? (
              <div className="p-3 text-sm text-slate-500 text-center">No se encontraron resultados</div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className={`flex items-center gap-3 p-3 hover:bg-slate-100 cursor-pointer border-b border-slate-50 last:border-0 ${selectedId === u.id ? 'bg-slate-50' : ''}`}
                  onClick={() => {
                    setSelectedId(u.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={`text-base ${selectedId === u.id ? 'font-bold text-[#3b5998]' : 'text-slate-700 font-medium'} truncate`}>{u.name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderProveedorCombobox = () => (
    <div className="relative" ref={proveedorRef}>
      <label className="block text-sm font-semibold text-[#3b5998] mb-1">
        <span className="text-red-500 mr-1">*</span>NIT Proveedor
      </label>
      <div 
        className={`w-full border border-slate-300 p-2.5 flex items-center justify-between cursor-pointer rounded-md bg-white hover:border-[#3b5998] transition-colors`}
        onClick={() => setProveedorOpen(!proveedorOpen)}
      >
        {selectedProveedor ? (
          <div className="flex flex-col">
            <span className="truncate text-base text-slate-800 font-bold">{selectedProveedor.nombre}</span>
            <span className="truncate text-sm text-slate-500 font-medium">{selectedProveedor.nit}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-base">
            Buscar elementos
          </span>
        )}
        <ChevronDown size={20} className={`text-[#3b5998] transition-transform ${proveedorOpen ? 'rotate-180' : ''}`} />
      </div>

      {proveedorOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-xl max-h-60 overflow-y-auto">
          <div className="sticky top-0 bg-[#476097] border-b border-slate-200 p-2.5 flex items-center gap-2 z-20 text-white">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por Nombre o NIT..."
              className="w-full focus:outline-none text-sm text-white bg-[#476097] placeholder-slate-200"
              value={proveedorSearch}
              onChange={(e) => setProveedorSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          
          <div className="p-0 relative z-10">
            {loadingProveedores ? (
              <div className="p-3 text-sm text-slate-500 text-center">Buscando...</div>
            ) : proveedores.length === 0 ? (
              <div className="p-3 text-sm text-slate-500 text-center">No se encontraron resultados</div>
            ) : (
              proveedores.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 p-3 hover:bg-slate-100 cursor-pointer border-b border-slate-50 last:border-0 ${selectedProveedorId === p.id ? 'bg-slate-50' : ''}`}
                  onClick={() => {
                    setSelectedProveedorId(p.id);
                    setProveedorOpen(false);
                    setProveedorSearch('');
                  }}
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={`text-base ${selectedProveedorId === p.id ? 'font-bold text-[#3b5998]' : 'text-slate-700 font-medium'} truncate`}>{p.nombre}</span>
                    <span className="text-sm text-slate-500 font-medium">{p.nit}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6">
      <div className="w-full max-w-lg bg-white shadow-2xl rounded-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-[#3b5998] text-white px-5 py-4 flex items-center justify-between">
          <h1 className="font-semibold text-xl tracking-wide">Anticipos {getTitulo()}</h1>
          <div className="flex items-center gap-4">
            <button type="button" onClick={handleReset} className="hover:bg-white/20 p-1.5 rounded-full transition-colors" title="Limpiar">
              <RotateCcw size={22} />
            </button>
            <button type="button" onClick={() => router.push('/')} className="hover:bg-white/20 p-1.5 rounded-full transition-colors" title="Inicio">
              <Home size={22} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-7 flex flex-col gap-5">
          
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md flex items-center gap-2">
              <Check size={20} className="text-green-500 shrink-0" />
              <span className="font-medium text-sm">{successMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#3b5998] mb-1">
              <span className="text-red-500 mr-1">*</span>Título
            </label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-md px-4 py-2.5 text-base text-slate-800 focus:outline-none focus:border-[#3b5998] focus:ring-1 focus:ring-[#3b5998] transition-colors"
              value={formData.titulo}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#3b5998] mb-1">
              <span className="text-red-500 mr-1">*</span>Concepto
            </label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-md px-4 py-2.5 text-base text-slate-800 focus:outline-none focus:border-[#3b5998] focus:ring-1 focus:ring-[#3b5998] transition-colors"
              value={formData.concepto}
              onChange={(e) => setFormData({...formData, concepto: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#3b5998] mb-1">
              <span className="text-red-500 mr-1">*</span>Valor
            </label>
            <input
              type="number"
              className="w-full border border-slate-300 rounded-md px-4 py-2.5 text-base text-slate-800 focus:outline-none focus:border-[#3b5998] focus:ring-1 focus:ring-[#3b5998] transition-colors"
              value={formData.valor}
              onChange={(e) => setFormData({...formData, valor: e.target.value})}
            />
          </div>

          {isProveedorRequired && renderProveedorCombobox()}

          {renderCombobox('Solicitante', selectedSolicitante, solicitanteOpen, setSolicitanteOpen, solicitanteSearch, setSolicitanteSearch, filteredSolicitantes, selectedSolicitanteId, setSelectedSolicitanteId, solicitanteRef)}
          
          {renderCombobox('Aprobador', selectedAprobador, aprobadorOpen, setAprobadorOpen, aprobadorSearch, setAprobadorSearch, filteredAprobadores, selectedAprobadorId, setSelectedAprobadorId, aprobadorRef)}

          <div>
            <label className="block text-sm font-semibold text-[#3b5998] mb-1">
              Observaciones
            </label>
            <textarea
              rows={3}
              className="w-full border border-slate-300 rounded-md px-4 py-2.5 text-base text-slate-800 focus:outline-none focus:border-[#3b5998] focus:ring-1 focus:ring-[#3b5998] resize-none transition-colors"
              value={formData.observaciones}
              onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
            />
          </div>

          {/* Legal Warning */}
          <div className="flex items-start gap-4 mt-2 border-t pt-5 border-slate-200">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={32} />
            <p className="text-[13px] text-slate-800 leading-snug font-medium">
              Al realizar esta solicitud autorizo a Firplak S.A., me deduzca de nómina los valores no legalizados dentro del tiempo fijado en las políticas de los gastos de viaje.
            </p>
          </div>

          {/* Validation Warning */}
          {showErrors && !isFormValid() && (
            <div className="bg-red-600 text-white p-4 rounded-md flex items-start gap-3 mt-3 shadow-md">
              <AlertTriangle className="text-yellow-300 shrink-0 mt-0.5" size={24} />
              <p className="text-sm font-medium leading-tight">
                Por Favor ingrese Titulo, Concepto, Valor, Solicitante, Aprobador{isProveedorRequired && ' y Proveedor'} para continuar.
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
             <button type="submit" disabled={isSubmitting} className={`bg-[#3b5998] hover:bg-[#2d4373] text-white px-8 py-3 rounded-md shadow-md font-semibold tracking-wide transition-colors flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
               {isSubmitting ? (
                 <>
                   <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Enviando...
                 </>
               ) : (
                 'Enviar Solicitud'
               )}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default function AnticiposPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando formulario...</div>}>
      <AnticiposForm />
    </Suspense>
  );
}
