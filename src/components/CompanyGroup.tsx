'use client';

import { useState } from 'react';
import { CompanyGroupData } from '@/types';
import PropertyCard, { TenureBadge, formatDate, hmlrUrl } from './PropertyCard';

interface CompanyGroupProps {
  group: CompanyGroupData;
}

// Format for display and CH links — zero-pad purely numeric numbers to 8 digits (UK standard)
function formatCompanyNumber(companyNumber: string | null): string | null {
  if (!companyNumber) return null;
  const cleaned = companyNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!cleaned) return null;
  return /^\d+$/.test(cleaned) ? cleaned.padStart(8, '0') : cleaned;
}

function companiesHouseUrl(companyNumber: string | null): string | null {
  const formatted = formatCompanyNumber(companyNumber);
  if (!formatted) return null;
  return `https://find-and-update.company-information.service.gov.uk/company/${formatted}`;
}

export default function CompanyGroup({ group }: CompanyGroupProps) {
  const [expanded, setExpanded] = useState(false);

  const freeholdCount = group.properties.filter(p =>
    p.tenure?.toLowerCase().includes('freehold')
  ).length;
  const leaseholdCount = group.properties.filter(p =>
    p.tenure?.toLowerCase().includes('leasehold')
  ).length;

  const chUrl = companiesHouseUrl(group.company_number);
  const propertyCount = group.properties.length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-fade-in">
      {/* Company header — clickable to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4
          hover:bg-slate-800/50 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="text-base font-semibold text-slate-100 truncate">
              {group.company_name}
            </h3>
            {group.company_number && (
              <a
                href={chUrl ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400
                  bg-slate-800 border border-slate-700 px-2 py-0.5 rounded transition-colors"
                title="View on Companies House"
              >
                #{formatCompanyNumber(group.company_number)}
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>

          {/* Mini stats row */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-400">
              <span className="font-semibold text-slate-200">{propertyCount}</span>{' '}
              {propertyCount === 1 ? 'title' : 'titles'}
            </span>
            {freeholdCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {freeholdCount} freehold
              </span>
            )}
            {leaseholdCount > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                {leaseholdCount} leasehold
              </span>
            )}
            {freeholdCount + leaseholdCount < propertyCount && (
              <span className="text-slate-500">
                {propertyCount - freeholdCount - leaseholdCount} other
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <div className={`shrink-0 mt-0.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Properties panel */}
      {expanded && (
        <div className="border-t border-slate-800">
          {/* Desktop: proper <table> with <tr><td> rows — no divs inside tbody */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Address</th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Postcode</th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Tenure</th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Title No.</th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Registered</th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Link</th>
                </tr>
              </thead>
              <tbody>
                {group.properties.map((p) => (
                  <tr key={p.id}
                    className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3 px-4 text-sm text-slate-300 max-w-xs">
                      <span className="block truncate" title={p.property_address || undefined}>
                        {p.property_address || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {p.postcode
                        ? <span className="font-mono text-xs bg-slate-700/60 text-slate-300 px-1.5 py-0.5 rounded">{p.postcode}</span>
                        : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-3 px-4"><TenureBadge tenure={p.tenure} /></td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">{p.title_number}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">{formatDate(p.date_added)}</td>
                    <td className="py-3 px-4">
                      <a href={hmlrUrl(p.title_number)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300
                          transition-colors"
                        aria-label={`View title ${p.title_number} on HMLR`}>
                        HMLR
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: plain div list — no table markup */}
          <div className="md:hidden p-3 space-y-2">
            {group.properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
