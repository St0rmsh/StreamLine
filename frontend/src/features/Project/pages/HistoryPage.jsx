import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWatchHistory, clearWatchHistory, removeWatchHistoryEntry } from "../services/ytapi.service";
import { History, Trash2, X, Play, Eye } from "lucide-react";
import { toast } from "react-hot-toast";
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

const formatDuration = (t) => {
  if (!t) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getWatchHistory();
      setHistory(res.data.history || []);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleClear = async () => {
    const tid = toast.loading("Clearing history...");
    try {
      await clearWatchHistory();
      setHistory([]);
      toast.success("History cleared", { id: tid });
    } catch (err) {
      toast.error("Failed to clear history", { id: tid });
    } finally {
      setConfirmClear(false);
    }
  };

  const handleRemoveEntry = async (entryId) => {
    const prev = history;
    setHistory((h) => h.filter((e) => e._id !== entryId)); // optimistic
    try {
      await removeWatchHistoryEntry(entryId);
    } catch (err) {
      setHistory(prev); // revert on failure
      toast.error("Failed to remove entry");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
      <div className="mb-10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-surface-low rounded-2xl border border-border-main">
            <History size={20} className="text-brand-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-text-main tracking-tight">Watch History</h1>
            <p className="text-sm text-text-muted">Signals you've engaged with</p>
          </div>
        </div>

        {history.length > 0 && (
          confirmClear ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-brand-red">Clear all history?</span>
              <button onClick={() => setConfirmClear(false)} className="text-xs font-bold text-text-muted hover:text-text-main">Cancel</button>
              <button onClick={handleClear} className="text-xs font-bold text-white bg-brand-red px-4 py-2 rounded-xl hover:bg-brand-red/80 transition-colors">Confirm</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-brand-red transition-colors px-4 py-2 rounded-xl hover:bg-brand-red/10"
            >
              <Trash2 size={14} /> Clear History
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-40 aspect-video bg-surface-low rounded-xl shrink-0" />
              <div className="flex-1 space-y-2 py-2">
                <div className="h-4 bg-surface-low rounded w-2/3" />
                <div className="h-3 bg-surface-low rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <History size={48} className="text-white/10 mb-4" />
          <p className="text-lg font-display font-black text-text-main">Signal Lost</p>
          <p className="text-sm text-text-muted mt-2 max-w-xs">Couldn't load your watch history. Try again shortly.</p>
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 rounded-3xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-6">
            <Play className="w-10 h-10 text-brand-orange" />
          </div>
          <p className="text-xl font-display font-black text-text-main">No Watch History</p>
          <p className="text-sm text-text-muted mt-2 max-w-xs">Videos you watch will show up here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {history.map((entry) => {
              const v = entry.video;
              const progressPercent = v.duration > 0 ? Math.min(100, (entry.progress / v.duration) * 100) : 0;
              return (
                <motion.div
                  key={entry._id}
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="flex gap-4 group p-2 rounded-2xl hover:bg-surface-low transition-colors"
                >
                  <Link to={`/video/${v._id}`} className="w-40 shrink-0 relative aspect-video rounded-xl overflow-hidden bg-surface-low border border-border-main">
                    <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                      {formatDuration(v.duration)}
                    </div>
                    {progressPercent > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                        <div className="h-full bg-brand-orange" style={{ width: `${progressPercent}%` }} />
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0 py-1">
                    <Link to={`/video/${v._id}`}>
                      <h3 className="font-bold text-sm text-text-main line-clamp-2 hover:text-brand-orange transition-colors">
                        {v.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-text-muted mt-1">{v.channel?.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                      <span className="flex items-center gap-1"><Eye size={10} /> {v.views || 0}</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
                      <span>Watched {formatTimeAgo(entry.lastUpdated)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveEntry(entry._id)}
                    className="opacity-0 group-hover:opacity-100 self-start p-2 text-text-muted hover:text-brand-red transition-all"
                    title="Remove from history"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;