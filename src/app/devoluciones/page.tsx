import Link from 'next/link';
import { ArrowLeft, Building2, Home as HomeIcon, Map } from 'lucide-react';

export default function DevolucionesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4 relative">
      <Link 
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors bg-white/50 px-4 py-2 rounded-full shadow-sm hover:shadow-md backdrop-blur-sm font-medium"
      >
        <ArrowLeft size={20} />
        Volver al Inicio
      </Link>

      <div className="max-w-4xl w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-8 md:p-12 text-center mt-12 md:mt-0">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight mb-4">
          Devolución de Saldos
        </h1>
        <p className="text-lg text-slate-600 mb-10 max-w-lg mx-auto">
          Selecciona la empresa correspondiente para iniciar el proceso de devolución.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/devoluciones/firplak"
            className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-2 hover:border-blue-400 transition-all duration-300 ease-out"
          >
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-100 transition-transform duration-300">
              <Building2 size={32} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Devoluciones Firplak</h2>
          </Link>

          <Link
            href="/devoluciones/firplak-home"
            className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-2 hover:border-emerald-400 transition-all duration-300 ease-out"
          >
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-100 transition-transform duration-300">
              <HomeIcon size={32} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Devoluciones Firplak Home</h2>
          </Link>

          <Link
            href="/devoluciones/viventta"
            className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-2 hover:border-purple-400 transition-all duration-300 ease-out"
          >
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-purple-100 transition-transform duration-300">
              <Map size={32} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Devoluciones Viventta</h2>
          </Link>
        </div>
      </div>
    </div>
  );
}
