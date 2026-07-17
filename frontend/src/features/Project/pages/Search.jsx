import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { searchVideos } from "../services/ytapi.service";
import { ShieldCheck, ShieldAlert, Eye, Clock, Search as SearchIcon, SlidersHorizontal, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const formatTimeAgo = (date) => {
  if (!date) return "just now";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = { year: 31536000, month: 2592000, day: 86400, hour: 3600, minute: 60 };
  for (let key in intervals) {
    const value = Math.floor(seconds / intervals[key]);
    if (value >= 1) return `${value} ${key}${value > 1 ? "s" : ""} ago`;
  }
  return "just now";
};

const formatViews = (n = 0) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return `${n}`;
};

const formatDuration = (d) =>
  d ? `${Math.floor(d / 60)}:${Math.floor(d % 60).toString().padStart(2, '0')}` : "0:00";

const SORT_OPTIONS = [
  { key: "relevance", label: "Relevance" },
  { key: "recent", label: "Newest" },
  { key: "views", label: "Most Viewed" },
];

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sort, setSort] = useState("relevance");

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(false);
      try {
        const res = await searchVideos(query);
        setResults(res.data?.videos || []);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  const sortedResults = [...results].sort((a, b) => {
    if (sort === "recent") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === "views") return (b.views || 0) - (a.views || 0);
    return 0; // relevance = API order
  });

  // ── EMPTY QUERY ─────────────────────────────
  if (!query) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-10 py-40 text-center">
        <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-border-main flex items-center justify-center mx-auto mb-8">
          <SearchIcon size={30} className="text-brand-orange" />
        </div>
        <h3 className="text-2xl font-display font-black text-text-main uppercase tracking-tight">Search the Network</h3>
        <p className="text-sm text-text-muted max-w-xs mx-auto mt-3">Use the search bar above to find broadcasts, creators, and signals.</p>
      </div>
    );
  }

  // ── LOADING ─────────────────────────────
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <div className="mb-10 h-16 bg-white/[0.02] border border-border-main rounded-2xl animate-pulse" />
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col md:flex-row gap-6 animate-pulse">
              <div className="w-full md:w-80 aspect-video bg-surface-low rounded-2xl border border-border-main" />
              <div className="flex-1 space-y-4 py-2">
                <div className="h-5 bg-surface-low rounded w-3/4" />
                <div className="h-3 bg-surface-low rounded w-1/3" />
                <div className="h-3 bg-surface-low rounded w-full" />
                <div className="h-3 bg-surface-low rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">

      {/* ═══════════ HEADER ═══════════ */}
      <div className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-border-main pb-8">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-brand-orange/10 rounded-2xl border border-brand-orange/20">
            <SearchIcon size={22} className="text-brand-orange" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-orange mb-1">Intelligence Search</p>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-text-main tracking-tight leading-none">
              {error ? "Search Failed" : (
                <>
                  {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
                  <span className="text-brand-orange">"{query}"</span>
                </>
              )}
            </h1>
          </div>
        </div>

        {/* SORT CONTROLS */}
        {!error && results.length > 0 && (
          <div className="flex items-center gap-2 bg-white/[0.02] border border-border-main rounded-2xl p-1.5">
            <SlidersHorizontal size={13} className="text-text-muted ml-2" />
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  sort === opt.key
                    ? "bg-brand-orange text-white shadow-md"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════ RESULTS ═══════════ */}
      <div className="space-y-4">
        {error ? (
          <div className="py-24 text-center bg-brand-red/[0.03] border border-brand-red/10 rounded-[2rem]">
            <ShieldAlert size={44} className="mx-auto text-brand-red/50 mb-4" />
            <h3 className="text-lg font-display font-black text-text-main">Signal Lost</h3>
            <p className="text-sm text-text-muted max-w-xs mx-auto mt-2">Couldn't complete the search. Try again in a moment.</p>
          </div>
        ) : sortedResults.length > 0 ? (
          <AnimatePresence>
            {sortedResults.map((video, i) => (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                key={video._id}
                className="group flex flex-col md:flex-row gap-5 p-3 sm:p-4 rounded-3xl border border-transparent hover:border-border-main hover:bg-white/[0.015] transition-all duration-300"
              >
                <Link to={`/video/${video._id}`} className="w-full md:w-80 shrink-0">
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-surface-low border border-border-main shadow-sm group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] group-hover:border-brand-orange/20 transition-all duration-500">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-black/70 border border-white/10 flex items-center justify-center scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                        <Play size={18} className="text-brand-orange fill-brand-orange ml-0.5" />
                      </div>
                    </div>

                    <div className="absolute top-2.5 left-2.5 z-10">
                      {video.verification?.finalVerdict === "TRUE" ? (
                        <div className="bg-black/80 backdrop-blur-md px-2 py-1 rounded-full border border-brand-green/30 shadow-sm flex items-center gap-1.5">
                          <ShieldCheck className="w-3 h-3 text-brand-green" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-white">Verified</span>
                        </div>
                      ) : video.deepfakeScore > 0.5 ? (
                        <div className="bg-brand-red/90 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                          <ShieldAlert className="w-3 h-3 text-white" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-white">Flagged</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 bg-black/80 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">
                      {formatDuration(video.duration)}
                    </div>
                  </div>
                </Link>

                <div className="flex-1 py-1 min-w-0">
                  <Link to={`/video/${video._id}`}>
                    <h2 className="text-base sm:text-lg font-display font-black text-text-main leading-snug group-hover:text-brand-orange transition-colors line-clamp-2">
                      {video.title}
                    </h2>
                  </Link>

                  <div className="mt-2.5 flex items-center gap-2.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Eye size={12} className="text-brand-orange/60" /> {formatViews(video.views)} views</span>
                    <span className="w-1 h-1 rounded-full bg-white/15" />
                    <span className="flex items-center gap-1.5"><Clock size={12} className="text-brand-orange/60" /> {formatTimeAgo(video.createdAt)}</span>
                  </div>

                  <div className="mt-3.5 flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-surface-low border border-border-main overflow-hidden shrink-0">
                      {video.channel?.avatar && (
                        <img src={video.channel.avatar} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-text-muted hover:text-text-main transition-colors">
                      {video.channel?.name || "The Curator"}
                    </span>
                  </div>

                  <p className="mt-3.5 text-xs text-text-muted line-clamp-2 leading-relaxed font-medium max-w-2xl">
                    {video.description || "No editorial description available for this content signal."}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="py-24 text-center bg-white/[0.015] border border-dashed border-white/10 rounded-[2rem]">
            <SearchIcon size={44} className="mx-auto text-white/10 mb-4" />
            <h3 className="text-lg font-display font-black text-text-main">No Signals Detected</h3>
            <p className="text-sm text-text-muted max-w-xs mx-auto mt-2">The curator couldn't find any content matching your search query.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;