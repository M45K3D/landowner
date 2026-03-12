import { Property } from '@/types';

export function TenureBadge({ tenure }: { tenure: string | null }) {
  if (!tenure) return null;
  const t = tenure.toLowerCase();
  if (t.includes('freehold')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
        bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 whitespace-nowrap">
        Freehold
      </span>
    );
  }
  if (t.includes('leasehold')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
        bg-amber-900/60 text-amber-300 border border-amber-800/60 whitespace-nowrap">
        Leasehold
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
      bg-slate-700 text-slate-300 border border-slate-600 whitespace-nowrap">
      {tenure}
    </span>
  );
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    // Handle DD/MM/YYYY format common in HMLR datasets
    const ddmmyyyy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, dd, mm, yyyy] = ddmmyyyy;
      const d = new Date(`${yyyy}-${mm}-${dd}`);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function hmlrUrl(titleNumber: string): string {
  return `https://eservices.landregistry.gov.uk/eservices/FindAProperty/view/QuickEnquiryInit.do?reference=${encodeURIComponent(titleNumber)}`;
}

interface PropertyCardProps {
  property: Property;
}

// Mobile card layout only — desktop table rows are rendered in CompanyGroup
export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-slate-200 text-sm font-medium leading-snug">
          {property.property_address || '—'}
        </p>
        <TenureBadge tenure={property.tenure} />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        {property.postcode && (
          <span className="font-mono bg-slate-700/60 px-1.5 py-0.5 rounded text-slate-300">
            {property.postcode}
          </span>
        )}
        <span>
          <span className="text-slate-600">Title: </span>
          <span className="font-mono text-slate-300">{property.title_number}</span>
        </span>
        <span>
          <span className="text-slate-600">Registered: </span>
          {formatDate(property.date_added)}
        </span>
      </div>

      <a
        href={hmlrUrl(property.title_number)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
      >
        View on HMLR
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}
