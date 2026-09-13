import type { Metadata } from 'next';
import './globals.css';
import AdminLayoutShell from '@/components/AdminLayoutShell';

export const metadata: Metadata = {
  title: 'Anugraha Arts Studio — Master Admin & CMS Console',
  description: 'Exclusive portfolio and content management console with GitHub Git-backed persistence.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-studio-dark text-zinc-100 selection:bg-studio-gold selection:text-studio-purple-dark">
        <AdminLayoutShell>{children}</AdminLayoutShell>
      </body>
    </html>
  );
}
