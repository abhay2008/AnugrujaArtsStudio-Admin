'use client';

import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useSite } from '@/context/SiteContext';
import type { StudioEvent } from '@/lib/types';

const EMPTY_EVENT: StudioEvent = {
  id: '',
  title: '',
  date: '',
  dateIso: '',
  eventType: 'Workshop',
  location: '',
  description: '',
  registrationDeadline: '',
  registrationUrl: '',
  seatsRemaining: undefined,
  images: [],
  outcome: '',
};

function eventToForm(event: StudioEvent): StudioEvent {
  return {
    ...event,
    images: event.images?.length ? [...event.images] : event.image ? [event.image] : [],
  };
}

function EventForm({
  value,
  isPast,
  onChange,
  onSave,
  onCancel,
}: {
  value: StudioEvent;
  isPast: boolean;
  onChange: (patch: Partial<StudioEvent>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const imagesText = (value.images || []).join('\n');

  return (
    <div className="admin-panel p-5 sm:p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="admin-kicker">{isPast ? 'Past event / exhibition' : 'Upcoming registration event'}</p>
          <h2 className="admin-title text-lg mt-1">{value.id ? 'Edit event details' : 'Create a new event'}</h2>
          <p className="text-xs text-[color:var(--ink-muted)] mt-1">
            These details appear on the website and help the studio assistant answer visitors after publishing.
          </p>
        </div>
        <CalendarDays className="w-5 h-5 text-studio-gold shrink-0" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <label className="space-y-1 sm:col-span-2">
          <span className="admin-label">Event name *</span>
          <input required value={value.title} onChange={(e) => onChange({ title: e.target.value })} className="admin-input" placeholder="e.g. Realistic Watercolor Mastery" />
        </label>

        <label className="space-y-1">
          <span className="admin-label">Event type</span>
          <select value={value.eventType || 'Workshop'} onChange={(e) => onChange({ eventType: e.target.value })} className="admin-input">
            <option>Workshop</option>
            <option>Masterclass</option>
            <option>Exhibition</option>
            <option>Retreat</option>
            <option>Class</option>
            <option>Outreach</option>
            <option>Corporate</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="admin-label">Display date *</span>
          <input required value={value.date} onChange={(e) => onChange({ date: e.target.value })} className="admin-input" placeholder="Starts Oct 12, 2026" />
        </label>
        <label className="space-y-1">
          <span className="admin-label">Calendar date</span>
          <input type="date" value={value.dateIso || ''} onChange={(e) => onChange({ dateIso: e.target.value })} className="admin-input" />
        </label>
        <label className="space-y-1">
          <span className="admin-label">Venue / location</span>
          <input value={value.location || ''} onChange={(e) => onChange({ location: e.target.value })} className="admin-input" placeholder="Anugruja Arts Studio" />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="admin-label">Description *</span>
          <textarea required rows={4} value={value.description || ''} onChange={(e) => onChange({ description: e.target.value })} className="admin-input resize-y" placeholder="Explain what visitors will experience..." />
        </label>

        {!isPast ? (
          <>
            <label className="space-y-1">
              <span className="admin-label">Registration deadline</span>
              <input value={value.registrationDeadline || ''} onChange={(e) => onChange({ registrationDeadline: e.target.value })} className="admin-input" placeholder="Registrations close October 5" />
            </label>
            <label className="space-y-1">
              <span className="admin-label">Seats remaining</span>
              <input type="number" min={0} value={value.seatsRemaining ?? ''} onChange={(e) => onChange({ seatsRemaining: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)) })} className="admin-input" placeholder="Leave blank if not applicable" />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="admin-label">Registration link (optional)</span>
              <input type="url" value={value.registrationUrl || ''} onChange={(e) => onChange({ registrationUrl: e.target.value })} className="admin-input" placeholder="https://..." />
            </label>
          </>
        ) : (
          <label className="space-y-1 sm:col-span-2">
            <span className="admin-label">Outcome / highlights</span>
            <textarea rows={3} value={value.outcome || ''} onChange={(e) => onChange({ outcome: e.target.value })} className="admin-input resize-y" placeholder="Attendance, recognitions, or what happened..." />
          </label>
        )}

        <label className="space-y-1 sm:col-span-2">
          <span className="admin-label">Event photos (one URL per line)</span>
          <textarea rows={3} value={imagesText} onChange={(e) => onChange({ images: e.target.value.split(/\n|,/).map((item) => item.trim()).filter(Boolean) })} className="admin-input font-mono text-xs resize-y" placeholder="/images/w1.jpeg\n/images/w6.jpeg" />
          <span className="text-[11px] text-[color:var(--ink-faint)]">Use photos that are already on the website. The first photo becomes the main event photo.</span>
        </label>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2 border-t border-[color:var(--hairline)]">
        <button type="button" onClick={onCancel} className="admin-btn-ghost px-4 py-2">Cancel</button>
        <button type="button" onClick={onSave} disabled={!value.title.trim() || !value.date.trim() || !value.description?.trim()} className="admin-btn-gold px-4 py-2 disabled:opacity-50">
          <Save className="w-4 h-4" /> Save for review
        </button>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const { content, loading, updateEvents } = useSite();
  const [kind, setKind] = useState<'upcoming' | 'past'>('upcoming');
  const [draft, setDraft] = useState<StudioEvent | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const events = useMemo(() => content?.events?.[kind] || [], [content?.events, kind]);

  if (loading || !content) {
    return <div className="text-center py-20 text-[color:var(--ink-muted)]">Loading events calendar...</div>;
  }

  const beginCreate = () => {
    setDraft({ ...EMPTY_EVENT, id: `event-${Date.now()}` });
  };

  const beginEdit = (event: StudioEvent) => {
    setDraft(eventToForm(event));
  };

  const saveDraft = () => {
    if (!draft || !draft.title.trim() || !draft.date.trim() || !draft.description?.trim()) return;
    const next = [...events];
    const index = next.findIndex((event) => event.id === draft.id);
    if (index >= 0) next[index] = eventToForm(draft);
    else next.unshift(eventToForm(draft));
    updateEvents({ [kind]: next });
    setDraft(null);
  };

  const removeEvent = (event: StudioEvent) => {
    if (!window.confirm(`Remove “${event.title}” from ${kind} events? This is only a pending change and can still be cancelled before publishing.`)) return;
    updateEvents({ [kind]: events.filter((item) => item.id !== event.id) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="admin-kicker">Website events and registration details</p>
          <h1 className="font-cinzel text-2xl font-bold text-studio-gold mt-1">Events & Workshops</h1>
          <p className="text-xs text-[color:var(--ink-muted)] max-w-2xl mt-1">Keep workshop, masterclass, and exhibition information current for visitors. Customer messages are handled through your usual contact channels.</p>
        </div>
        <button onClick={beginCreate} className="admin-btn-gold px-4 py-2.5 self-start lg:self-auto"><Plus className="w-4 h-4" /> Add {kind === 'upcoming' ? 'upcoming event' : 'past event'}</button>
      </div>

      <div className="flex gap-2 border-b border-[color:var(--hairline)] pb-2">
        {(['upcoming', 'past'] as const).map((tab) => (
          <button key={tab} onClick={() => { setKind(tab); setDraft(null); }} className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize ${kind === tab ? 'admin-btn-gold' : 'admin-btn-ghost'}`}>
            {tab} ({content.events?.[tab]?.length || 0})
          </button>
        ))}
      </div>

      {draft && <EventForm value={draft} isPast={kind === 'past'} onChange={(patch) => setDraft((prev) => prev ? { ...prev, ...patch } : prev)} onSave={saveDraft} onCancel={() => setDraft(null)} />}

      <div className="space-y-3">
        {events.length === 0 && !draft && (
          <div className="admin-panel p-10 text-center text-sm text-[color:var(--ink-muted)]">No {kind} events yet. Add one to keep the website current.</div>
        )}
        {events.map((event) => {
          const expanded = openId === event.id;
          return (
            <article key={event.id} className="admin-card overflow-hidden">
              <div className="flex items-start gap-3 p-4 sm:p-5">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/30 border border-[color:var(--hairline)] shrink-0 flex items-center justify-center">
                  {event.images?.[0] || event.image ? <img src={event.images?.[0] || event.image} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-studio-gold/60" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="admin-pill admin-pill--gold">{event.eventType || (kind === 'past' ? 'Past event' : 'Event')}</span>
                    <span className="text-[11px] text-[color:var(--ink-muted)]">{event.date}</span>
                  </div>
                  <h2 className="font-cinzel text-sm sm:text-base text-zinc-100 font-bold mt-1 truncate">{event.title}</h2>
                  <p className="text-xs text-[color:var(--ink-muted)] mt-1 line-clamp-2">{event.description}</p>
                  <p className="text-[11px] text-studio-gold mt-2">{event.location || 'Location not set'}{kind === 'upcoming' && event.seatsRemaining !== undefined ? ` · ${event.seatsRemaining} seats left` : ''}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => beginEdit(event)} className="admin-btn-ghost px-2.5 py-2 text-xs">Edit</button>
                  <button onClick={() => removeEvent(event)} className="p-2 text-zinc-500 hover:text-rose-300" title="Remove event"><Trash2 className="w-4 h-4" /></button>
                  <button onClick={() => setOpenId(expanded ? null : event.id)} className="p-2 text-zinc-400 hover:text-studio-gold" aria-label="Toggle event details">{expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                </div>
              </div>
              {expanded && <div className="px-5 pb-5 pt-0 text-xs border-t border-[color:var(--hairline)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[color:var(--ink-muted)]"><p><b className="text-zinc-200">Deadline:</b> {event.registrationDeadline || 'Not set'}</p><p><b className="text-zinc-200">Registration:</b> {event.registrationUrl || 'WhatsApp / contact channel'}</p><p><b className="text-zinc-200">Photos:</b> {event.images?.length || (event.image ? 1 : 0)}</p><p className="sm:col-span-2"><b className="text-zinc-200">Description:</b> {event.description}</p></div>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
