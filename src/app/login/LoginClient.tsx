'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Key, ShieldCheck, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

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
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-studio-card border border-studio-gold/30 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl relative overflow-hidden">
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-studio-gold to-transparent" />

        {/* Brand Crest */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-studio-gold-dark via-studio-gold to-amber-200 flex items-center justify-center text-studio-purple-dark font-cinzel font-black text-3xl shadow-xl">
            A
          </div>
          <div>
            <h1 className="font-cinzel text-2xl font-bold tracking-wider text-studio-gold">
              ANUGRAHA ARTS
            </h1>
            <p className="text-xs text-amber-200/70 tracking-widest uppercase font-sans mt-1">
              Studio Admin Portal
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              Master Admin Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access password"
                autoFocus
                required
                className="w-full pl-10 pr-10 py-3 bg-studio-dark border border-studio-border rounded-xl text-zinc-100 text-sm focus:border-studio-gold focus:outline-none placeholder:text-zinc-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
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

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-studio-gold via-amber-300 to-studio-gold text-studio-purple-dark shadow-lg hover:shadow-[0_0_25px_rgba(242,215,112,0.5)] active:scale-98 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Access Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Hint / Local Development Helper */}
        <div className="mt-8 pt-4 border-t border-studio-border/50 text-center">
          <p className="text-[11px] text-zinc-400 flex items-center justify-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-studio-gold" />
            <span>Default admin password: <code className="font-mono text-studio-gold">REDACTED-SECRET-REMOVED-FROM-HISTORY</code></span>
          </p>
        </div>
      </div>
    </div>
  );
}
