import { Suspense } from 'react';
import LoginClient from './LoginClient';

export const metadata = {
  title: 'Admin Login — Anugraha Arts Studio',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-zinc-400">Loading portal...</div>}>
      <LoginClient />
    </Suspense>
  );
}
