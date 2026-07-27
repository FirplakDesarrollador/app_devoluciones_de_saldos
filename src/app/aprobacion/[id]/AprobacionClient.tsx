'use client';

import { useState } from 'react';
import {
  CheckCircle2, XCircle, FileText, Clock, Building2,
  DollarSign, User, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, Download, ZoomIn
} from 'lucide-react';

interface Attachment { tipo: string; url: string; }

interface ItemData {
  id: string;
  nit: string;
  nombreCliente: string;
  valor: number;
  valorAutorizado?: number;
  empresa: string;
  observaciones: string;
  estado?: string;
  fechaDecision?: string;
  motivoRechazo?: string;
  attachments: Attachment[];
  createdAt: string;
}

const TIPO_LABELS: Record<string, string> = {
  cedula: 'Cédula',
  certificacion: 'Cert. bancaria',
  soporte: 'Soporte de pago',
  carta: 'Carta de solicitud',
};

const EMPRESA_LABELS: Record<string, string> = {
  firplak: 'Firplak',
  'firplak-home': 'Firplak Home',
  viventta: 'Viventta',
};

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota',
  });
}

function getFileType(url: string): 'image' | 'pdf' | 'other' {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '')) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
}

function DocumentPreview({ attachment }: { attachment: Attachment }) {
  const type = getFileType(attachment.url);

  if (type === 'image') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-xl overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={TIPO_LABELS[attachment.tipo] || attachment.tipo}
          className="max-w-full max-h-full object-contain"
          style={{ maxHeight: '65vh' }}
        />
      </div>
    );
  }

  if (type === 'pdf') {
    return (
      <iframe
        src={attachment.url}
        className="w-full rounded-xl border border-slate-200"
        style={{ height: '65vh' }}
        title={TIPO_LABELS[attachment.tipo] || attachment.tipo}
      />
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-xl border border-slate-200" style={{ height: '65vh' }}>
      <FileText size={48} className="text-slate-300" />
      <p className="text-slate-500 text-sm">Vista previa no disponible para este tipo de archivo</p>
      <a
        href={attachment.url}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
      >
        <Download size={16} /> Descargar archivo
      </a>
    </div>
  );
}

type ActionState = 'idle' | 'loading' | 'success' | 'error';

export default function AprobacionClient({ item }: { item: ItemData }) {
  const [activeDoc, setActiveDoc] = useState(0);
  const [showAprobar, setShowAprobar] = useState(false);
  const [showRechazar, setShowRechazar] = useState(false);
  const [razonRechazo, setRazonRechazo] = useState('');
  const [valorAutorizado, setValorAutorizado] = useState(item.valor);
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [decision, setDecision] = useState<'aprobado' | 'rechazado' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const currentDoc = item.attachments[activeDoc];

  const handleAction = async (accion: 'aprobar' | 'rechazar') => {
    setActionState('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`/api/aprobacion/${item.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion,
          razon: accion === 'rechazar' ? razonRechazo : undefined,
          valorAutorizado: accion === 'aprobar' ? Number(valorAutorizado) : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error desconocido');
      }

      setDecision(accion === 'aprobar' ? 'aprobado' : 'rechazado');
      setActionState('success');
      setShowAprobar(false);
      setShowRechazar(false);
    } catch (e: unknown) {
      setActionState('error');
      setErrorMsg(e instanceof Error ? e.message : 'Error al procesar la acción');
    }
  };

  // Determinar si ya fue procesada previamente o en esta sesión
  const isFinalized = (item.estado && item.estado !== 'pendiente') || actionState === 'success';
  const finalDecision = actionState === 'success' ? decision : (item.estado === 'Aprovado' ? 'aprobado' : 'rechazado');

  // Success / final state
  if (isFinalized && finalDecision) {
    const isApproved = finalDecision === 'aprobado';
    const finalReason = actionState === 'success' ? razonRechazo : item.motivoRechazo;
    const finalDateString = actionState === 'success' 
      ? new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota' }) 
      : item.fechaDecision;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-blue-900 text-white px-6 py-4">
          <p className="text-blue-200 text-xs font-medium uppercase tracking-widest">{EMPRESA_LABELS[item.empresa] || item.empresa}</p>
          <h1 className="text-xl font-bold">Solicitud de Devolución de Saldo</h1>
        </header>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 max-w-md w-full text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isApproved ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {isApproved
                ? <CheckCircle2 size={36} className="text-emerald-500" />
                : <XCircle size={36} className="text-red-500" />}
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${isApproved ? 'text-emerald-700' : 'text-red-700'}`}>
              Solicitud {isApproved ? 'Aprobada' : 'Rechazada'}
            </h2>
            <p className="text-slate-500 text-sm">
              {isApproved
                ? 'La solicitud de devolución ha sido aprobada.'
                : 'La solicitud ha sido rechazada.'}
            </p>
            {!isApproved && finalReason && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 text-left">
                <strong>Motivo:</strong> {finalReason}
              </div>
            )}
            {isApproved && item.valorAutorizado !== undefined && (
              <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-100 text-center">
                <strong>Valor Autorizado:</strong> {formatCOP(item.valorAutorizado)}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-4">
              ID: {item.id} · {item.nombreCliente}
              {finalDateString && <><br/>Procesado el: {finalDateString}</>}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-md flex-shrink-0">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-widest mb-0.5">
              {EMPRESA_LABELS[item.empresa] || item.empresa}
            </p>
            <h1 className="text-xl font-bold">Solicitud de Devolución de Saldo</h1>
          </div>
          <div className="flex items-center gap-2 bg-amber-400 text-amber-900 px-3 py-1.5 rounded-full text-xs font-bold">
            <Clock size={14} /> Pendiente de aprobación
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">

        {/* ───── LEFT PANEL ───── */}
        <div className="flex flex-col gap-4">

          {/* Cliente */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                <User size={14} className="text-blue-700" />
              </div>
              <span className="font-semibold text-slate-700 text-sm">Información del Cliente</span>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Nombre</p>
                <p className="text-slate-800 font-semibold">{item.nombreCliente || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">NIT / Cédula</p>
                <p className="text-slate-800 font-semibold font-mono">{item.nit || '—'}</p>
              </div>
            </div>
          </div>

          {/* Valor */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                <DollarSign size={14} className="text-emerald-600" />
              </div>
              <span className="font-semibold text-slate-700 text-sm">Valor Solicitado</span>
            </div>
            <div className="px-5 py-4">
              <p className="text-2xl font-extrabold text-emerald-600">{formatCOP(item.valor)}</p>
              <p className="text-xs text-slate-400 mt-1">Devolución de saldo a favor</p>
            </div>
          </div>

          {/* Empresa y fecha */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
                <Building2 size={14} className="text-slate-500" />
              </div>
              <span className="font-semibold text-slate-700 text-sm">Empresa</span>
            </div>
            <div className="px-5 py-4 space-y-2">
              <p className="text-slate-800 font-semibold">{EMPRESA_LABELS[item.empresa] || item.empresa || '—'}</p>
              <p className="text-xs text-slate-400">
                Creado el {item.createdAt ? formatDate(item.createdAt) : '—'}
              </p>
            </div>
          </div>

          {/* Observaciones */}
          {item.observaciones && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
                  <FileText size={14} className="text-slate-500" />
                </div>
                <span className="font-semibold text-slate-700 text-sm">Observaciones</span>
              </div>
              <div className="px-5 py-4">
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{item.observaciones}</p>
              </div>
            </div>
          )}

          {/* Error banner */}
          {actionState === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{errorMsg}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowRechazar(true)}
              disabled={actionState === 'loading'}
              className="flex items-center justify-center gap-2 bg-white border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 px-4 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <XCircle size={18} /> Rechazar
            </button>
            <button
              onClick={() => setShowAprobar(true)}
              disabled={actionState === 'loading'}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <CheckCircle2 size={18} /> Aprobar
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center">ID Solicitud: <span className="font-mono">{item.id}</span></p>
        </div>

        {/* ───── RIGHT PANEL — Document Viewer ───── */}
        <div className="flex flex-col gap-3">

          {item.attachments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 flex items-center justify-center" style={{ height: '75vh' }}>
              <div className="text-center text-slate-400">
                <FileText size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay documentos adjuntos</p>
              </div>
            </div>
          ) : (
            <>
              {/* File selector tabs */}
              <div className="flex gap-2 flex-wrap">
                {item.attachments.map((att, idx) => (
                  <button
                    key={att.tipo}
                    onClick={() => setActiveDoc(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      activeDoc === idx
                        ? 'bg-blue-900 text-white border-blue-900 shadow'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700'
                    }`}
                  >
                    <FileText size={12} />
                    {TIPO_LABELS[att.tipo] || att.tipo}
                  </button>
                ))}
              </div>

              {/* Preview area */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Preview header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-600">
                      {TIPO_LABELS[currentDoc.tipo] || currentDoc.tipo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={currentDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      title="Abrir en nueva pestaña"
                    >
                      <ZoomIn size={13} /> Abrir
                    </a>
                    <a
                      href={currentDoc.url}
                      download
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                      title="Descargar"
                    >
                      <Download size={13} /> Descargar
                    </a>
                    {/* prev/next */}
                    <div className="flex items-center gap-1 ml-2 border-l border-slate-200 pl-2">
                      <button
                        onClick={() => setActiveDoc(i => Math.max(0, i - 1))}
                        disabled={activeDoc === 0}
                        className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft size={14} className="text-slate-500" />
                      </button>
                      <span className="text-xs text-slate-400">{activeDoc + 1}/{item.attachments.length}</span>
                      <button
                        onClick={() => setActiveDoc(i => Math.min(item.attachments.length - 1, i + 1))}
                        disabled={activeDoc === item.attachments.length - 1}
                        className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight size={14} className="text-slate-500" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Document content */}
                <div className="p-3">
                  <DocumentPreview key={currentDoc.url} attachment={currentDoc} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ───── MODAL: Aprobar ───── */}
      {showAprobar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 text-center mb-2">¿Aprobar solicitud?</h2>
            <p className="text-sm text-slate-500 text-center mb-4">
              Estás a punto de aprobar la solicitud de <strong>{item.nombreCliente}</strong>.
            </p>
            
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Valor Autorizado
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input 
                  type="number"
                  value={valorAutorizado}
                  onChange={e => setValorAutorizado(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Valor original solicitado: {formatCOP(item.valor)}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAprobar(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAction('aprobar')}
                disabled={actionState === 'loading'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {actionState === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───── MODAL: Rechazar ───── */}
      {showRechazar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={28} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 text-center mb-2">¿Rechazar solicitud?</h2>
            <p className="text-sm text-slate-500 text-center mb-4">
              Indica la razón del rechazo para <strong>{item.nombreCliente}</strong>.
            </p>
            <textarea
              value={razonRechazo}
              onChange={e => setRazonRechazo(e.target.value)}
              placeholder="Motivo del rechazo (obligatorio)..."
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRechazar(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAction('rechazar')}
                disabled={actionState === 'loading' || !razonRechazo.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {actionState === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
