import DevolucionForm from '@/components/DevolucionForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EmpresaDevolucionPage({ params }: { params: Promise<{ empresa: string }> }) {
  const { empresa } = await params;

  // Validate the parameter against our known companies
  const empresasValidas = ['firplak', 'firplak-home', 'viventta'];
  
  if (!empresasValidas.includes(empresa)) {
    notFound();
  }

  // Format the title nicely
  const titles: Record<string, string> = {
    'firplak': 'Devoluciones Firplak',
    'firplak-home': 'Devoluciones Firplak Home',
    'viventta': 'Devoluciones Viventta'
  };

  const title = titles[empresa];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 relative py-12">
      <Link 
        href="/devoluciones"
        className="absolute top-6 left-6 flex items-center gap-2 text-blue-900 hover:text-blue-700 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 font-medium"
      >
        <ArrowLeft size={20} />
        Volver a Opciones
      </Link>

      <div className="flex-1 w-full flex flex-col items-center mt-12 md:mt-4">
        <div className="w-full max-w-2xl mb-6 text-center md:text-left pl-2">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            {title}
          </h1>
          <p className="text-slate-500 mt-1">
            Por favor, completa el formulario con los datos requeridos.
          </p>
        </div>

        <DevolucionForm empresa={empresa} />
      </div>
    </div>
  );
}
