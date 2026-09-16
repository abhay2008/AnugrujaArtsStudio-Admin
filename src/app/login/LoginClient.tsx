'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('from') || '/';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push(returnTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Incorrect password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative">
      {/* Ambient halo behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,rgba(242,215,112,0.08)_0%,rgba(125,60,152,0.07)_40%,transparent_70%)] blur-2xl" />
      </div>

      <div className="admin-panel relative w-full max-w-md p-8 sm:p-9 overflow-hidden animate-fade-in ring-1 ring-studio-gold/20">
        {/* Foil top edge */}
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-[2px] bg-[linear-gradient(90deg,transparent_0%,#b8933a_20%,#f2d770_50%,#b8933a_80%,transparent_100%)]"
        />

        {/* Brand crest */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[linear-gradient(150deg,#f7e494_0%,#d4af37_55%,#8a6410_100%)] flex items-center justify-center text-[#221204] font-cinzel font-black text-3xl shadow-[0_12px_30px_-10px_rgba(212,175,55,0.7),inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-amber-200/40">
            A
          </div>
          <div>
            <h1 className="font-cinzel text-2xl font-bold tracking-[0.16em] text-studio-gold">
              ANUGRUJA
            </h1>
            <p className="text-[10px] text-amber-200/60 tracking-[0.34em] uppercase font-sans mt-1.5">
              Studio Manager
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="admin-label" htmlFor="admin-password">
Studio Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access password"
                autoFocus
                required
                className="admin-input !pl-10 !pr-10 !py-3"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-studio-gold transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 animate-fade-in">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !password} className="admin-btn-gold w-full !py-3 !text-sm">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating…</span>
              </>
            ) : (
              <>
                <span>Open Studio Manager</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] text-zinc-500">
          Private access for the studio team
        </p>
      </div>
    </div>
  );
}
