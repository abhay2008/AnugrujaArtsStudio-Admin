'use client';

import React, { useState } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Copy,
} from 'lucide-react';
import { useSite } from '@/context/SiteContext';

interface TokenConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TokenConfigModal({ isOpen, onClose }: TokenConfigModalProps) {
  const { tokenOverride, setTokenOverride } = useSite();
  const [tokenInput, setTokenInput] = useState(tokenOverride || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTestToken = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-token', token: tokenInput.trim() }),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.connected) {
        setTokenOverride(tokenInput.trim());
      }
    } catch (err: any) {
      setTestResult({ connected: false, error: err.message || 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setTokenOverride(tokenInput.trim());
    onClose();
  };

  const handleClear = () => {
    setTokenInput('');
    setTokenOverride('');
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-studio-card border border-studio-gold/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border bg-studio-purple/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-studio-gold/20 text-studio-gold">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-lg text-studio-gold">
                GitHub Fine-Grained Token
              </h3>
              <p className="text-xs text-zinc-400">
                Configure fine-grained PAT for automated commits to GitHub
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Token Input Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">
                Personal Access Token (PAT)
              </label>
              {tokenInput && (
                <button
                  onClick={handleClear}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Clear Token
                </button>
              )}
            </div>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="github_pat_11A... or ghp_..."
              className="w-full px-4 py-2.5 bg-studio-dark border border-studio-border rounded-xl text-zinc-100 font-mono text-sm focus:border-studio-gold focus:outline-none placeholder:text-zinc-600"
            />
            <p className="text-[11px] text-zinc-400">
              Saved securely in your local browser session and used for GitHub REST API calls.
            </p>
          </div>

          {/* Test & Diagnostics Result */}
          {testResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                testResult.connected
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {testResult.connected ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Connection Verified & Active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>Connection Failed</span>
                  </>
                )}
              </div>
              {testResult.connected ? (
                <div className="space-y-1 font-mono text-[11px] text-emerald-300/90">
                  <p>• User: {testResult.username}</p>
                  <p>• Public Repo: {testResult.publicRepo} ({testResult.defaultBranch})</p>
                  <p>• Push Permission: {testResult.permissions?.push ? 'Yes (Granted)' : 'No'}</p>
                  <p>• Token Type: {testResult.tokenType}</p>
                </div>
              ) : (
                <p className="text-[11px]">{testResult.error}</p>
              )}
            </div>
          )}

          {/* Step-by-step Fine-Grained PAT Instructions */}
          <div className="p-4 rounded-xl bg-studio-dark/60 border border-studio-border/70 space-y-2.5 text-xs text-zinc-300">
            <h4 className="font-semibold text-studio-gold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              How to create your Fine-Grained Access Token:
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-zinc-400 text-[11px]">
              <li>
                Open{' '}
                <a
                  href="https://github.com/settings/tokens?type=beta"
                  target="_blank"
                  rel="noreferrer"
                  className="text-studio-gold underline inline-flex items-center gap-0.5"
                >
                  GitHub Fine-grained Tokens Settings <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>Click <strong>&quot;Generate new token&quot;</strong> and name it (e.g. <code>Anugraha-Admin</code>).</li>
              <li>Under <strong>Repository access</strong>: select <strong>&quot;Only select repositories&quot;</strong> and choose <code>AnugrujaArtsStudio</code>.</li>
              <li>
                Under <strong>Permissions &gt; Repository permissions</strong>:
                <br />• <strong>Contents</strong>: set to <strong>Read and write</strong> (required to push artworks & JSON).
                <br />• <strong>Metadata</strong>: Read-only (mandatory default).
              </li>
              <li>Click <strong>&quot;Generate token&quot;</strong>, copy it, and paste it here!</li>
            </ol>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-studio-border bg-studio-purple/30">
          <button
            type="button"
            onClick={handleTestToken}
            disabled={testing || !tokenInput}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-studio-purple/60 border border-studio-border hover:border-studio-gold/50 text-studio-gold transition-colors disabled:opacity-50"
          >
            {testing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Testing Connection...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Test Connection</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-studio-gold text-studio-purple-dark hover:bg-amber-300 transition-colors shadow-md"
            >
              Save Token
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
