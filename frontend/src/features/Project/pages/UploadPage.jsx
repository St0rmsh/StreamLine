import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { uploadVideo, getMyChannel } from "../services/ytapi.service";
import { Button, Input } from "../components/UI/Index";

export const UploadPage = () => {
  const navigate = useNavigate();

  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [checkingChannel, setCheckingChannel] = useState(true);

  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);

  const videoInputRef = useRef(null);
  const thumbInputRef = useRef(null);

  // 🛑 Guard: uploading requires a channel — the backend enforces this too,
  // but failing fast here avoids a wasted large-file upload attempt that
  // would only get rejected after the network transfer completes.
  useState(() => {
    (async () => {
      try {
        await getMyChannel();
      } catch (err) {
        if (err.response?.status === 404) {
          toast.error("Create a channel first to upload videos");
          navigate("/studio");
          return;
        }
      } finally {
        setCheckingChannel(false);
      }
    })();
  }, []);

  const handleVideoSelect = (e) => {
    const file = e.type === 'drop' ? e.dataTransfer.files[0] : e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      if (file.size > 500 * 1024 * 1024) {
        toast.error("Video must be under 500MB");
        return;
      }
      setVideoFile(file);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    } else if (file) {
      toast.error("Please select a valid video file");
    }
  };

  const handleThumbSelect = (e) => {
    const file = e.type === 'drop' ? e.dataTransfer.files[0] : e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setThumbFile(file);
      setThumbPreview(URL.createObjectURL(file));
    } else if (file) {
      toast.error("Please select a valid image file");
    }
  };

  const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };

  const onDragOverVideo = (e) => { prevent(e); setIsDraggingVideo(true); };
  const onDragLeaveVideo = () => { setIsDraggingVideo(false); };
  const onDropVideo = (e) => {
    prevent(e);
    setIsDraggingVideo(false);
    handleVideoSelect(e);
  };

  const onDragOverThumb = (e) => { prevent(e); setIsDraggingThumb(true); };
  const onDragLeaveThumb = () => { setIsDraggingThumb(false); };
  const onDropThumb = (e) => {
    prevent(e);
    setIsDraggingThumb(false);
    handleThumbSelect(e);
  };

  const handleUpload = async () => {
    if (!videoFile || !title.trim()) {
      return toast.error("Video file and title are required!");
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("title", title.trim());
    formData.append("description", description || "");
    formData.append("isAiGenerated", isAiGenerated);
    if (thumbFile) formData.append("thumbnail", thumbFile);

    try {
      await uploadVideo(formData, {
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setProgress(percent);
        }
      });

      toast.success("Content archived in the vault! 🚀", {
        duration: 5000,
        icon: '🎬'
      });

      setTimeout(() => navigate("/studio"), 1500);

    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Transmission failed.");
      setUploading(false);
      setProgress(0);
    }
  };

  if (checkingChannel) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-indigo/20 border-t-brand-indigo rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-brand-indigo w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Contribution Port</span>
          </div>
          <h1 className="text-4xl font-display font-black text-main tracking-tighter uppercase italic">
            Curate New <span className="text-brand-indigo">Content</span>
          </h1>
          <p className="text-muted mt-2 font-medium">Broadcast your vision to the neural network.</p>
        </div>

        {videoFile && (
          <Button
            onClick={handleUpload}
            disabled={uploading || !title.trim()}
            className="w-full md:w-auto h-14 px-10 bg-gradient-to-r from-brand-indigo to-brand-purple shadow-xl shadow-brand-indigo/20 text-sm font-black uppercase tracking-widest rounded-2xl disabled:opacity-50"
          >
            {uploading ? `Archiving ${progress}%` : "Publish Content"}
            {!uploading && <ArrowRight className="ml-2 w-5 h-5" />}
          </Button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        <div className="lg:col-span-2 space-y-8">

          {/* VIDEO UPLOAD ZONE */}
          <motion.div
            whileHover={!videoFile ? { scale: 1.005 } : {}}
            onDragOver={onDragOverVideo}
            onDragLeave={onDragLeaveVideo}
            onDrop={onDropVideo}
            onClick={() => !uploading && videoInputRef.current.click()}
            className={`relative border-2 border-dashed rounded-[2.5rem] p-12 md:p-24 text-center transition-all cursor-pointer overflow-hidden
              ${videoFile
                ? "border-brand-emerald/50 bg-brand-emerald/5"
                : isDraggingVideo
                  ? "border-brand-indigo bg-brand-indigo/10 scale-[1.02]"
                  : "border-main bg-surface-low hover:border-brand-indigo/50 shadow-inner"}
            `}
          >
            <input type="file" hidden ref={videoInputRef} accept="video/*" onChange={handleVideoSelect} />

            <AnimatePresence mode="wait">
              {videoFile ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-20 h-20 bg-brand-emerald/10 rounded-full flex items-center justify-center mb-6 ai-glow-emerald">
                    <CheckCircle2 className="w-10 h-10 text-brand-emerald" />
                  </div>
                  <h2 className="text-xl font-display font-black text-main mb-1 truncate max-w-md">{videoFile.name}</h2>
                  <p className="text-brand-emerald text-xs font-black uppercase tracking-widest">Signal Ready • {(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setVideoFile(null); }}
                    className="mt-8 text-xs font-black text-muted hover:text-brand-crimson uppercase tracking-widest transition-colors"
                  >
                    Reset Content
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-inner transition-all
                    ${isDraggingVideo ? "bg-brand-indigo scale-110 shadow-brand-indigo/50" : "bg-brand-indigo/10 ai-glow-indigo"}
                  `}>
                    <UploadCloud className={`w-10 h-10 transition-colors ${isDraggingVideo ? "text-white" : "text-brand-indigo"}`} />
                  </div>
                  <h2 className="text-2xl font-display font-black text-main mb-3 uppercase italic">
                    {isDraggingVideo ? "Release Signal" : "Select Video Stream"}
                  </h2>
                  <p className="text-muted font-medium max-w-xs mx-auto text-sm leading-relaxed">Drag and drop high-fidelity video files or click to initialize.</p>

                  <div className="mt-12 flex flex-wrap justify-center gap-6 text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-emerald" /> UP TO 500MB</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-indigo" /> MP4 / WEBM / MKV</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-purple" /> AI VERIFICATION INCLUDED</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {uploading && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-12 z-[100]">
                <div className="w-full max-w-md h-2 bg-stitch-grey rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-brand-indigo to-brand-purple shadow-[0_0_20px_rgba(102,103,171,0.5)]"
                  />
                </div>
                <p className="mt-8 font-black text-sm text-brand-indigo animate-pulse uppercase tracking-[0.4em]">
                  Transmission in Progress... {progress}%
                </p>
                <p className="mt-4 text-xs font-bold text-muted uppercase tracking-widest text-center max-w-sm">
                  Do not navigate away. Please wait while the signal is securely archived.
                </p>
              </div>
            )}
          </motion.div>

          {/* INFORMATION BOX */}
          <div className="glass-heavy rounded-[2.5rem] p-8 md:p-10 border border-main space-y-8">
            <h3 className="text-xl font-display font-black text-main flex items-center gap-3 uppercase italic">
              <AlertCircle className="w-6 h-6 text-brand-indigo" />
              Content Metadata
            </h3>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-muted tracking-widest mb-2 block">Curation Title</label>
                <Input
                  placeholder="The signal's name..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-14 bg-surface-low border-main rounded-2xl font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted tracking-widest mb-2 block">Brief Synopsis</label>
                <textarea
                  placeholder="What stories lie within the signal?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full p-5 rounded-[2rem] border border-main bg-surface-low text-main font-bold placeholder:font-medium outline-none focus:ring-2 focus:ring-brand-indigo/50 transition-all resize-none"
                />
              </div>

              {/* AI DISCLOSURE */}
              <div
                onClick={() => setIsAiGenerated(!isAiGenerated)}
                className={`p-6 rounded-[2rem] border cursor-pointer transition-all flex items-center justify-between gap-4
                  ${isAiGenerated ? 'bg-brand-purple/10 border-brand-purple/30' : 'bg-surface-low border-main hover:border-brand-purple/20'}
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isAiGenerated ? 'bg-brand-purple text-white shadow-lg' : 'bg-main text-muted'}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-main uppercase text-xs tracking-widest">AI Disclosure</h4>
                    <p className="text-[11px] text-muted font-medium mt-0.5">Check this if any part of the signal was synthesized with AI.</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isAiGenerated ? 'bg-brand-purple' : 'bg-main'}`}>
                  <motion.div animate={{ x: isAiGenerated ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW & TIPS */}
        <div className="space-y-8">
          <div className="glass-heavy rounded-[2.5rem] p-8 border border-main space-y-8">
            <h3 className="text-xl font-display font-black text-main flex items-center gap-3 uppercase italic">
              <ImageIcon className="w-6 h-6 text-brand-indigo" />
              Keyface
            </h3>

            <div
              onClick={() => !uploading && thumbInputRef.current.click()}
              onDragOver={onDragOverThumb}
              onDragLeave={onDragLeaveThumb}
              onDrop={onDropThumb}
              className={`group relative aspect-video rounded-3xl border-2 border-dashed overflow-hidden cursor-pointer transition-all
                  ${thumbFile
                  ? "border-brand-emerald bg-brand-emerald/5"
                  : isDraggingThumb
                    ? "border-brand-indigo bg-brand-indigo/10 scale-[1.05]"
                    : "border-main bg-surface-low hover:border-brand-indigo shadow-inner"}
                `}
            >
              <input type="file" hidden ref={thumbInputRef} accept="image/*" onChange={handleThumbSelect} />

              {thumbPreview ? (
                <div className="relative w-full h-full">
                  <img src={thumbPreview} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="thumb-preview" />
                  <div className="absolute inset-0 bg-brand-indigo/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImageIcon className="text-white w-8 h-8 drop-shadow-lg" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted p-6 text-center">
                  <ImageIcon className={`w-8 h-8 mb-3 transition-colors ${isDraggingThumb ? 'text-brand-indigo' : 'opacity-30'}`} />
                  <p className="text-[10px] font-black uppercase tracking-widest">{isDraggingThumb ? "Release Keyface" : "Select Signal Thumbnail"}</p>
                  <p className="text-[9px] mt-2 font-bold opacity-50 uppercase tracking-tighter">or drop file</p>
                </div>
              )}
            </div>

            <div className="bg-brand-indigo/5 p-4 rounded-2xl mt-4">
              <p className="text-xs font-bold text-muted leading-relaxed">
                High-fidelity thumbnails increase resonance with the curator network by <span className="text-brand-indigo font-black">40%</span>.
              </p>
            </div>
          </div>

          {/* CURATOR GUIDELINES */}
          <div className="glass rounded-[2.5rem] p-8 border border-main">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-indigo mb-6">Redline Protocol</h4>
            <ul className="space-y-4">
              {[
                "Enforce high dynamic range (HDR) for maximum impact.",
                "Zero tolerance for deepfake impersonation without disclosure.",
                "Verify all data sources before transmission.",
                "Metadata must accurately reflect signal contents."
              ].map((tip, i) => (
                <li key={i} className="flex gap-4 items-start text-[11px] font-bold text-muted">
                  <ShieldCheck className="w-4 h-4 text-brand-indigo shrink-0" />
                  <span className="leading-snug">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UploadPage;