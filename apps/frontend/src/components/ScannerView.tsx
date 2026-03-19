'use client';

import { QrCode, Camera } from 'lucide-react';

export default function ScannerView({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-navy z-[1050] flex flex-col items-center justify-center">
      {/* Close */}
      <button onClick={onClose}
        className="absolute top-0 right-0 m-4 bg-transparent border-none cursor-pointer text-white text-4xl z-[1060] leading-none hover:opacity-75 transition-opacity">
        &times;
      </button>

      {/* Instructions */}
      <div className="text-center text-white mb-6 px-4 z-[1050]">
        <h3 className="font-bold mb-2 font-[family-name:var(--font-jakarta)]">Escanear Código QR</h3>
        <p className="opacity-75 text-sm">Enfoca el código de seguridad del empleado</p>
      </div>

      {/* Scan reticle */}
      <div className="relative flex justify-center items-center">
        <div className="animate-spin text-emerald-500 rounded-full" style={{ width: '18rem', height: '18rem', border: '4px solid currentColor', borderTopColor: 'transparent' }} />
        <div className="absolute border-2 border-emerald-500 rounded-2xl opacity-50"
          style={{ width: '16rem', height: '16rem', boxShadow: '0 0 50px rgba(16, 185, 129, 0.3)' }} />
        <QrCode className="absolute w-20 h-20 text-white opacity-50" />
      </div>

      {/* Action button */}
      <div className="absolute bottom-0 w-full p-4 mb-4 text-center">
        <button className="bg-navy text-white w-full py-3 rounded-full font-bold shadow-lg border border-white/20 cursor-pointer hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
          <Camera className="w-5 h-5" /> Capturar Hash
        </button>
      </div>
    </div>
  );
}