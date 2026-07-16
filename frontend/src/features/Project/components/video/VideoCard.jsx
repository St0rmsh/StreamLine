import { Link } from "react-router-dom";
import { useRef, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ShieldCheck, ShieldAlert, Eye, Clock } from "lucide-react";

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

const VideoCard = ({ video }) => {
  const channel = video?.channel || {};
  const videoRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    // Small delay so quick mouse-passes over the grid don't all trigger video loads
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(true);
      videoRef.current?.play().catch(() => {});
    }, 300);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeoutRef.current);
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="w-full group cursor-pointer transition-all duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link to={`/video/${video?._id}`}>
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-surface-low mb-4 border border-black/5 shadow-sm group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] transition-all duration-500">
          {/* THUMBNAIL */}
          <img
            src={video?.thumbnail || "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop"}
            alt={video?.title}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${isHovering ? "scale-110 blur-[4px] opacity-40" : "scale-100 opacity-100"}`}
          />

          {/* VIDEO PREVIEW */}
          {video?.videoUrl && isHovering && (
            <video
              ref={videoRef}
              src={video.videoUrl}
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 opacity-100"
            />
          )}

          {/* AI STATUS BADGE */}
          <div className="absolute top-4 left-4 z-10">
            {video?.verification?.finalVerdict === "TRUE" ? (
              <div className="bg-white/90 backdrop-blur-xl border border-black/5 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-black">AI Verified</span>
              </div>
            ) : video?.deepfakeScore > 0.5 ? (
              <div className="bg-brand-red/90 backdrop-blur-xl border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <ShieldAlert className="w-3.5 h-3.5 text-white" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">Manipulated</span>
              </div>
            ) : null}
          </div>

          {/* DURATION */}
          <div className="absolute bottom-4 right-4 z-10 bg-black/80 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-xl text-[9px] font-black text-white tracking-widest uppercase">
            {video?.duration ? `${Math.floor(video.duration / 60)}:${Math.floor(video.duration % 60).toString().padStart(2, '0')}` : "0:00"}
          </div>

          {/* PLAY ICON OVERLAY ON HOVER */}
          <AnimatePresence>
            {isHovering && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center bg-brand-orange/10 pointer-events-none"
              >
                <div className="w-16 h-16 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-brand-orange shadow-2xl">
                  <Play fill="currentColor" size={32} className="ml-1" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>

      <div className="flex gap-4 px-1">
        {/* CHANNEL AVATAR */}
        <Link to={`/channel/${channel?.handle || ""}`} className="shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
          <div className="w-9 h-9 rounded-full bg-surface-low border border-black/5 overflow-hidden flex items-center justify-center shadow-sm transition-colors group-hover:border-black/10">
            {channel?.avatar ? (
              <img src={channel.avatar} alt={channel.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-black text-[10px] opacity-40">{channel?.name?.charAt(0) || "C"}</span>
            )}
          </div>
        </Link>

        {/* INFO */}
        <div className="flex flex-col flex-1 min-w-0">
          <Link to={`/video/${video?._id}`}>
            <h3 className="font-display font-black text-[14px] leading-snug text-black line-clamp-2 transition-colors duration-300">
              {video?.title || "Untitled Transmission"}
            </h3>
          </Link>

          <div className="mt-1 flex flex-col gap-0.5">
            <Link to={`/channel/${channel?.handle || ""}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1.5 group/chan">
                <span className="text-[12px] font-bold text-muted hover:text-black transition-colors">
                  {channel?.name || "The Curator"}
                </span>
                {channel?.verified && <ShieldCheck size={10} className="text-black/40" />}
              </div>
            </Link>
            <div className="flex items-center gap-3 text-[10px] text-muted font-bold uppercase tracking-tighter">
              <span className="flex items-center gap-1.5"><Eye size={12} className="text-brand-orange/60" /> {formatViews(video?.views)}</span>
              <span className="w-1 h-1 rounded-full bg-black/10" />
              <span className="flex items-center gap-1.5"><Clock size={12} className="text-brand-orange/60" /> {formatTimeAgo(video?.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(VideoCard);