'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { SiteProvider } from '@/context/SiteContext';
import AdminNav from './AdminNav';
import ReviewChangesModal from './ReviewChangesModal';
import TokenConfigModal from './TokenConfigModal';

export default function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);

  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-studio-dark">
        {children}
      </div>
    );
  }

  return (
    <SiteProvider>
      <div className="min-h-screen flex flex-col">
        <AdminNav
          onOpenReviewModal={() => setReviewModalOpen(true)}
          onOpenTokenModal={() => setTokenModalOpen(true)}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-studio-gold/15 py-4 text-center text-xs text-zinc-500">
          <p>
            © 2026 Anugruja Arts Studio · <span className="font-cinzel tracking-widest text-studio-gold/70">ATELIER CONSOLE</span>
          </p>
        </footer>

        {/* Global Modals */}
        <ReviewChangesModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
        />
        <TokenConfigModal
          isOpen={tokenModalOpen}
          onClose={() => setTokenModalOpen(false)}
        />
      </div>
    </SiteProvider>
  );
}
