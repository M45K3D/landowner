'use client';

import { useRef, KeyboardEvent } from 'react';

interface SearchBarProps {
  query: string;
  setQuery: (q: string) => void;
  onSearch: (q: string) => void;
  loading: boolean;
  placeholder?: string;
}

export default function SearchBar({ query, setQuery, onSearch, loading, placeholder = 'Search by company name, e.g. Blackstone, Aviva...' }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      onSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative flex items-center gap-3">
        {/* Search icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <svg
            className="w-5 h-5 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-11 pr-10 py-4 bg-slate-900 border border-slate-700 rounded-xl
            text-slate-100 placeholder-slate-500 text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-all duration-200"
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-[7.5rem] top-1/2 -translate-y-1/2 p-1 text-slate-500
              hover:text-slate-300 transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Search button */}
        <button
          onClick={() => onSearch(query)}
          disabled={loading || query.trim().length < 2}
          className="shrink-0 px-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700
            disabled:text-slate-500 text-white font-semibold rounded-xl
            transition-all duration-200 flex items-center gap-2 min-w-[110px] justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Searching</span>
            </>
          ) : (
            <span>Search</span>
          )}
        </button>
      </div>

      <p className="mt-3 text-center text-slate-600 text-xs">
        Searches HMLR Commercial &amp; Corporate Ownership Data (CCOD) for England &amp; Wales
      </p>
    </div>
  );
}
