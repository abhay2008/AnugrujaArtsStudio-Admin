'use client';

import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Key,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Lock,
  GitCommit,
  Loader2,
  Server,
} from 'lucide-react';
import { useSite } from '@/context/SiteContext';

export default function GitHubSyncPage() {
  const { tokenOverride, setTokenOverride } = useSite();
  const [tokenInput, setTokenInput] = useState(tokenOverride || '');
  const [testing, setTesting] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchDiagnostics = async (tok?: string) => {
    setTesting(true);
    try {
      const active = tok !== undefined ? tok : tokenOverride;
      const headers: Record<string, string> = {};
      if (active) headers['x-github-token'] = active;

      const res = await fetch('/api/github', { headers });
      const data = await res.json();
      setDiagnostics(data);
    } catch (err: any) {
      setDiagnostics({ diagnostics: { connected: false, error: err.message } });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, [tokenOverride]);

  const handleSaveToken = () => {
    const clean = tokenInput.trim();
    setTokenOverride(clean);
    setSaveSuccess(true);
    fetchDiagnostics(clean);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleClearToken = () => {
    setTokenInput('');
    setTokenOverride('');
    fetchDiagnostics('');
  };

  const isConnected = diagnostics?.diagnostics?.connected;

  return (
    <div className="space-y-6 text-xs">
      <div>
        <h1 className="font-cinzel text-2xl font-bold text-studio-gold">
          GitHub Integration & Fine-Grained Access Tokens
        </h1>
        <p className="text-[color:var(--ink-muted)] mt-0.5">
          Configure secure Git-backed headless persistence for public and private repositories
        </p>
      </div>

      {/* Connection Overview Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
          isConnected
            ? 'bg-emerald-950/15 border-emerald-500/30 text-emerald-300'
            : 'bg-amber-950/15 border-amber-500/30 text-amber-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl border ${
              isConnected
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
            }`}
          >
            {isConnected ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="font-cinzel font-bold text-base text-white">
              {isConnected
                ? 'GitHub Contents API Active & Connected'
                : 'Fine-Grained Token Pending Configuration'}
            </h2>
            <p className="text-zinc-400 mt-0.5">
              {isConnected
                ? `Authenticated with repository ${diagnostics?.config?.publicRepo} on branch ${diagnostics?.config?.branch}`
                : 'Supply a fine-grained personal access token with contents:write permission to commit directly'}
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchDiagnostics()}
          disabled={testing}
          className="admin-btn-ghost px-4 py-2 text-studio-gold hover:text-studio-gold self-start md:self-auto"
        >
          {testing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>Re-test Connection</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Management Card */}
        <div className="admin-panel p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[color:var(--hairline)] pb-3">
            <Key className="w-4 h-4 text-studio-gold" />
            <h3 className="font-cinzel font-bold text-sm text-studio-gold uppercase tracking-wider">
              Token Configuration
            </h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="admin-label">
                Fine-Grained Personal Access Token (PAT)
              </label>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="github_pat_11A... or ghp_..."
                className="admin-input font-mono text-xs"
              />
              <p className="text-[11px] text-[color:var(--ink-muted)]">
                You can generate a fine-grained token scoped strictly to this repository.
              </p>
            </div>

            {saveSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Token saved and applied to active session!</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveToken}
                className="admin-btn-gold px-4 py-2"
              >
                <span>Save Token</span>
              </button>
              {tokenOverride && (
                <button
                  onClick={handleClearToken}
                  className="px-3 py-2 rounded-xl text-[color:var(--ink-muted)] hover:text-rose-400 transition-colors"
                >
                  Clear Token
                </button>
              )}
            </div>
          </div>

          {/* Repo Config Breakdown */}
          <div className="pt-3 border-t border-[color:var(--hairline)] space-y-2 text-[color:var(--ink)]">
            <h4 className="font-semibold text-studio-gold">Repository Target Settings</h4>
            <div className="p-3 rounded-xl bg-black/25 border border-[color:var(--hairline)] font-mono space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[color:var(--ink-muted)]">Public Customer Site:</span>
                <span className="text-zinc-200">abhay2008/AnugrujaArtsStudio</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[color:var(--ink-muted)]">Admin Console Repo:</span>
                <span className="text-zinc-200">abhay2008/AnugrujaArtsStudio-Admin</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[color:var(--ink-muted)]">Production Branch:</span>
                <span className="text-studio-gold">main</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[color:var(--ink-muted)]">Local Sibling Sync:</span>
                <span className="text-emerald-400">Active (../AnugrujaArtsStudio)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Results & Latest Commit */}
        <div className="admin-panel p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[color:var(--hairline)] pb-3">
            <Server className="w-4 h-4 text-studio-gold" />
            <h3 className="font-cinzel font-bold text-sm text-studio-gold uppercase tracking-wider">
              Diagnostics & Deployment Info
            </h3>
          </div>

          {diagnostics?.latestCommit ? (
            <div className="p-4 rounded-xl bg-black/25 border border-[color:var(--hairline)] space-y-2">
              <div className="flex items-center gap-2 text-studio-gold font-semibold">
                <GitCommit className="w-4 h-4" />
                <span>Latest Production Commit</span>
              </div>
              <p className="font-mono text-[color:var(--ink)] text-xs line-clamp-2">
                &quot;{diagnostics.latestCommit.message}&quot;
              </p>
              <div className="flex items-center justify-between text-[11px] text-[color:var(--ink-muted)] pt-1">
                <span>By: {diagnostics.latestCommit.author}</span>
                <span className="font-mono text-studio-gold">
                  {diagnostics.latestCommit.sha?.slice(0, 7)}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-black/25 border border-[color:var(--hairline)] text-[color:var(--ink-muted)] text-center">
              Commit telemetry will appear once token is verified.
            </div>
          )}

          {/* Step-by-step Fine-Grained Token Guide */}
          <div className="p-4 rounded-xl bg-black/25 border border-[color:var(--hairline)] space-y-2">
            <h4 className="font-semibold text-studio-gold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Required Fine-Grained PAT Permissions:
            </h4>
            <div className="space-y-1.5 text-[color:var(--ink-muted)] text-[11px]">
              <p>
                1. Navigate to <strong>GitHub &gt; Settings &gt; Developer settings &gt; Personal access tokens &gt; Fine-grained tokens</strong>.
              </p>
              <p>
                2. Select <strong>Repository access: &quot;Only select repositories&quot;</strong> and choose <code>AnugrujaArtsStudio</code>.
              </p>
              <p>
                3. Under <strong>Repository permissions</strong>, enable:
                <br />
                <span className="text-emerald-300 font-mono pl-3">• Contents: Read and write</span> (allows creating image files and updating site.json)
                <br />
                <span className="text-emerald-300 font-mono pl-3">• Metadata: Read-only</span> (automatically selected)
              </p>
              <p>
                4. Click <strong>Generate token</strong> and paste it into the box above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
