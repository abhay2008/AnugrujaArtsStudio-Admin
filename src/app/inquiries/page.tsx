'use client';

import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Send,
  Calculator,
  Trash2,
  Edit2,
  CheckCircle,
  Copy,
  Clock,
  Phone,
  Mail,
  User,
  X,
  Sparkles,
} from 'lucide-react';
import { useSite } from '@/context/SiteContext';
import { Inquiry } from '@/lib/types';

export default function InquiriesPage() {
  const { inquiries, inquiriesLoading, saveInquiry, deleteInquiry } = useSite();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState(false);

  // New Inquiry State
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custInterest, setCustInterest] = useState<Inquiry['interest']>('Commission');
  const [custArtwork, setCustArtwork] = useState('');
  const [custBudget, setCustBudget] = useState('₹25,000');
  const [custNotes, setCustNotes] = useState('');

  // Commission Calculator State
  const [calcWidth, setCalcWidth] = useState(24);
  const [calcHeight, setCalcHeight] = useState(30);
  const [calcMedium, setCalcMedium] = useState<'watercolor' | 'acrylic' | 'oil' | 'charcoal'>('watercolor');
  const [calcFrame, setCalcFrame] = useState<'none' | 'teakwood' | 'gold_leaf'>('teakwood');

  const estimatedPrice = useMemo(() => {
    const sqIn = calcWidth * calcHeight;
    let ratePerSqIn = 35;
    if (calcMedium === 'acrylic') ratePerSqIn = 45;
    if (calcMedium === 'oil') ratePerSqIn = 60;
    if (calcMedium === 'charcoal') ratePerSqIn = 25;

    let base = sqIn * ratePerSqIn;
    let frameCost = 0;
    if (calcFrame === 'teakwood') frameCost = 4500;
    if (calcFrame === 'gold_leaf') frameCost = 7500;

    const total = base + frameCost;
    // Round to nearest 500
    return Math.round(total / 500) * 500;
  }, [calcWidth, calcHeight, calcMedium, calcFrame]);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const matchStatus = statusFilter === 'all' || inq.status === statusFilter;
      const matchSearch =
        inq.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inq.phone.includes(searchQuery) ||
        (inq.artworkTitle && inq.artworkTitle.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [inquiries, statusFilter, searchQuery]);

  const handleAddInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPhone) return;

    await saveInquiry({
      id: `inq-${Date.now()}`,
      customerName: custName,
      phone: custPhone,
      email: custEmail,
      interest: custInterest,
      artworkTitle: custArtwork || `${custInterest} Request`,
      budget: custBudget,
      status: 'New',
      date: new Date().toISOString().split('T')[0],
      notes: custNotes,
    });

    setShowAddModal(false);
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setCustArtwork('');
    setCustNotes('');
  };

  const copyQuoteToClipboard = () => {
    const text = `Namaste! Here is your custom artwork estimate from Anugraha Arts Studio:\n• Canvas Size: ${calcWidth}x${calcHeight} inches (${calcWidth * calcHeight} sq in)\n• Medium: ${calcMedium.toUpperCase()}\n• Framing: ${calcFrame.replace('_', ' ').toUpperCase()}\n• Estimated Investment: ₹${estimatedPrice.toLocaleString('en-IN')}\n\nIncludes artist consultation and certificate of authenticity.`;
    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-studio-gold">
            Inquiries & Client Lead Tracker
          </h1>
          <p className="text-xs text-[color:var(--ink-muted)]">
            Manage commission requests, class enrollments, and respond with one-click WhatsApp messages
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="admin-btn-ghost px-3.5 py-2 text-studio-gold hover:text-studio-gold"
          >
            <Calculator className="w-4 h-4" />
            <span>Pricing Calculator</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="admin-btn-gold px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Pricing Estimator Box */}
      {showCalculator && (
        <div className="admin-panel p-6 space-y-4 animate-fade-in text-xs">
          <div className="flex items-center justify-between border-b border-[color:var(--hairline)] pb-3">
            <div className="flex items-center gap-2 text-studio-gold font-cinzel font-bold text-sm">
              <Calculator className="w-4 h-4" />
              <span>Custom Artwork Commission Pricing Matrix</span>
            </div>
            <button
              onClick={() => setShowCalculator(false)}
              className="text-[color:var(--ink-faint)] hover:text-studio-gold transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="admin-label">Width (inches)</label>
              <input
                type="number"
                value={calcWidth}
                onChange={(e) => setCalcWidth(parseInt(e.target.value, 10) || 1)}
                className="admin-input"
              />
            </div>
            <div className="space-y-1">
              <label className="admin-label">Height (inches)</label>
              <input
                type="number"
                value={calcHeight}
                onChange={(e) => setCalcHeight(parseInt(e.target.value, 10) || 1)}
                className="admin-input"
              />
            </div>
            <div className="space-y-1">
              <label className="admin-label">Medium</label>
              <select
                value={calcMedium}
                onChange={(e) => setCalcMedium(e.target.value as any)}
                className="admin-input"
              >
                <option value="watercolor">Watercolor on Arches (₹35/sq.in)</option>
                <option value="acrylic">Acrylic on Canvas (₹45/sq.in)</option>
                <option value="oil">Oil on Linen (₹60/sq.in)</option>
                <option value="charcoal">Charcoal Sketch (₹25/sq.in)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="admin-label">Framing Option</label>
              <select
                value={calcFrame}
                onChange={(e) => setCalcFrame(e.target.value as any)}
                className="admin-input"
              >
                <option value="none">Unframed Canvas</option>
                <option value="teakwood">Natural Teakwood Frame (+₹4,500)</option>
                <option value="gold_leaf">Gold-Leaf Italian Frame (+₹7,500)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-studio-border/60">
            <div>
              <span className="text-[color:var(--ink-muted)]">Calculated Estimate: </span>
              <span className="text-lg font-cinzel font-bold text-studio-gold ml-2">
                ₹{estimatedPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <button
              onClick={copyQuoteToClipboard}
              className="admin-btn-ghost px-3 py-1.5 text-studio-gold hover:text-studio-gold"
            >
              {copiedQuote ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Quote</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Client Message</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="admin-panel flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 text-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inquiries by name, phone, artwork..."
            className="admin-input pl-9 pr-3 py-1.5 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {['all', 'New', 'In Discussion', 'Quoted', 'Completed', 'Archived'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 font-medium whitespace-nowrap transition-colors ${
                statusFilter === st ? 'admin-btn-gold' : 'admin-btn-ghost'
              }`}
            >
              {st === 'all' ? 'All Leads' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Inquiries List */}
      <div className="space-y-3">
        {filteredInquiries.length === 0 ? (
          <div className="admin-panel p-12 text-center text-[color:var(--ink-muted)]">
            No inquiries match your current filters.
          </div>
        ) : (
          filteredInquiries.map((inq) => {
            const cleanPhone = inq.phone.replace(/[^0-9]/g, '');
            const waText = encodeURIComponent(
              `Namaste ${inq.customerName}! Thank you for your inquiry with Anugraha Arts Studio regarding "${inq.artworkTitle || inq.interest}". We would love to share full details and pricing with you.`
            );
            const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`;

            return (
              <div
                key={inq.id}
                className="admin-card p-5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-studio-gold/10 text-studio-gold font-cinzel font-bold flex items-center justify-center border border-[color:var(--hairline-strong)]">
                      {inq.customerName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-zinc-100">{inq.customerName}</h3>
                        <span className="admin-pill admin-pill--gold">
                          {inq.interest}
                        </span>
                      </div>
                      <p className="text-xs text-[color:var(--ink-muted)] flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          {inq.phone}
                        </span>
                        {inq.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-zinc-500" />
                            {inq.email}
                          </span>
                        )}
                        <span className="text-zinc-500">• {inq.date}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Dropdown & WhatsApp Action */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <select
                      value={inq.status}
                      onChange={(e) => saveInquiry({ ...inq, status: e.target.value as any })}
                      className="admin-input px-2.5 py-1.5 text-xs w-auto"
                    >
                      <option value="New">New</option>
                      <option value="In Discussion">In Discussion</option>
                      <option value="Quoted">Quoted</option>
                      <option value="Completed">Completed</option>
                      <option value="Archived">Archived</option>
                    </select>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      onClick={() => deleteInquiry(inq.id)}
                      className="p-1.5 text-[color:var(--ink-faint)] hover:text-rose-400 rounded-lg transition-colors"
                      title="Remove lead"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details / Notes */}
                <div className="p-3 rounded-xl bg-black/25 border border-[color:var(--hairline)] text-xs text-[color:var(--ink)] space-y-1">
                  <p>
                    <strong className="text-studio-gold">Artwork / Requirement:</strong>{' '}
                    {inq.artworkTitle || inq.interest}
                  </p>
                  {inq.notes && (
                    <p className="text-[color:var(--ink-muted)] leading-relaxed">
                      <strong className="text-[color:var(--ink)]">Notes:</strong> {inq.notes}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-[11px] text-[color:var(--ink-muted)] pt-1">
                    {inq.budget && (
                      <span>
                        Client Budget: <strong className="text-[color:var(--ink)]">{inq.budget}</strong>
                      </span>
                    )}
                    {inq.quotedPrice && (
                      <span>
                        Quoted Price: <strong className="text-amber-300">{inq.quotedPrice}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in text-xs">
          <div className="admin-panel relative w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[color:var(--hairline)] pb-3">
              <h3 className="font-cinzel font-bold text-base text-studio-gold">
                Log New Customer Lead
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[color:var(--ink-faint)] hover:text-studio-gold transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddInquiry} className="space-y-3">
              <div className="space-y-1">
                <label className="admin-label">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Sangeeta Rao"
                  className="admin-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="admin-label">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="+91 98450 12345"
                    className="admin-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="admin-label">Email Address</label>
                  <input
                    type="email"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="admin-label">Interest Type</label>
                  <select
                    value={custInterest}
                    onChange={(e) => setCustInterest(e.target.value as any)}
                    className="admin-input"
                  >
                    <option value="Commission">Custom Commission</option>
                    <option value="Art Purchase">Art Purchase</option>
                    <option value="Classes">Academy Classes</option>
                    <option value="Workshop">Workshops & Events</option>
                    <option value="General">General Inquiry</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="admin-label">Budget Estimate</label>
                  <input
                    type="text"
                    value={custBudget}
                    onChange={(e) => setCustBudget(e.target.value)}
                    placeholder="e.g. ₹20,000"
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="admin-label">Requirement / Artwork Details</label>
                <input
                  type="text"
                  value={custArtwork}
                  onChange={(e) => setCustArtwork(e.target.value)}
                  placeholder="e.g. 24x36 Oil Landscape or Weekend Watercolor"
                  className="admin-input"
                />
              </div>

              <div className="space-y-1">
                <label className="admin-label">Notes</label>
                <textarea
                  rows={2}
                  value={custNotes}
                  onChange={(e) => setCustNotes(e.target.value)}
                  placeholder="Special instructions, framing preferences..."
                  className="w-full px-3 py-2 bg-studio-dark border border-studio-border rounded-xl text-zinc-100 focus:border-studio-gold focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-[color:var(--ink-muted)] hover:text-studio-gold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-gold px-5 py-2"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
