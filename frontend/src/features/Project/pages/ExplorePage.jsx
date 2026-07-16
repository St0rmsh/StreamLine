import { useEffect, useState } from "react";
import { getTrendingVideos } from "../services/ytapi.service";
import VideoCard from "../components/video/VideoCard";
import SkeletonCard from "../components/video/SkeletonCard";
import { TrendingUp, Inbox } from "lucide-react";

const ExplorePage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await getTrendingVideos();
        setVideos(res.data.videos || []);
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
        <div className="p-3 bg-stitch-grey rounded-2xl border border-border-main">
          <TrendingUp size={20} className="text-brand-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-black text-stitch-black tracking-tight">Explore</h1>
          <p className="text-sm text-text-muted">Trending broadcasts across the network</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-x-6 gap-y-12 sm:gap-x-8 sm:gap-y-16 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array(9).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Inbox size={48} className="text-black/10 mb-4" />
          <p className="text-lg font-display font-black text-black">Signal Lost</p>
          <p className="text-sm text-muted mt-2 max-w-xs">Couldn't reach the network. Try again shortly.</p>
        </div>
      ) : videos.length > 0 ? (
        <div className="grid gap-x-6 gap-y-12 sm:gap-x-8 sm:gap-y-16 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <VideoCard key={v._id} video={v} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <TrendingUp size={48} className="text-black/10 mb-4" />
          <p className="text-lg font-display font-black text-black">Nothing Trending Yet</p>
          <p className="text-sm text-muted mt-2 max-w-xs">Check back once more content lights up the network.</p>
        </div>
      )}
    </div>
  );
};

export default ExplorePage;