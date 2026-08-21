"use client";

import Link from 'next/link';
import { Banknote, Undo2, X, Wallet, ShieldCheck, HandCoins } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const [showAnticiposModal, setShowAnticiposModal] = useState(false);

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
          <button
            onClick={() => setShowAnticiposModal(true)}
            className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 ease-in-out text-left"
          >
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-100 transition-transform duration-300">
              <Banknote size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Anticipos</h2>
            <p className="text-sm text-slate-500 text-center">
              Solicita y gestiona anticipos.
            </p>
          </button>

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

      {showAnticiposModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden relative animate-in fade-in zoom-in duration-200">
            {/* Header/Close */}
            <div className="absolute top-2 right-2 z-10">
              <button 
                onClick={() => setShowAnticiposModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Banner/Illustration area */}
            <div className="pt-8 pb-4 px-6 text-center">
              <h3 className="text-[15px] font-medium text-slate-800 mb-4 px-2 leading-tight">
                Bienvenido al registro de solicitud de anticipos V1.1
              </h3>
            </div>
            
            <div className="bg-[#0b8e64] w-full h-40 flex items-center justify-center relative overflow-hidden">
              <div className="flex items-center gap-8 text-white relative z-10">
                <HandCoins size={64} className="text-[#f5c342] opacity-90 drop-shadow-md" />
                <ShieldCheck size={56} className="text-[#f1a84f] opacity-90 drop-shadow-md" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 flex flex-col gap-3">
              <Link href="/anticipos?tipo=gastos_viaje" className="w-full bg-[#3b5998] hover:bg-[#2d4373] text-white py-2.5 px-4 rounded shadow-sm text-center font-medium transition-colors">
                Gastos Viaje
              </Link>
              <Link href="/anticipos?tipo=proveedor" className="w-full bg-[#3b5998] hover:bg-[#2d4373] text-white py-2.5 px-4 rounded shadow-sm text-center font-medium transition-colors">
                Proveedor
              </Link>
              <Link href="/anticipos?tipo=proyecto" className="w-full bg-[#3b5998] hover:bg-[#2d4373] text-white py-2.5 px-4 rounded shadow-sm text-center font-medium transition-colors">
                Proyecto
              </Link>
              <Link href="/anticipos?tipo=cefi" className="w-full bg-[#3b5998] hover:bg-[#2d4373] text-white py-2.5 px-4 rounded shadow-sm text-center font-medium transition-colors">
                CEFI
              </Link>
              <Link href="/anticipos?tipo=viventta" className="w-full bg-[#3b5998] hover:bg-[#2d4373] text-white py-2.5 px-4 rounded shadow-sm text-center font-medium transition-colors">
                Viventta
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
