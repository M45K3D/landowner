'use client';

import { useState, useCallback } from 'react';
import SearchBar from '@/components/SearchBar';
import StatsBar from '@/components/StatsBar';
import CompanyGroup from '@/components/CompanyGroup';
import AddressResults from '@/components/AddressResults';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Property, CompanyGroupData, SearchStats } from '@/types';

const RESULT_LIMIT = 500;

type SearchMode = 'company' | 'address';

// Strip non-alphanumeric, uppercase, then remove leading zeros from purely-numeric strings.
// This merges variants like "02072876" and "2072876" into the same group.
function normaliseCompanyNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!cleaned) return null;
  if (/^\d+$/.test(cleaned)) return cleaned.replace(/^0+/, '') || cleaned;
  return cleaned;
}

export default function Home() {
  const [searchMode, setSearchMode] = useState<SearchMode>('company');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLimited, setIsLimited] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  // Company search state
  const [groups, setGroups] = useState<CompanyGroupData[]>([]);
  const [stats, setStats] = useState<SearchStats | null>(null);

  // Address search state
  const [addressProperties, setAddressProperties] = useState<Property[]>([]);
  const [addressStats, setAddressStats] = useState<SearchStats | null>(null);

  const switchMode = (mode: SearchMode) => {
    setSearchMode(mode);
    setQuery('');
    setHasSearched(false);
    setError(null);
    setGroups([]);
    setStats(null);
    setAddressProperties([]);
    setAddressStats(null);
  };

  const handleSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setLastQuery(trimmed);

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(trimmed)}&mode=${searchMode}`
      );
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);

      const properties = json.data as Property[];
      setIsLimited(json.limited);

      if (searchMode === 'address') {
        setAddressProperties(properties);
        const uniqueProprietors = new Set(
          properties.map((p) => normaliseCompanyNumber(p.company_number) ?? p.proprietor_name)
        ).size;
        setAddressStats({
          total_titles: properties.length,
          total_companies: uniqueProprietors,
          freehold_count: properties.filter((p) => p.tenure?.toLowerCase().includes('freehold')).length,
          leasehold_count: properties.filter((p) => p.tenure?.toLowerCase().includes('leasehold')).length,
        });
      } else {
        // Group by normalised company_number, fallback to proprietor_name
        type Accum = CompanyGroupData & { _counts: Record<string, number> };
        const grouped = properties.reduce<Record<string, Accum>>((acc, p) => {
          const normNum = normaliseCompanyNumber(p.company_number);
          const key = normNum ?? p.proprietor_name;
          if (!acc[key]) {
            acc[key] = { company_name: p.proprietor_name, company_number: normNum, properties: [], _counts: {} };
          }
          acc[key].properties.push(p);
          acc[key]._counts[p.proprietor_name] = (acc[key]._counts[p.proprietor_name] ?? 0) + 1;
          return acc;
        }, {});

        const sortedGroups: CompanyGroupData[] = Object.values(grouped)
          .map(({ _counts, ...group }) => ({
            ...group,
            company_name: Object.entries(_counts).sort((a, b) => b[1] - a[1])[0][0],
          }))
          .sort((a, b) => b.properties.length - a.properties.length);

        setGroups(sortedGroups);
        setStats({
          total_titles: properties.length,
          total_companies: sortedGroups.length,
          freehold_count: properties.filter((p) => p.tenure?.toLowerCase().includes('freehold')).length,
          leasehold_count: properties.filter((p) => p.tenure?.toLowerCase().includes('leasehold')).length,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setGroups([]);
      setStats(null);
      setAddressProperties([]);
      setAddressStats(null);
    } finally {
      setLoading(false);
    }
  }, [searchMode]);

  const currentStats = searchMode === 'address' ? addressStats : stats;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">LandOwner</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              HMLR CCOD · England &amp; Wales
            </span>
          </div>
        </div>
      </header>

      {/* ── Hero + Search ── */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-14 pb-10">
        <div className="text-center mb-8 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100 tracking-tight mb-4 leading-tight">
            Who owns what in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              England &amp; Wales
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">
            Search by company name or address to explore HMLR title register data.
          </p>
        </div>

        {/* Search mode tabs */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1">
            <button
              onClick={() => switchMode('company')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                searchMode === 'company'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Company Search
            </button>
            <button
              onClick={() => switchMode('address')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                searchMode === 'address'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Address / Postcode
            </button>
          </div>
        </div>

        <SearchBar
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          loading={loading}
          placeholder={
            searchMode === 'address'
              ? 'Search by address or postcode, e.g. 10 Downing Street, SW1A...'
              : 'Search by company name, e.g. Blackstone, Aviva...'
          }
        />
      </section>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pb-16">
        {/* Loading */}
        {loading && <LoadingSpinner />}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-start gap-3 bg-red-950/40 border border-red-800/60 rounded-xl p-4">
            <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-red-300 font-medium text-sm">Search failed</p>
              <p className="text-red-400/80 text-xs mt-0.5">{error}</p>
              {searchMode === 'address' && error.toLowerCase().includes('timeout') && (
                <p className="text-red-400/60 text-xs mt-1.5">
                  Address text search requires a <code className="font-mono">pg_trgm</code> GIN index on{' '}
                  <code className="font-mono">property_address</code> in Supabase. Try searching by postcode instead
                  (e.g. <em>SW1A 2AA</em>) — postcode searches are fast without extra indexes.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && !error && hasSearched && currentStats && (
          <div className="animate-fade-in">
            <StatsBar
              stats={currentStats}
              companiesLabel={searchMode === 'address' ? 'Proprietors' : 'Companies'}
            />

            {/* Company search results */}
            {searchMode === 'company' && (
              <>
                {isLimited && (
                  <div className="mb-5 flex items-center gap-2.5 bg-amber-950/40 border border-amber-800/50
                    rounded-lg px-4 py-2.5 text-amber-400 text-sm">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <span>
                      Showing the first <strong>{RESULT_LIMIT}</strong> results — try a more specific
                      company name to narrow results.
                    </span>
                  </div>
                )}

                {groups.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-900 flex items-center justify-center">
                      <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-slate-400 font-medium">No properties found</p>
                    <p className="text-slate-600 text-sm mt-1">
                      No results for &ldquo;{lastQuery}&rdquo; — check the spelling or try a broader term.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-slate-500 text-sm">
                        Found{' '}
                        <span className="text-slate-300 font-semibold">{currentStats.total_companies}</span>{' '}
                        {currentStats.total_companies === 1 ? 'company' : 'companies'} with{' '}
                        <span className="text-slate-300 font-semibold">{currentStats.total_titles.toLocaleString()}</span>{' '}
                        {currentStats.total_titles === 1 ? 'title' : 'titles'} — click a row to expand
                      </p>
                    </div>
                    <div className="space-y-3">
                      {groups.map((group) => (
                        <CompanyGroup key={group.company_number ?? group.company_name} group={group} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Address search results */}
            {searchMode === 'address' && (
              <>
                {addressProperties.length > 0 && (
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-slate-500 text-sm">
                      Found{' '}
                      <span className="text-slate-300 font-semibold">{currentStats.total_titles.toLocaleString()}</span>{' '}
                      {currentStats.total_titles === 1 ? 'title' : 'titles'} matching{' '}
                      &ldquo;{lastQuery}&rdquo;
                    </p>
                  </div>
                )}
                <AddressResults
                  properties={addressProperties}
                  lastQuery={lastQuery}
                  isLimited={isLimited}
                  limit={RESULT_LIMIT}
                />
              </>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && !hasSearched && (
          <div className="text-center py-24">
            <div className="inline-flex flex-col items-center gap-4 text-slate-600">
              <div className="grid grid-cols-3 gap-2 opacity-30">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-12 h-8 bg-slate-800 rounded"
                    style={{ opacity: 0.3 + (i % 3) * 0.2 }}
                  />
                ))}
              </div>
              <p className="text-slate-500 text-sm mt-2">
                {searchMode === 'address'
                  ? 'Enter an address or postcode above to begin searching'
                  : 'Enter a company name above to begin searching'}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/80 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-600/20 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="font-medium text-slate-500">LandOwner</span>
            </div>
            <p>
              Data sourced from{' '}
              <a
                href="https://use-land-property-data.service.gov.uk/datasets/ccod"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-slate-400 underline underline-offset-2"
              >
                HM Land Registry CCOD
              </a>{' '}
              · Not affiliated with HMLR · Personal use only
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
