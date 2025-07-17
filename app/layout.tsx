import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Winston - Security Operations Platform',
  description: 'Comprehensive threat intelligence and security analysis platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}