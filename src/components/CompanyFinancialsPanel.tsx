'use client';

import { useEffect, useState } from 'react';

interface CompanyProfile {
  company_name: string;
  company_number: string;
  company_status: string;
  date_of_creation: string;
  registered_office_address?: {
    address_line_1?: string;
    locality?: string;
    postal_code?: string;
  };
  accounts?: {
    next_due?: string;
  };
  confirmation_statement?: {
    next_due?: string;
  };
  sic_codes?: string[];
}

interface FilingItem {
  description?: string;
  type: string;
  date: string;
}

interface FilingHistory {
  items: FilingItem[];
}

interface CompanyFinancialsPanelProps {
  companyNumber: string | null;
}

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const STATUS_CLASSES: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  dissolved: 'bg-red-500/15 text-red-400 border-red-500/30',
  liquidation: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  administration: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

export default function CompanyFinancialsPanel({ companyNumber }: CompanyFinancialsPanelProps) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [filing, setFiling] = useState<FilingHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!companyNumber || !expanded) return;
    if (profile) return;

    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/companies-house/profile?number=${companyNumber}`).then(r => r.ok ? r.json() : Promise.reject('Not found')),
      fetch(`/api/companies-house/filing-history?number=${companyNumber}`).then(r => r.ok ? r.json() : null),
    ])
      .then(([p, f]) => {
        setProfile(p);
        if (f) setFiling(f);
      })
      .catch((err) => setError(typeof err === 'string' ? err : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [companyNumber, expanded, profile]);

  if (!companyNumber) return null;

  const statusClass = profile?.company_status
    ? (STATUS_CLASSES[profile.company_status] ?? 'bg-slate-700 text-slate-300 border-slate-600')
    : '';

  return (
    <div className="mt-3 rounded-xl border border-slate-700/60 bg-slate-900/80 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">
            Companies House
          </span>
          {profile && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide ${statusClass}`}>
              {profile.company_status}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-800">
          {loading && (
            <div className="pt-4 flex items-center gap-2 text-slate-500 text-sm">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading company data…
            </div>
          )}

          {error && (
            <div className="pt-4 text-sm text-red-400 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {!loading && !error && profile && (
            <div className="pt-4 space-y-4">
              <div>
                <p className="text-slate-100 font-semibold text-[15px] leading-tight">{profile.company_name}</p>
                <p className="text-slate-500 text-xs mt-0.5 font-mono">{profile.company_number}</p>
                {profile.registered_office_address && (
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    {[
                      profile.registered_office_address.address_line_1,
                      profile.registered_office_address.locality,
                      profile.registered_office_address.postal_code,
                    ].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Incorporated', value: fmtDate(profile.date_of_creation) },
                  { label: 'Accounts Due', value: fmtDate(profile.accounts?.next_due) },
                  { label: 'Confirmation Due', value: fmtDate(profile.confirmation_statement?.next_due) },
                  { label: 'SIC Code', value: profile.sic_codes?.[0] ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-800/60 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">{label}</p>
                    <p className="text-slate-200 text-xs mt-0.5 font-medium">{value}</p>
                  </div>
                ))}
              </div>

              {filing?.items && filing.items.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">
                    Recent Filings
                  </p>
                  <div className="space-y-1">
                    {filing.items.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex items-start justify-between gap-2 text-xs">
                        <span className="text-slate-400 leading-relaxed flex-1 truncate">
                          {item.description || item.type}
                        </span>
                        <span className="text-slate-600 shrink-0 font-mono">{fmtDate(item.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              
                href={`https://find-and-update.company-information.service.gov.uk/company/${companyNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
              >
                View full profile on Companies House
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}