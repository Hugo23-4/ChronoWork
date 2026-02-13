import { AuthProvider } from '@/context/AuthContext';
import { SpeedInsights } from "@vercel/speed-insights/next"
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';

export const metadata = {
  title: 'ChronoWork - Gestión Horaria',
  description: 'Sistema profesional de fichajes e integridad del dato',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Importación de fuente Inter desde Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}