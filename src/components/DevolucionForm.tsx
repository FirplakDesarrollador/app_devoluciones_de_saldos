'use client';

import { Paperclip, Search, ChevronDown, Check, CheckCircle2, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface Approver {
  id: string;
  name: string;
  email: string;
}

export default function DevolucionForm({ empresa }: { empresa: string }) {
  const [tipoPersona, setTipoPersona] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Specific file states for each document
  const [fileCedula, setFileCedula] = useState<File | null>(null);
  const [fileCertificacion, setFileCertificacion] = useState<File | null>(null);
  const [fileSoporte, setFileSoporte] = useState<File | null>(null);
  const [fileCarta, setFileCarta] = useState<File | null>(null);
  
  // Combobox state
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [loadingApprovers, setLoadingApprovers] = useState(true);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApproverId, setSelectedApproverId] = useState<string>('');
  
  const comboboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setApprovers(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingApprovers(false);
      }
    };
    fetchApprovers();
  }, []);

  // Close combobox when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setComboboxOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredApprovers = approvers.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedApprover = approvers.find(a => a.id === selectedApproverId);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    const formElement = e.currentTarget;

    try {
      const formData = new FormData(formElement);
      
      // Add files manually if they exist
      if (fileCedula) formData.set('archivo_cedula', fileCedula);
      if (fileCertificacion) formData.set('archivo_certificacion', fileCertificacion);
      if (fileSoporte) formData.set('archivo_soporte', fileSoporte);
      if (fileCarta) formData.set('archivo_carta', fileCarta);

      const response = await fetch('/api/devoluciones', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al enviar formulario');
      }

      setSuccessMessage('¡Solicitud enviada correctamente!');
      
      // Reset form
      formElement.reset();
      setTipoPersona('');
      setSelectedApproverId('');
      setFileCedula(null);
      setFileCertificacion(null);
      setFileSoporte(null);
      setFileCarta(null);

    } catch (error) {
      console.error(error);
      alert('Hubo un error enviando la solicitud. Revisa la consola para más detalles.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFileBox = (
    title: string,
    id: string,
    fileObj: File | null,
    setFileObj: (file: File | null) => void
  ) => (
    <div className={`border p-4 rounded-sm flex flex-col justify-between bg-white relative transition-colors ${fileObj ? 'border-green-500 bg-green-50/30' : 'border-blue-900'}`}>
      <p className="text-sm font-semibold text-slate-800 mb-3">{title}</p>
      
      {fileObj ? (
        <div className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-md shadow-sm">
          <div className="flex items-center gap-2 overflow-hidden">
            <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
            <span className="text-xs text-slate-700 truncate font-medium" title={fileObj.name}>{fileObj.name}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFileObj(null)}
            className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
            title="Eliminar archivo"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div>
          <p className="text-slate-500 text-xs mb-3">Sin adjuntar</p>
          <input 
            type="file" 
            id={id}
            name={id}
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setFileObj(file);
              e.target.value = '';
            }} 
          />
          <label htmlFor={id} className="inline-flex items-center gap-2 cursor-pointer text-slate-800 hover:text-blue-700 transition-colors text-sm font-medium bg-slate-50 px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-100">
            <Paperclip size={16} /> <span>Adjuntar archivo</span>
          </label>
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-5 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      
      {/* Hidden field para la compañía */}
      <input type="hidden" name="empresa" value={empresa} />

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-4 flex items-center gap-2">
          <CheckCircle2 size={20} />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="nombreCliente" className="block text-blue-900 font-medium text-sm">
          Nombre del Cliente
        </label>
        <input
          type="text"
          id="nombreCliente"
          name="nombreCliente"
          required
          className="w-full border border-blue-900 p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="concepto" className="block text-blue-900 font-medium text-sm">
          Concepto
        </label>
        <input
          type="text"
          id="concepto"
          name="concepto"
          value="devolucion saldo a favor"
          readOnly
          className="w-full border border-blue-900 p-2 text-slate-600 bg-slate-50 focus:outline-none rounded-sm cursor-not-allowed"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="valor" className="block text-blue-900 font-medium text-sm">
          Valor
        </label>
        <input
          type="text"
          id="valor"
          name="valor"
          required
          className="w-full border border-blue-900 p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="nitCliente" className="block text-blue-900 font-medium text-sm">
          Nit o Cédula Cliente
        </label>
        <input
          type="text"
          id="nitCliente"
          name="nitCliente"
          required
          className="w-full border border-blue-900 p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm"
        />
      </div>

      {/* Aprobador con Combobox */}
      <div className="space-y-1 relative" ref={comboboxRef}>
        <label className="block text-blue-900 font-medium text-sm">
          Aprobador
        </label>
        
        {/* Input oculto para que el formulario lo envíe */}
        <input type="hidden" name="aprobador" value={selectedApproverId} required />
        <input type="hidden" name="aprobadorEmail" value={selectedApprover?.email || ''} />
        <input type="hidden" name="aprobadorNombre" value={selectedApprover?.name || ''} />
        
        <div 
          className={`w-full border border-blue-900 p-2 text-slate-800 flex items-center justify-between cursor-pointer rounded-sm bg-white ${loadingApprovers ? 'opacity-70 cursor-not-allowed' : ''}`}
          onClick={() => !loadingApprovers && setComboboxOpen(!comboboxOpen)}
        >
          {selectedApprover ? (
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-500 relative">
                <span className="absolute">{selectedApprover.name.charAt(0)}</span>
                <Image
                  src={`/api/users/${selectedApprover.id}/photo`}
                  alt={selectedApprover.name}
                  fill
                  sizes="24px"
                  className="object-cover relative z-10"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <span className="truncate">{selectedApprover.name}</span>
            </div>
          ) : (
            <span className="text-slate-500">
              {loadingApprovers ? 'Cargando aprobadores...' : 'Seleccione un aprobador'}
            </span>
          )}
          <ChevronDown size={16} className={`text-slate-500 transition-transform ${comboboxOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* Dropdown menu */}
        {comboboxOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-2 flex items-center gap-2 z-20">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Buscar aprobador..."
                className="w-full focus:outline-none text-sm text-slate-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            
            <div className="p-1 relative z-10">
              {filteredApprovers.length === 0 ? (
                <div className="p-3 text-sm text-slate-500 text-center">No se encontraron resultados</div>
              ) : (
                filteredApprovers.map((a) => (
                  <div
                    key={a.id}
                    className={`flex items-center gap-3 p-2 hover:bg-blue-50 cursor-pointer rounded-sm ${selectedApproverId === a.id ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      setSelectedApproverId(a.id);
                      setComboboxOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 flex items-center justify-center text-sm font-bold text-slate-500 relative">
                      <span className="absolute">{a.name.charAt(0)}</span>
                      <Image
                        src={`/api/users/${a.id}/photo`}
                        alt={a.name}
                        fill
                        sizes="32px"
                        className="object-cover relative z-10"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-800 truncate">{a.name}</span>
                      {a.email && <span className="text-xs text-slate-500 truncate">{a.email}</span>}
                    </div>
                    {selectedApproverId === a.id && (
                      <Check size={16} className="text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="observaciones" className="block text-blue-900 font-medium text-sm">
          Observaciones
        </label>
        <input
          type="text"
          id="observaciones"
          name="observaciones"
          className="w-full border border-blue-900 p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm"
        />
      </div>

      {/* Tipo de Persona */}
      <div className="space-y-1 pt-2">
        <label htmlFor="tipoPersona" className="block text-blue-900 font-medium text-sm">
          Tipo de Persona
        </label>
        <select
          id="tipoPersona"
          name="tipoPersona"
          required
          className="w-full border border-blue-900 p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm bg-white"
          value={tipoPersona}
          onChange={(e) => {
            setTipoPersona(e.target.value);
            setFileCedula(null);
            setFileCertificacion(null);
            setFileSoporte(null);
            setFileCarta(null);
          }}
        >
          <option value="">Seleccione...</option>
          <option value="juridica">Persona jurídica</option>
          <option value="natural">Persona natural</option>
        </select>
      </div>

      {/* Documentos Adjuntos Específicos */}
      {tipoPersona && (
        <div className="space-y-4 pt-2">
          <label className="block text-blue-900 font-medium text-sm mb-1">
            Documentos Requeridos
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderFileBox('1. Copia de la cédula', 'archivo_cedula', fileCedula, setFileCedula)}
            {renderFileBox('2. Certificación bancaria', 'archivo_certificacion', fileCertificacion, setFileCertificacion)}
            {renderFileBox('3. Soporte de pago', 'archivo_soporte', fileSoporte, setFileSoporte)}
            {renderFileBox('4. Carta de solicitud', 'archivo_carta', fileCarta, setFileCarta)}
          </div>
        </div>
      )}

      <div className="pt-6 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`bg-blue-900 text-white px-6 py-2 rounded-md hover:bg-blue-800 transition-colors font-medium shadow-sm flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
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
  );
}
