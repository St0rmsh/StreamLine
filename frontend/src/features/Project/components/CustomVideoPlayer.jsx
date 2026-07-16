import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CustomPlayer = ({
  sources,
  hlsUrl,
  autoPlay = false,
  onEnd,
  onWatchTime,
  videoData = {},
  initialTime = 0
}) => {

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const volumeRef = useRef(null);
  const lastTrackedTimeRef = useRef(0);
  const retryCountRef = useRef(0);
  const hlsRef = useRef(null);
  const isDraggingProgressRef = useRef(false);
  const isDraggingVolumeRef = useRef(false);

  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("signal_volume");
    return saved !== null ? parseFloat(saved) : 1;
  });
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem("signal_muted");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [playing, setPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState("720p");
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [isMini, setIsMini] = useState(false);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState(0);

  // 💾 PERSIST & SYNC PREFERENCES
  useEffect(() => {
    localStorage.setItem("signal_volume", volume.toString());
    localStorage.setItem("signal_muted", JSON.stringify(isMuted));
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = speed;
    }
  }, [volume, isMuted, speed]);

  const src = sources?.[quality] || sources?.["720p"];

  // Handle src change and autoplay with HLS support
  useEffect(() => {
    retryCountRef.current = 0;
    setError(false);
    setDuration(0);
    setProgress(0);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;
    if (!video) return;

    if (hlsUrl && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video.play().catch(() => setIsMuted(true));
        }
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.warn("⚠️ HLS Fatal Error:", data.type, "- Falling back to MP4");
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              hlsRef.current = null;
              video.src = src;
              video.load();
              if (autoPlay) video.play().catch(() => setIsMuted(true));
              break;
          }
        }
      });

    } else if (hlsUrl && video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS (Safari) — src is set imperatively here since there's no
      // hlsUrl attribute path in the plain <video> JSX below.
      video.src = hlsUrl;
      video.load();
      if (autoPlay) video.play().catch(() => setIsMuted(true));

    }
    // 🚫 No `else` branch here doing `video.src = src; video.load()` —
    // the <video src={src}> attribute in the JSX below already handles the
    // plain-MP4 case declaratively. Setting it a second time imperatively
    // right after mount was interrupting the initial load and preventing
    // `loadedmetadata` from firing reliably, which is why the progress bar
    // never moved (duration stayed 0 forever).

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [src, hlsUrl, autoPlay]);


  // ⌚ RESUME LOGIC
  useEffect(() => {
    if (initialTime > 0 && videoRef.current) {
      videoRef.current.currentTime = initialTime;
      lastTrackedTimeRef.current = initialTime;
    }
  }, [initialTime]);

  // ⏱️ Duration + current time — listen on multiple events so we don't
  // depend on a single event firing reliably across browsers/sources.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateDuration = () => {
      if (video.duration && !isNaN(video.duration)) setDuration(video.duration);
    };
    const tick = () => {
      setCurrentTimeDisplay(video.currentTime || 0);
      if (video.duration && !isNaN(video.duration) && !isDraggingProgressRef.current) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("durationchange", updateDuration);
    video.addEventListener("timeupdate", tick);

    return () => {
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("durationchange", updateDuration);
      video.removeEventListener("timeupdate", tick);
    };
  }, [src, hlsUrl]);

  // 📊 Separately track the 5-second watch-time reporting so it doesn't
  // get tangled with the display-update logic above.
  const handleTimeUpdateForTracking = () => {
    const v = videoRef.current;
    if (!v?.duration) return;
    const currentPos = v.currentTime;
    if (Math.abs(currentPos - lastTrackedTimeRef.current) >= 5) {
      lastTrackedTimeRef.current = currentPos;
      onWatchTime?.(currentPos, v.duration);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // ─────────────────────────────────────────────
  // 🎯 PROGRESS BAR — click AND drag
  // ─────────────────────────────────────────────
  const seekToClientX = useCallback((clientX) => {
    if (!progressRef.current || !videoRef.current?.duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = percent * videoRef.current.duration;
    videoRef.current.currentTime = newTime;
    setProgress(percent * 100);
    onWatchTime?.(newTime, videoRef.current.duration);
  }, [onWatchTime]);

  const handleProgressMouseDown = (e) => {
    isDraggingProgressRef.current = true;
    seekToClientX(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingProgressRef.current) seekToClientX(e.clientX);
      if (isDraggingVolumeRef.current && volumeRef.current) {
        const rect = volumeRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setVolume(percent);
        setIsMuted(false);
      }
    };
    const handleMouseUp = () => {
      isDraggingProgressRef.current = false;
      isDraggingVolumeRef.current = false;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [seekToClientX]);

  // ─────────────────────────────────────────────
  // 🔊 VOLUME — click AND drag
  // ─────────────────────────────────────────────
  const handleVolumeMouseDown = (e) => {
    isDraggingVolumeRef.current = true;
    if (!volumeRef.current) return;
    const rect = volumeRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(percent);
    setIsMuted(false);
  };

  // 🔄 RETRY LOGIC
  const handleError = () => {
    if (retryCountRef.current < 3) {
      retryCountRef.current++;
      console.warn(`Connection dropped. Retrying signal attempt ${retryCountRef.current}...`);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.load();
      }, 2000 * retryCountRef.current);
    } else {
      setError(true);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {
        setIsMuted(true);
        videoRef.current.muted = true;
        videoRef.current.play();
      });
    } else {
      videoRef.current.pause();
    }
    setPlaying(!videoRef.current.paused);
  };

  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ⌨️ Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          if (videoRef.current) videoRef.current.currentTime += 5;
          break;
        case "ArrowLeft":
          if (videoRef.current) videoRef.current.currentTime -= 5;
          break;
        case "KeyM":
          setIsMuted((m) => !m);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => playing && setShowControls(false)}
      className={`relative bg-black group/player overflow-hidden select-none touch-none
        ${isMini ? "fixed bottom-6 right-6 w-80 z-50 rounded-2xl shadow-2xl" : "w-full aspect-video rounded-3xl border border-border-main"}
      `}
    >
      <video
        ref={videoRef}
        src={hlsUrl ? undefined : src}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdateForTracking}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => { setBuffering(false); setPlaying(true); }}
        onSeeking={() => setBuffering(true)}
        onSeeked={() => setBuffering(false)}
        onPause={() => setPlaying(false)}
        onEnded={onEnd}
        onError={handleError}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
        muted={isMuted}
      />

      <AnimatePresence>
        {buffering && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 pointer-events-none"
          >
            <div className="w-12 h-12 border-4 border-white/20 border-t-brand-orange rounded-full animate-spin"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4 z-20">
        {videoData?.verification?.finalVerdict && (
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-black/5 shadow-sm">
            {videoData.verification.finalVerdict === "TRUE" ? (
              <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-brand-red" />
            )}
            <span className="text-[9px] font-black uppercase tracking-widest text-black leading-none">
              AI {videoData.verification.finalVerdict}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="absolute inset-0 bg-white flex flex-col items-center justify-center text-black p-6 text-center z-30">
          <AlertTriangle className="w-10 h-10 text-brand-orange mb-4" />
          <h2 className="text-lg font-black uppercase tracking-tight mb-2">Signal Connection Lost</h2>
          <p className="text-[10px] font-bold text-muted max-w-[200px] uppercase">Failed to establish secure neural link after 3 attempts.</p>
          <button onClick={() => { retryCountRef.current = 0; setError(false); videoRef.current?.load(); }} className="mt-8 px-8 py-3 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-orange transition-all active:scale-95 shadow-xl">
            Hard Reset Signal
          </button>
        </div>
      )}

      <motion.div
        animate={{ opacity: showControls || !playing ? 1 : 0, y: showControls || !playing ? 0 : 10 }}
        className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20 pt-16"
      >
        {/* PROGRESS BAR */}
        <div
          ref={progressRef}
          onMouseDown={handleProgressMouseDown}
          className="group/progress relative h-1.5 bg-white/20 rounded-full cursor-pointer mb-6 transition-all hover:h-2"
        >
          <div className="absolute left-0 top-0 h-full bg-orange-800 rounded-full pointer-events-none" style={{ width: `${progress}%` }}>
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-sky-500 rounded-full shadow-md pointer-events-none transition-opacity opacity-0 group-hover/volume:opacity-100"
              style={{ left: `calc(${(isMuted ? 0 : volume) * 100}% - 6px)` }} />
          </div>
        </div>

        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-6">
            <button onClick={togglePlay} className="hover:scale-110 transition-transform">
              {playing ? <Pause className="fill-white" size={20} /> : <Play className="fill-white" size={20} />}
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="hover:text-brand-orange transition-colors shrink-0"
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              {/* VOLUME BAR — now click AND drag, with a visible thumb */}
              <div
                ref={volumeRef}
                onMouseDown={handleVolumeMouseDown}
                className="group/volume relative w-24 h-4 flex items-center cursor-pointer"
              >
                <div className="w-full h-1.5 bg-white/25 rounded-full relative overflow-visible">
                  <div
                    className="absolute left-0 top-0 h-full bg-blue-500 rounded-full pointer-events-none"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md pointer-events-none transition-opacity opacity-0 group-hover/volume:opacity-100"
                    style={{ left: `calc(${(isMuted ? 0 : volume) * 100}% - 6px)` }}
                  />
                </div>
              </div>
            </div>
            <span className="font-display font-bold text-[10px] tracking-widest opacity-80 uppercase">
              {formatTime(currentTimeDisplay)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button onClick={() => setShowSettings(!showSettings)} className={`transition-colors ${showSettings ? 'text-brand-orange' : 'hover:text-brand-tan'}`}>
                <Settings size={18} />
              </button>
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-10 right-0 bg-white rounded-2xl p-2 w-36 shadow-2xl border border-black/5"
                  >
                    <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-muted">Playback Speed</p>
                    {[0.5, 1, 1.5, 2].map(s => (
                      <button
                        key={s}
                        onClick={() => { setSpeed(s); setShowSettings(false); }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-colors ${speed === s ? 'bg-black text-white' : 'text-black hover:bg-surface-low'}`}
                      >
                        {s}x
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={toggleFullscreen}
              className="hover:text-brand-orange transition-colors"
            >
              <Maximize size={18} />
            </button>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomPlayer;