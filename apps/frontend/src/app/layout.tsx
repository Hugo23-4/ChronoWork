import { AuthProvider } from '@/context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}