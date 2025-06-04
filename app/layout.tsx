import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppLayout } from '@/components/app-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Grandmaster AI Agent',
  description: 'AI Chess Coach - Analyze your chess games with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}