// FILE: components/modules/OpportunityDetail.tsx
// SECURITY: NIST 800-53 Rev 5 CHECKED
// Sprint 2 Fix: Column names aligned to live database.types.ts
'use client';

import { useState } from 'react';
import {
  X,
  Edit3,
  Trash2,
  Calendar,
  Building2,
  DollarSign,
  User,
  Tag,
  ExternalLink,
} from 'lucide-react';
import type { Opportunity, Profile } from '@/lib/supabase/types';
import { COLUMN_LABELS } from '@/lib/supabase/types';

// ============================================================
// PROPS
// ============================================================

interface OpportunityDetailProps {
  opportunity: Opportunity;
  profile: Profile | null;
  onClose: () => void;
  onEdit?: (_opp: Opportunity) => void;
  onDelete?: (_id: string) => void;
}

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(val: number | null | undefined): string {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDate(val: string | null | undefined): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function PwinBadge({ pwin }: { pwin: number | null }) {
  if (pwin == null) return <span style={{ color: '#94A3B8' }}>—</span>;
  const color =
    pwin >= 70 ? '#22C55E' : pwin >= 40 ? '#F59E0B' : '#EF4444';
  const bg =
    pwin >= 70
      ? 'rgba(34, 197, 94, 0.15)'
      : pwin >= 40
        ? 'rgba(245, 158, 11, 0.15)'
        : 'rgba(239, 68, 68, 0.15)';

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold"
      style={{ backgroundColor: bg, color }}
    >
      {pwin}%
    </span>
  );
}

// ============================================================
// DETAIL ROW
// ============================================================

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid #1E293B' }}>
      {Icon && <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: '#94A3B8' }}>
          {label}
        </p>
        <p className="text-sm text-white mt-0.5">{value ?? '—'}</p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function OpportunityDetail({
  opportunity: opp,
  profile,
  onClose,
  onEdit,
  onDelete,
}: OpportunityDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const userRole = profile?.role ?? 'Partner';
  const canEdit = ['CEO', 'COO', 'CAP', 'PM', 'executive', 'operations', 'capture', 'proposal_manager', 'admin', 'Admin'].includes(userRole);
  const canDelete = ['CEO', 'COO', 'executive', 'operations', 'admin', 'Admin'].includes(userRole);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl"
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between px-6 py-4 z-10"
          style={{
            backgroundColor: '#0F172A',
            borderBottom: '1px solid #1E293B',
          }}
        >
          <h2 className="text-lg font-bold text-white truncate pr-4">
            {opp.title}
          </h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            {canEdit && onEdit && (
              <button
                onClick={() => onEdit(opp)}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                style={{ color: '#00E5FA' }}
                aria-label="Edit"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {canDelete && onDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                style={{ color: '#EF4444' }}
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              style={{ color: '#94A3B8' }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-1">
          {/* Status + pWin */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className="mp-badge"
              style={{
                backgroundColor: 'rgba(0, 229, 250, 0.15)',
                color: '#00E5FA',
              }}
            >
              {opp.status}
            </span>
            <span
              className="mp-badge"
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                color: '#8B5CF6',
              }}
            >
              {opp.phase}
            </span>
            <PwinBadge pwin={opp.pwin} />
          </div>

          {opp.description && (
            <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
              {opp.description}
            </p>
          )}

          <DetailRow
            label={COLUMN_LABELS.agency ?? 'Agency'}
            value={opp.agency}
            icon={Building2}
          />
          <DetailRow
            label={COLUMN_LABELS.ceiling ?? 'Contract Value'}
            value={formatCurrency(opp.ceiling)}
            icon={DollarSign}
          />
          <DetailRow
            label={COLUMN_LABELS.solicitation_number ?? 'Solicitation #'}
            value={opp.solicitation_number}
            icon={Tag}
          />
          <DetailRow
            label={COLUMN_LABELS.due_date ?? 'Due Date'}
            value={formatDate(opp.due_date)}
            icon={Calendar}
          />
          <DetailRow
            label={COLUMN_LABELS.contact_name ?? 'Primary Contact'}
            value={
              opp.contact_name
                ? `${opp.contact_name}${opp.contact_email ? ` · ${opp.contact_email}` : ''}`
                : null
            }
            icon={User}
          />
          <DetailRow
            label={COLUMN_LABELS.set_aside ?? 'Set-Aside'}
            value={opp.set_aside}
          />
          {opp.sam_url && (
            <DetailRow
              label="Source"
              value={
                <a
                  href={opp.sam_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                  style={{ color: '#00E5FA' }}
                >
                  View source <ExternalLink className="w-3 h-3" />
                </a>
              }
              icon={ExternalLink}
            />
          )}
          {opp.pop_start && (
            <DetailRow
              label={COLUMN_LABELS.pop_start ?? 'Period of Performance'}
              value={`${formatDate(opp.pop_start)} — ${formatDate(opp.pop_end)}`}
            />
          )}
        </div>

        {/* Delete Confirmation */}
        {confirmDelete && (
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderTop: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <p className="text-sm text-white">
              Delete <strong>{opp.title}</strong>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-sm rounded"
                style={{ color: '#94A3B8' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete?.(opp.id);
                  onClose();
                }}
                className="px-3 py-1.5 text-sm rounded font-medium text-white"
                style={{ backgroundColor: '#EF4444' }}
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* AI Disclaimer */}
        <p className="mp-ai-disclaimer">
          AI GENERATED — REQUIRES HUMAN REVIEW
        </p>
      </div>
    </div>
  );
}
