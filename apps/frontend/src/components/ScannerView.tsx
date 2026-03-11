'use client';

export default function ScannerView({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-navy z-3 flex flex-col items-center justify-center">
      
      {/* Botón Cerrar */}
      <button 
        onClick={onClose}
        className="absolute top-0 right-0 m-4 bg-transparent border-none cursor-pointer text-white no-underline text-4xl"
        style={{ zIndex: 1060 }}
      >
        &times;
      </button>

      {/* Instrucciones */}
      <div className="text-center text-white mb-6 px-4 relative" style={{ zIndex: 1050 }}>
        <h3 className="font-bold mb-2">Escanear Código QR</h3>
        <p className="opacity-75">Enfoca el código de seguridad del empleado</p>
      </div>

      {/* Retículo de Escaneo (Círculo Verde Neón) */}
      <div className="relative flex justify-center items-center">
        {/* Efecto de radar/scan */}
        <div className="animate-spin text-emerald-500" style={{ width: '18rem', height: '18rem', borderWidth: '4px' }} role="status"></div>
        
        {/* Marco de cámara simulado */}
        <div className="absolute border border-success border-2 rounded-2xl opacity-50" 
             style={{ width: '16rem', height: '16rem', boxShadow: '0 0 50px rgba(16, 185, 129, 0.3)' }}>
        </div>
        
        {/* Icono central */}
        <i className="bi bi-qr-code-scan text-white text-7xl absolute opacity-50"></i>
      </div>

      {/* Botón de Acción Inferior */}
      <div className="absolute bottom-0 w-full p-4 mb-4 text-center">
        <button className="bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none btn-lg w-full py-3 rounded-full font-bold shadow-lg">
          <i className="bi bi-camera-fill mr-2"></i> Capturar Hash
        </button>
      </div>
    </div>
  );
}