import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  getChannelByHandle,
  getChannelVideos,
  toggleSubscribe,
  isSubscribed,
} from "../services/ytapi.service";
import { connectSocket } from "../services/socketIO.service";
import SubscribeButton from "../components/SubscribeButton";
import { Play, Eye, Calendar, Users, VideoIcon, Bell } from "lucide-react";

// ─── Fallbacks ────────────────────────────────────────────
const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=1400&q=80";
const FALLBACK_AVATAR = (name = "U") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=200`;

// ─── Helper ───────────────────────────────────────────────
const formatCount = (n = 0) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return `${n}`;
};

const timeAgo = (date) => {
  if (!date) return "";
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
};

// ─── Video Card ───────────────────────────────────────────
const VideoCard = ({ video }) => {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);

  return (
    <div
      className="group cursor-pointer"
      onClick={() => navigate(`/video/${video._id}`)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-200 dark:bg-[#1c1c3a] mb-2.5 shadow-sm group-hover:shadow-lg transition-all border border-black/5">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${hover ? "scale-105" : "scale-100"}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <VideoIcon className="w-10 h-10 text-gray-400 dark:text-gray-600" />
          </div>
        )}

        {/* Play Overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${hover ? "opacity-100" : "opacity-0"}`}>
          <div className="w-10 h-10 rounded-full bg-indigo-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        {video.duration != null && (
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
            {`${Math.floor(video.duration / 60)}:${Math.floor(video.duration % 60).toString().padStart(2, '0')}`}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-0.5">
        <h3 className="font-semibold text-gray-900 dark:text-[#e5e3ff] line-clamp-2 text-[14px] leading-snug mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-[#aaa8c6] font-medium">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 opacity-60" />
            {formatCount(video.views)} views
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 opacity-60" />
            {timeAgo(video.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────
const Skeleton = () => (
  <div className="animate-pulse">
    {/* Banner */}
    <div className="w-full h-48 md:h-64 bg-gray-200 dark:bg-[#1c1c3a]" />
    {/* Header */}
    <div className="px-6 mt-4 flex gap-4 items-center">
      <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-[#222242] shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-6 w-48 bg-gray-300 dark:bg-[#222242] rounded" />
        <div className="h-4 w-32 bg-gray-200 dark:bg-[#1c1c3a] rounded" />
      </div>
    </div>
    {/* Grid */}
    <div className="px-6 mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-video rounded-xl bg-gray-200 dark:bg-[#1c1c3a]" />
          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-[#1c1c3a]" />
          <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-[#171732]" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────
const ChannelPage = () => {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [subscribed, setSubscribed] = useState(false);
  const [loadingSub, setLoadingSub] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // ===== FETCH DATA =====
  useEffect(() => {
    if (!handle) return;
    setLoading(true);
    setNotFound(false);

    const fetchData = async () => {
      try {
        const [res1, res2] = await Promise.all([
          getChannelByHandle(handle),
          getChannelVideos(handle),
        ]);
        setChannel(res1.data.channel);
        setVideos(res2.data.videos || []);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [handle]);

  // ===== SOCKET UPDATES =====
  useEffect(() => {
    if (!channel?._id) return;

    const socket = connectSocket();

    socket.emit("join-channel", channel._id);

    const handleSubUpdate = (data) => {
      if (data.channelId === channel._id) {
        setChannel((prev) => ({ ...prev, subscribersCount: data.count }));
      }
    };

    const handleViewsUpdate = (data) => {
      if (data.channelId === channel._id) {
        setChannel((prev) => ({ ...prev, totalViews: data.totalViews }));
      }
    };

    socket.on("channel:subscribers:update", handleSubUpdate);
    socket.on("channel:views:update", handleViewsUpdate);

    return () => {
      socket.emit("leave-channel", channel._id);
      socket.off("channel:subscribers:update", handleSubUpdate);
      socket.off("channel:views:update", handleViewsUpdate);
    };
  }, [channel?._id]);

  // ===== CHECK SUB (only when logged in) =====
  useEffect(() => {
    if (!channel?._id || !user) return;

    const loadSub = async () => {
      try {
        const res = await isSubscribed(channel._id);
        setSubscribed(res.data.subscribed);
      } catch (err) {
        console.error(err);
      }
    };

    loadSub();
  }, [channel, user]);

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!channel?._id || loadingSub) return;
    setLoadingSub(true);
    try {
      const res = await toggleSubscribe(channel._id);
      setSubscribed(res.data.subscribed);
      if (res.data.subscribersCount !== undefined) {
        setChannel((prev) => ({ ...prev, subscribersCount: res.data.subscribersCount }));
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 400) {
        // e.g. "you can't subscribe to your own channel" from the backend guard
      }
    } finally {
      setLoadingSub(false);
    }
  };

  const isOwnChannel = user && channel?.owner && (channel.owner._id === user._id || channel.owner === user._id);

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-[#0c0c22]">
      <Skeleton />
    </div>
  );

  if (notFound || !channel) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0c0c22] gap-4">
      <VideoIcon className="w-16 h-16 text-gray-300 dark:text-[#2a2a4a]" />
      <p className="text-gray-500 dark:text-[#aaa8c6] text-lg font-bold">Channel not found.</p>
      <button
        onClick={() => navigate("/")}
        className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition-colors"
      >
        Return Home
      </button>
    </div>
  );

  const bannerSrc = !bannerError && channel.banner ? channel.banner : FALLBACK_BANNER;
  const avatarSrc = !avatarError && channel.avatar
    ? channel.avatar
    : FALLBACK_AVATAR(channel.name || channel.handle);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0c0c22] text-gray-900 dark:text-[#e5e3ff] transition-colors duration-300">

      {/* ═══════════════ BANNER ═══════════════ */}
      <div className="relative w-full h-32 sm:h-44 md:h-60 lg:h-72 overflow-hidden bg-stitch-grey">
        <img
          src={bannerSrc}
          alt="Channel Banner"
          onError={() => setBannerError(true)}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-white dark:from-[#0c0c22] via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 bg-linear-to-r from-indigo-600/10 to-purple-600/10 mix-blend-multiply" />
      </div>

      {/* ═══════════════ CHANNEL HEADER ═══════════════ */}
      <div className="px-4 sm:px-6 md:px-10 lg:px-12 -mt-6 sm:-mt-10 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-5">

          {/* Avatar */}
          <div className="shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-2xl sm:rounded-3xl ring-4 ring-white dark:ring-[#0c0c22] overflow-hidden shadow-2xl shadow-indigo-500/10 bg-stitch-grey">
              <img
                src={avatarSrc}
                alt={channel.name}
                onError={() => setAvatarError(true)}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info + actions */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2">

            {/* Channel info */}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-black tracking-tight text-gray-900 dark:text-[#e5e3ff] leading-none">
                {channel.name || channel.handle || "Unknown Channel"}
              </h1>
              <p className="text-xs sm:text-sm text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-widest">
                @{channel.handle}
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-[10px] sm:text-xs font-bold uppercase tracking-tight text-main/50">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-black text-gray-900 dark:text-[#e5e3ff]">
                    {formatCount(channel.subscribersCount)}
                  </span>
                  Subscribers
                </span>
                <span className="flex items-center gap-1.5">
                  <VideoIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-black text-gray-900 dark:text-[#e5e3ff]">
                    {formatCount(channel.videosCount ?? videos.length)}
                  </span>
                  Transmissions
                </span>
                {channel.totalViews != null && (
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="font-black text-gray-900 dark:text-[#e5e3ff]">
                      {formatCount(channel.totalViews)}
                    </span>
                    Views
                  </span>
                )}
              </div>
            </div>

            {/* Subscribe — hidden entirely on your own channel */}
            {!isOwnChannel && (
              <div className="w-full sm:w-auto">
                <SubscribeButton
                  subscribed={subscribed}
                  loading={loadingSub}
                  onClick={handleSubscribe}
                  subscriberCount={channel.subscribersCount}
                />
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {channel.description && (
          <div className="mt-8 max-w-2xl bg-black/5 dark:bg-white/5 p-5 rounded-2xl border border-black/5">
            <p className="text-sm text-main/70 leading-relaxed font-bold italic">
              {channel.description}
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="mt-10 h-px bg-linear-to-r from-indigo-500/20 via-purple-500/10 to-transparent" />
      </div>

      {/* ═══════════════ VIDEOS SECTION ═══════════════ */}
      <div className="px-4 sm:px-6 md:px-10 lg:px-12 mt-10 pb-20">

        {/* Section header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-6 rounded-full bg-linear-to-b from-indigo-500 to-purple-600" />
          <h2 className="text-lg sm:text-xl font-display font-black uppercase italic tracking-tight text-gray-900 dark:text-[#e5e3ff]">
            Network Archives
          </h2>
          {videos.length > 0 && (
            <span className="ml-2 text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg px-2.5 py-1 font-black uppercase tracking-widest border border-indigo-500/20">
              {videos.length} NODES
            </span>
          )}
        </div>

        {/* Grid */}
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 sm:gap-8">
            {videos.map((v) => (
              <VideoCard key={v._id} video={v} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-black/5 dark:bg-white/5 rounded-[3rem] border border-dashed border-black/10 transition-all">
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/5">
              <VideoIcon className="w-10 h-10 text-indigo-400" />
            </div>
            <p className="text-xl font-display font-black text-gray-800 dark:text-[#e5e3ff]">SIGNAL SILENCE</p>
            <p className="text-xs font-bold text-gray-500 dark:text-[#aaa8c6] mt-2 uppercase tracking-widest opacity-60">
              This node has not initiated a network broadcast yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelPage;