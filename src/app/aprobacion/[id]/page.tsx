import { Clock, FileText, User, Building2, DollarSign, Eye, AlertCircle } from 'lucide-react';

const TIPO_LABELS: Record<string, string> = {
  cedula: '1. Copia de la cédula',
  certificacion: '2. Certificación bancaria',
  soporte: '3. Soporte de pago',
  carta: '4. Carta de solicitud',
};

const EMPRESA_LABELS: Record<string, string> = {
  firplak: 'Firplak',
  'firplak-home': 'Firplak Home',
  viventta: 'Viventta',
};

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  });
}

function FileIcon({ tipo }: { tipo: string }) {
  const colors: Record<string, string> = {
    cedula: 'text-blue-600 bg-blue-50',
    certificacion: 'text-emerald-600 bg-emerald-50',
    soporte: 'text-amber-600 bg-amber-50',
    carta: 'text-purple-600 bg-purple-50',
  };
  const color = colors[tipo] || 'text-slate-600 bg-slate-50';
  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
      <FileText size={20} />
    </div>
  );
}

interface Attachment {
  tipo: string;
  url: string;
}

interface ItemData {
  id: string;
  nit: string;
  nombreCliente: string;
  valor: number;
  empresa: string;
  observaciones: string;
  attachments: Attachment[];
  createdAt: string;
  modifiedAt: string;
}

async function getItemData(id: string): Promise<ItemData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/aprobacion/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function AprobacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItemData(id);

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Solicitud no encontrada</h1>
          <p className="text-slate-500 text-sm">
            El documento con ID <code className="bg-slate-100 px-1 rounded text-xs">{id}</code> no existe o no tienes acceso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-widest mb-0.5">
              {EMPRESA_LABELS[item.empresa] || item.empresa}
            </p>
            <h1 className="text-xl font-bold">Solicitud de Devolución de Saldo</h1>
          </div>
          <div className="flex items-center gap-2 bg-amber-400 text-amber-900 px-3 py-1.5 rounded-full text-xs font-bold">
            <Clock size={14} />
            Pendiente de aprobación
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Info general */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <User size={16} className="text-blue-700" />
            </div>
            <h2 className="font-semibold text-slate-800">Información del Cliente</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="px-6 py-4">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Nombre del cliente</p>
              <p className="text-slate-800 font-semibold text-lg">{item.nombreCliente || '—'}</p>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">NIT / Cédula</p>
              <p className="text-slate-800 font-semibold text-lg">{item.nit || '—'}</p>
            </div>
          </div>
        </div>

        {/* Valor y empresa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <DollarSign size={16} className="text-emerald-600" />
              </div>
              <h2 className="font-semibold text-slate-800">Valor Solicitado</h2>
            </div>
            <div className="px-6 py-5">
              <p className="text-3xl font-extrabold text-emerald-600">{formatCOP(item.valor)}</p>
              <p className="text-xs text-slate-400 mt-1">Devolución de saldo a favor</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Building2 size={16} className="text-blue-700" />
              </div>
              <h2 className="font-semibold text-slate-800">Empresa</h2>
            </div>
            <div className="px-6 py-5">
              <p className="text-2xl font-bold text-slate-800">{EMPRESA_LABELS[item.empresa] || item.empresa || '—'}</p>
              <p className="text-xs text-slate-400 mt-1">
                Creado el {item.createdAt ? formatDate(item.createdAt) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        {item.observaciones && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                <FileText size={16} className="text-slate-500" />
              </div>
              <h2 className="font-semibold text-slate-800">Observaciones</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{item.observaciones}</p>
            </div>
          </div>
        )}

        {/* Documentos adjuntos */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <FileText size={16} className="text-purple-600" />
              </div>
              <h2 className="font-semibold text-slate-800">Documentos Adjuntos</h2>
            </div>
            <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2 py-1 rounded-full">
              {item.attachments.length} archivo{item.attachments.length !== 1 ? 's' : ''}
            </span>
          </div>

          {item.attachments.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">
              No hay documentos adjuntos registrados.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {item.attachments.map((att) => (
                <div key={att.tipo} className="px-6 py-4 flex items-center gap-4">
                  <FileIcon tipo={att.tipo} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {TIPO_LABELS[att.tipo] || att.tipo}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{att.url.split('/').pop()}</p>
                  </div>
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Eye size={14} />
                    Ver
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer informativo */}
        <div className="text-center text-xs text-slate-400 pb-6">
          ID del documento: <span className="font-mono">{id}</span> · Solicitud #{id} · Procesado por sistema de Firplak
        </div>
      </main>
    </div>
  );
}
