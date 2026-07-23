'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface NivlItem {
  id: string;
  title: string;
  description?: string;
  sourceUrl?: string;
  thumbnailUrl?: string;
  dateCreated?: string;
  center?: string;
  keywords?: string[];
}

interface ApodData {
  bgUrl: string | null;
  title?: string;
}

const presets = [
  { label: 'Nebulae', query: 'nebula' },
  { label: 'James Webb', query: 'webb' },
  { label: 'Hubble Space Telescope', query: 'hubble' },
  { label: 'Apollo Missions', query: 'apollo' },
  { label: 'Mars Rovers', query: 'mars' },
  { label: 'Planets', query: 'jupiter saturn' },
];

export default function GalleryPage() {
  const [mounted, setMounted] = useState(false);
  const [systemTime, setSystemTime] = useState('');
  const [apod, setApod] = useState<ApodData | null>(null);

  // Search and browse states
  const [query, setQuery] = useState('nebula');
  const [searchVal, setSearchVal] = useState('');
  const [results, setResults] = useState<NivlItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected item for modal/inspection mode
  const [selectedItem, setSelectedItem] = useState<NivlItem | null>(null);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setSystemTime(new Date().toISOString().slice(11, 19));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch background APOD
  useEffect(() => {
    fetch('/api/apod')
      .then((res) => res.json())
      .then((data) => setApod(data))
      .catch(() => {});
  }, []);

  // Fetch search results from NASA
  const fetchResults = async (searchQuery: string, currentPage: number) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/search-nasa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          page: currentPage,
          limit: 12,
        }),
      });

      if (!response.ok) {
        throw new Error('Telemetry link failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('[gallery-fetch] Failed:', err);
      setErrorMsg('Failed to establish satellite uplink with NASA catalog database.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on query or page change
  useEffect(() => {
    if (mounted) {
      fetchResults(query, page);
    }
  }, [query, page, mounted]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    setQuery(searchVal);
    setPage(1);
  };

  const handlePresetClick = (q: string) => {
    setQuery(q);
    setSearchVal(q);
    setPage(1);
  };

  const handleNextPage = () => {
    setPage((p) => p + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((p) => p - 1);
    }
  };

  // Convert thumbnail to larger resolution
  const getMediumResUrl = (thumbUrl?: string) => {
    if (!thumbUrl) return '';
    return thumbUrl.replace('~thumb', '~medium').replace('~small', '~medium');
  };

  const currentBgUrl = apod?.bgUrl || 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048';

  return (
    <div
      className="relative min-h-[calc(100vh-135px)] text-slate-100 font-hanken overflow-hidden bg-slate-950 flex flex-col pt-0 pb-6"
      style={{
        backgroundImage: `radial-gradient(ellipse at center, rgba(15, 23, 42, 0.85), rgba(8, 10, 22, 0.95)), url(${currentBgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Decorative Grid Scanlines */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,24,38,0)_95%,rgba(168,85,247,0.012)_95%),linear-gradient(90deg,rgba(18,24,38,0)_95%,rgba(168,85,247,0.012)_95%)] bg-[size:30px_30px]" />

      <section className="relative z-10 max-w-7xl w-full mx-auto px-3 sm:px-4 md:px-6 flex-1 flex flex-col justify-start">
        <div className="grid lg:grid-cols-12 gap-4 items-stretch mt-3 md:mt-5">
          
          {/* LEFT COLUMN: Controls & Presets */}
          <div className="lg:col-span-3">
            <div className="bg-slate-950/70 border border-white/10 rounded-xl p-3.5 sm:p-4 backdrop-blur-md h-full flex flex-col justify-between space-y-4">
              
              <div className="space-y-4">
                <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase block border-b border-white/10 pb-2">
                  Astrometrics Catalog
                </span>
                
                <h1 className="text-xl font-bold tracking-wider font-fraunces text-white">
                  NASA Image Vault
                </h1>
                
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Query the official NASA Image Library directly. Search for nebulae, space missions, rovers, or planets.
                </p>

                {/* Search Input */}
                <form onSubmit={handleSearchSubmit} className="space-y-2 pt-2">
                  <input
                    type="text"
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="Search term (e.g. saturn)..."
                    className="w-full bg-slate-900/60 border border-white/10 focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/25 rounded px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    RUN SCAN
                  </button>
                </form>
              </div>

              {/* Presets */}
              <div className="space-y-2 border-t border-white/10 pt-4">
                <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase block mb-2">
                  Telemetry Presets
                </span>
                <div className="grid grid-cols-1 gap-1">
                  {presets.map((preset) => (
                    <button
                      key={preset.query}
                      onClick={() => handlePresetClick(preset.query)}
                      className={`text-left px-3 py-1.5 rounded text-[11px] font-mono transition-all border cursor-pointer ${
                        query === preset.query
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 font-bold'
                          : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status and Clock */}
              <div className="space-y-3">
                <div className="bg-slate-900/40 border border-white/5 rounded p-3 text-[9px] font-mono text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>SYSTEM_TIME:</span>
                    <span className="text-slate-400">UTC {systemTime || '--:--:--'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>UPLINK:</span>
                    <span className={errorMsg ? 'text-red-400' : 'text-emerald-400'}>
                      {errorMsg ? 'DISRUPTED' : 'ALIGNED'}
                    </span>
                  </div>
                </div>

                <Link
                  href="/"
                  className="w-full text-center block py-2 bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded text-[10px] font-mono tracking-widest cursor-pointer transition-all"
                >
                  Return to Dashboard
                </Link>
              </div>

            </div>
          </div>

          {/* MAIN RESULTS GRID */}
          <div className="lg:col-span-9">
            <div className="bg-slate-950/70 border border-white/10 rounded-xl p-3.5 sm:p-4 backdrop-blur-md h-full flex flex-col justify-between space-y-3.5">
              
              <div className="space-y-4 flex-1">
                {/* Grid Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                    Scanner Grid // Active Query: &quot;{query}&quot;
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">Page: {page}</span>
                </div>

                {/* Loading / Error states */}
                {loading ? (
                  <div className="h-96 flex flex-col items-center justify-center space-y-3">
                    <div className="w-10 h-10 border-2 border-dashed border-purple-500 rounded-full animate-spin" />
                    <span className="text-xs font-mono text-slate-500 animate-pulse">COMPILING TELESCOPE FEED...</span>
                  </div>
                ) : errorMsg ? (
                  <div className="h-96 flex items-center justify-center text-center">
                    <p className="text-xs font-mono text-red-400">{errorMsg}</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="h-96 flex items-center justify-center text-center">
                    <p className="text-xs font-mono text-slate-500">NO TELEMETRY DETECTED FOR CURRENT GRID SETTINGS.</p>
                  </div>
                ) : (
                  // Grid List
                  <div className="grid md:grid-cols-3 gap-4">
                    {results.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="bg-slate-900/30 border border-white/10 hover:border-purple-500/30 rounded-lg overflow-hidden backdrop-blur-sm group cursor-pointer transition-all duration-300"
                      >
                        {/* Image Frame */}
                        <div className="aspect-video relative overflow-hidden bg-slate-950 border-b border-white/5">
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600 font-mono">
                              NO_PREVIEW
                            </div>
                          )}
                          <div className="absolute top-1.5 left-1.5 bg-slate-950/80 border border-white/10 rounded px-1 text-[8px] font-mono text-purple-300">
                            NASA_ID: {item.id}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-3 space-y-1.5">
                          <h3 className="text-xs font-bold text-white tracking-wide truncate font-fraunces">
                            {item.title}
                          </h3>
                          <div className="flex justify-between text-[8px] font-mono text-slate-500">
                            <span>CENTER: {item.center || 'NASA'}</span>
                            <span>{item.dateCreated ? item.dateCreated.slice(0, 10) : ''}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination controls */}
              {!loading && results.length > 0 && (
                <div className="flex justify-between items-center border-t border-white/10 pt-4 font-mono text-xs">
                  <button
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    className="px-4 py-2 border border-white/10 rounded hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900/40 transition-all cursor-pointer"
                  >
                    Previous Page
                  </button>
                  <span className="text-slate-500 text-[10px]">Page {page}</span>
                  <button
                    onClick={handleNextPage}
                    className="px-4 py-2 border border-white/10 rounded hover:border-white/20 hover:bg-slate-900/40 transition-all cursor-pointer"
                  >
                    Next Page
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* INTEGRATED LIGHTBOX & READER MODAL */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-4 sm:p-6 flex justify-center items-start"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl shadow-[0_0_50px_rgba(168,85,247,0.15)] my-4 sm:my-12 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE X BUTTON */}
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-colors backdrop-blur-md cursor-pointer"
            >
              ✕
            </button>

            {/* HEADER */}
            <div className="px-6 py-8 md:px-12 md:py-10 border-b border-white/5 bg-slate-950/30">
              <span className="text-xs font-mono text-purple-400 tracking-widest uppercase">NASA ID: {selectedItem.id}</span>
              <h1 className="text-3xl md:text-5xl font-bold font-fraunces text-white leading-tight mt-4">
                {selectedItem.title}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-sm font-mono text-slate-500 pt-6">
                <div className="flex items-center gap-4">
                  <span>{selectedItem.center || 'NASA'}</span>
                  <span>•</span>
                  <span>{selectedItem.dateCreated ? selectedItem.dateCreated.slice(0, 10) : ''}</span>
                </div>
                {selectedItem.keywords && selectedItem.keywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedItem.keywords.slice(0, 8).map((kw) => (
                      <span key={kw} className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px]">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* IMAGE */}
            <div className="bg-slate-950 flex justify-center border-b border-white/5">
              <img
                src={getMediumResUrl(selectedItem.thumbnailUrl)}
                alt={selectedItem.title}
                onError={(e) => {
                  if (selectedItem.thumbnailUrl && e.currentTarget.src !== selectedItem.thumbnailUrl) {
                    e.currentTarget.src = selectedItem.thumbnailUrl;
                  }
                }}
                className="w-full max-h-[70vh] object-contain"
              />
            </div>

            {/* DESCRIPTION */}
            <div className="px-6 py-8 md:px-12 md:py-12">
               <div className="font-hanken text-base md:text-lg text-slate-300 leading-relaxed md:leading-[1.8] space-y-6 md:space-y-8 font-light tracking-wide">
                 {selectedItem.description ? (
                   selectedItem.description.split('\n').filter(p => p.trim() !== '').map((paragraph, i) => {
                     // Regex to detect URLs
                     const parts = paragraph.split(/(https?:\/\/[^\s]+)/g);
                     return (
                       <p key={i} className={i === 0 ? "text-lg md:text-xl text-slate-200" : ""}>
                         {parts.map((part, j) => 
                           part.match(/^https?:\/\//) ? (
                             <a 
                               key={j} 
                               href={part} 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="text-purple-400 hover:text-purple-300 underline underline-offset-4 decoration-purple-500/40 hover:decoration-purple-400 transition-colors font-mono text-sm md:text-base break-all"
                             >
                               {part}
                             </a>
                           ) : (
                             <span key={j}>{part}</span>
                           )
                         )}
                       </p>
                     );
                   })
                 ) : (
                   <p className="italic opacity-50">No narrative logged.</p>
                 )}
               </div>

               <div className="mt-12 pt-8 border-t border-white/10 flex flex-col items-center">
                  <a
                    href={`https://images.nasa.gov/details-${selectedItem.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded text-xs font-mono font-bold transition-all w-full sm:w-auto text-center"
                  >
                    VIEW ORIGINAL ON NASA ARCHIVE
                  </a>
               </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
