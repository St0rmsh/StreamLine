import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { searchVideos } from "../services/ytapi.service";
import { ShieldCheck, Eye, Clock, Search as SearchIcon } from "lucide-react";
import { motion } from "framer-motion";

const formatTimeAgo = (date) => {
  if (!date) return "just now";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60
  };
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

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  if (!query) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-10 py-32 text-center">
        <SearchIcon size={48} className="mx-auto text-white/10 mb-4" />
        <h3 className="text-lg font-display font-black text-text-main">Enter a search query</h3>
        <p className="text-sm text-text-muted max-w-xs mx-auto mt-2">Use the search bar above to find content.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col md:flex-row gap-6 animate-pulse">
            <div className="w-full md:w-80 aspect-video bg-surface-low rounded-2xl"></div>
            <div className="flex-1 space-y-4 py-2">
              <div className="h-4 bg-surface-low rounded w-3/4"></div>
              <div className="h-3 bg-surface-low rounded w-1/2"></div>
              <div className="h-3 bg-surface-low rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10">
      <div className="mb-10 flex items-center gap-4">
        <div className="p-3 bg-surface-low rounded-2xl border border-border-main">
          <SearchIcon size={20} className="text-brand-earth" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-black text-text-main tracking-tight">Intelligence Search</h1>
          <p className="text-sm text-text-muted">
            {error ? "Search failed" : `${results.length} result${results.length !== 1 ? "s" : ""} for `}
            {!error && <span className="text-text-main font-bold">"{query}"</span>}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {error ? (
          <div className="py-20 text-center">
            <SearchIcon size={48} className="mx-auto text-white/10 mb-4" />
            <h3 className="text-lg font-display font-black text-text-main">Signal Lost</h3>
            <p className="text-sm text-text-muted max-w-xs mx-auto mt-2">Couldn't complete the search. Try again in a moment.</p>
          </div>
        ) : results.length > 0 ? (
          results.map((video) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={video._id}
              className="flex flex-col md:flex-row gap-6 group"
            >
              <Link to={`/video/${video._id}`} className="w-full md:w-80 shrink-0">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-surface-low border border-border-main">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 z-10">
                    {video.verification?.finalVerdict === "TRUE" && (
                      <div className="bg-black/80 backdrop-blur-md p-1 rounded-full border border-brand-green/30 shadow-sm">
                        <ShieldCheck className="w-3 h-3 text-brand-green" />
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                    {video.duration ? `${Math.floor(video.duration / 60)}:${Math.floor(video.duration % 60).toString().padStart(2, '0')}` : "0:00"}
                  </div>
                </div>
              </Link>

              <div className="flex-1 py-1">
                <Link to={`/video/${video._id}`}>
                  <h2 className="text-lg font-display font-bold text-text-main leading-tight hover:text-brand-orange transition-colors line-clamp-2">
                    {video.title}
                  </h2>
                </Link>
                <div className="mt-2 flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-tighter">
                  <span className="flex items-center gap-1"><Eye size={12} /> {formatViews(video.views)}</span>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span className="flex items-center gap-1"><Clock size={12} /> {formatTimeAgo(video.createdAt)}</span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-surface-low border border-border-main overflow-hidden shrink-0">
                    {video.channel?.avatar && (
                      <img src={video.channel.avatar} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-text-muted hover:text-text-main transition-colors">
                    {video.channel?.name || "The Curator"}
                  </span>
                </div>

                <p className="mt-4 text-xs text-text-muted line-clamp-2 leading-relaxed font-medium">
                  {video.description || "No editorial description available for this content signal."}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center">
            <SearchIcon size={48} className="mx-auto text-white/10 mb-4" />
            <h3 className="text-lg font-display font-black text-text-main">No Signals Detected</h3>
            <p className="text-sm text-text-muted max-w-xs mx-auto mt-2">The curator couldn't find any content matching your search query.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;