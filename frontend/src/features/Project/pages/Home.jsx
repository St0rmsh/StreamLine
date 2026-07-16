import { useEffect, useState } from "react";
import { getAllVideos } from "../services/ytapi.service";
import VideoCard from "../components/video/VideoCard";
import SkeletonCard from "../components/video/SkeletonCard";
import { Inbox } from "lucide-react";

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await getAllVideos();
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

      {/* ===== VIDEOS GRID ===== */}
      {loading ? (
        <div className="grid gap-x-6 gap-y-12 sm:gap-x-8 sm:gap-y-16 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array(9).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Inbox size={48} className="text-white/10 mb-4" />
          <p className="text-lg font-display font-black text-text-main">Signal Lost</p>
          <p className="text-sm text-text-muted mt-2 max-w-xs">
            Couldn't reach the network. Check your connection and try again.
          </p>
        </div>
      ) : videos.length > 0 ? (
        <div className="grid gap-x-6 gap-y-12 sm:gap-x-8 sm:gap-y-16 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <VideoCard key={v._id} video={v} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Inbox size={48} className="text-white/10 mb-4" />
          <p className="text-lg font-display font-black text-text-main">No Broadcasts Yet</p>
          <p className="text-sm text-text-muted mt-2 max-w-xs">
            Be the first to upload and light up the network.
          </p>
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-32 border-t border-border-main pt-16 text-center pb-16">
        <p className="text-[10px] font-black text-text-muted tracking-[0.4em] uppercase opacity-50">
          Neural Content Verification Network &copy; 2026
        </p>
      </div>

    </div>
  );
};

export default Home;