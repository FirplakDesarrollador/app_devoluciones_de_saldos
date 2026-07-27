import { AlertCircle } from 'lucide-react';
import AprobacionClient from './AprobacionClient';

interface Attachment { tipo: string; url: string; }

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
            El documento con ID{' '}
            <code className="bg-slate-100 px-1 rounded text-xs">{id}</code>{' '}
            no existe o no tienes acceso.
          </p>
        </div>
      </div>
    );
  }

  return <AprobacionClient item={item} />;
}
