'use client';

export default function ScannerView({ onClose }: { onClose: () => void }) {
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark z-3 d-flex flex-column align-items-center justify-content-center">
      
      {/* Botón Cerrar */}
      <button 
        onClick={onClose}
        className="position-absolute top-0 end-0 m-4 btn btn-link text-white text-decoration-none fs-1"
        style={{ zIndex: 1060 }}
      >
        &times;
      </button>

      {/* Instrucciones */}
      <div className="text-center text-white mb-5 px-4 position-relative" style={{ zIndex: 1050 }}>
        <h3 className="fw-bold mb-2">Escanear Código QR</h3>
        <p className="opacity-75">Enfoca el código de seguridad del empleado</p>
      </div>

      {/* Retículo de Escaneo (Círculo Verde Neón) */}
      <div className="position-relative d-flex justify-content-center align-items-center">
        {/* Efecto de radar/scan */}
        <div className="spinner-border text-success" style={{ width: '18rem', height: '18rem', borderWidth: '4px' }} role="status"></div>
        
        {/* Marco de cámara simulado */}
        <div className="position-absolute border border-success border-2 rounded-4 opacity-50" 
             style={{ width: '16rem', height: '16rem', boxShadow: '0 0 50px rgba(16, 185, 129, 0.3)' }}>
        </div>
        
        {/* Icono central */}
        <i className="bi bi-qr-code-scan text-white display-1 position-absolute opacity-50"></i>
      </div>

      {/* Botón de Acción Inferior */}
      <div className="position-absolute bottom-0 w-100 p-4 mb-4 text-center">
        <button className="btn btn-primary btn-lg w-100 py-3 rounded-pill fw-bold shadow-lg">
          <i className="bi bi-camera-fill me-2"></i> Capturar Hash
        </button>
      </div>
    </div>
  );
}