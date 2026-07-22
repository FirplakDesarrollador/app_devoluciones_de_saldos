import Link from 'next/link';
import { Banknote, Undo2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-8 md:p-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight mb-4">
          Portal de Gestión
        </h1>
        <p className="text-lg text-slate-600 mb-10 max-w-lg mx-auto">
          Selecciona el proceso que deseas realizar.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            href="/anticipos"
            className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 ease-in-out"
          >
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-100 transition-transform duration-300">
              <Banknote size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Anticipos</h2>
            <p className="text-sm text-slate-500 text-center">
              Solicita y gestiona anticipos.
            </p>
          </Link>

          <Link
            href="/devoluciones"
            className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300 ease-in-out"
          >
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-100 transition-transform duration-300">
              <Undo2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Devolución de Saldos</h2>
            <p className="text-sm text-slate-500 text-center">
              Gestiona devoluciones de saldos.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
