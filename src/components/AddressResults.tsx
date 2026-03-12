import { Property } from '@/types';
import { TenureBadge, formatDate, hmlrUrl } from './PropertyCard';

interface AddressResultsProps {
  properties: Property[];
  lastQuery: string;
  isLimited: boolean;
  limit: number;
}

function formatCompanyNumber(num: string | null): string | null {
  if (!num) return null;
  const cleaned = num.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!cleaned) return null;
  return /^\d+$/.test(cleaned) ? cleaned.padStart(8, '0') : cleaned;
}

function chUrl(companyNumber: string | null): string | null {
  const fmt = formatCompanyNumber(companyNumber);
  if (!fmt) return null;
  return `https://find-and-update.company-information.service.gov.uk/company/${fmt}`;
}

function ProprietorCell({ name, companyNumber }: { name: string; companyNumber: string | null }) {
  const url = chUrl(companyNumber);
  const fmtNum = formatCompanyNumber(companyNumber);
  return (
    <div className="min-w-0">
      <p className="text-slate-200 text-sm truncate" title={name}>{name}</p>
      {url && fmtNum && (
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400 transition-colors mt-0.5">
          #{fmtNum}
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}
    </div>
  );
}

export default function AddressResults({ properties, lastQuery, isLimited, limit }: AddressResultsProps) {
  if (properties.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-900 flex items-center justify-center">
          <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-slate-400 font-medium">No properties found</p>
        <p className="text-slate-600 text-sm mt-1">
          No results for &ldquo;{lastQuery}&rdquo; — try a different address or postcode.
        </p>
      </div>
    );
  }

  return (
    <>
      {isLimited && (
        <div className="mb-5 flex items-center gap-2.5 bg-amber-950/40 border border-amber-800/50
          rounded-lg px-4 py-2.5 text-amber-400 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span>Showing the first <strong>{limit}</strong> results — try a more specific address.</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="py-2.5 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Address</th>
                <th className="py-2.5 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Postcode</th>
                <th className="py-2.5 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Tenure</th>
                <th className="py-2.5 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Title No.</th>
                <th className="py-2.5 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Registered</th>
                <th className="py-2.5 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Proprietor</th>
                <th className="py-2.5 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Link</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors last:border-0">
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
                    <ProprietorCell name={p.proprietor_name} companyNumber={p.company_number} />
                  </td>
                  <td className="py-3 px-4">
                    <a href={hmlrUrl(p.title_number)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
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

        {/* Mobile card list */}
        <div className="md:hidden p-3 space-y-2">
          {properties.map((p) => (
            <div key={p.id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-slate-200 text-sm font-medium leading-snug">
                  {p.property_address || '—'}
                </p>
                <TenureBadge tenure={p.tenure} />
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                {p.postcode && (
                  <span className="font-mono bg-slate-700/60 px-1.5 py-0.5 rounded text-slate-300">
                    {p.postcode}
                  </span>
                )}
                <span>
                  <span className="text-slate-600">Title: </span>
                  <span className="font-mono text-slate-300">{p.title_number}</span>
                </span>
                <span>
                  <span className="text-slate-600">Registered: </span>
                  {formatDate(p.date_added)}
                </span>
              </div>

              <div className="text-xs text-slate-400">
                <span className="text-slate-600">Owner: </span>
                <ProprietorCell name={p.proprietor_name} companyNumber={p.company_number} />
              </div>

              <a href={hmlrUrl(p.title_number)} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                View on HMLR
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
