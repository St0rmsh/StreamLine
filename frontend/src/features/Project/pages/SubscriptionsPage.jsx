import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSubscriptionsFeed } from "../services/ytapi.service";
import VideoCard from "../components/video/VideoCard";
import SkeletonCard from "../components/video/SkeletonCard";
import { PlayCircle, Compass } from "lucide-react";

const SubscriptionsPage = () => {
  const [videos, setVideos] = useState([]);
  const [hasSubscriptions, setHasSubscriptions] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await getSubscriptionsFeed();
        setVideos(res.data.videos || []);
        setHasSubscriptions(res.data.hasSubscriptions !== false);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="max-w-[2200px] mx-auto px-4 sm:px-10 lg:px-12 py-8 sm:py-12">
      <div className="mb-10 flex items-center gap-4">
        <div className="p-3 bg-surface-low rounded-2xl border border-border-main">
          <PlayCircle size={20} className="text-brand-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-black text-text-main tracking-tight">Subscriptions</h1>
          <p className="text-sm text-text-muted">Recent broadcasts from channels you follow</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-x-6 gap-y-12 sm:gap-x-8 sm:gap-y-16 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <PlayCircle size={48} className="text-white/10 mb-4" />
          <p className="text-lg font-display font-black text-text-main">Signal Lost</p>
          <p className="text-sm text-text-muted mt-2 max-w-xs">Couldn't load your subscriptions feed. Try again shortly.</p>
        </div>
      ) : !hasSubscriptions ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 rounded-3xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-6">
            <Compass className="w-10 h-10 text-brand-orange" />
          </div>
          <p className="text-xl font-display font-black text-text-main">No Subscriptions Yet</p>
          <p className="text-sm text-text-muted mt-2 max-w-xs">Follow channels to see their latest broadcasts here.</p>
          <Link
            to="/explore"
            className="mt-8 px-6 py-3 bg-brand-orange text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-black transition-colors"
          >
            Explore Content
          </Link>
        </div>
      ) : videos.length > 0 ? (
        <div className="grid gap-x-6 gap-y-12 sm:gap-x-8 sm:gap-y-16 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <VideoCard key={v._id} video={v} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <PlayCircle size={48} className="text-white/10 mb-4" />
          <p className="text-lg font-display font-black text-text-main">All Caught Up</p>
          <p className="text-sm text-text-muted mt-2 max-w-xs">Your subscribed channels haven't posted anything new.</p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsPage;