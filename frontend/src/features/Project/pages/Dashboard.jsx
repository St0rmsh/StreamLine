import { useEffect, useState, useRef } from "react";
import { UploadCloud, X, Image as ImageIcon, Video, Sparkles, Users, Eye, Settings, ShieldCheck, Edit, Trash2, Search, Clock, Play, Activity, Zap, Cpu, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from "recharts";
import { toast } from "react-hot-toast";
import { getMyVideos, getMyChannel, updateChannel, uploadVideo, createChannel, getStudioStats, deleteVideo, updateVideo } from "../services/ytapi.service";
import TrustMeter from "../components/UI/TrustMeter";

// --- ELAPSED TIMER COMPONENT ---
const ElapsedTimer = ({ createdAt }) => {
    const [elapsed, setElapsed] = useState("");

    useEffect(() => {
        const calc = () => {
            const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            if (h > 0) setElapsed(`${h}h ${m}m ${s}s`);
            else if (m > 0) setElapsed(`${m}m ${s}s`);
            else setElapsed(`${s}s`);
        };
        calc();
        const id = setInterval(calc, 1000);
        return () => clearInterval(id);
    }, [createdAt]);

    return <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest tabular-nums">{elapsed}</span>;
};

// --- CUSTOM COMPONENTS ---
const GlassContainer = ({ children, className = "" }) => (
    <div className={`bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-sm ${className}`}>
        {children}
    </div>
);

const PrecisionInput = ({ label, ...props }) => (
    <div className="space-y-1.5 w-full">
        {label && (
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">
                {label}
            </label>
        )}
        <input
            className="w-full bg-white/[0.02] border-b border-white/10 px-4 py-3 text-sm font-medium text-white placeholder:text-white/20 focus:border-white focus:bg-white/[0.05] outline-none transition-all duration-300"
            {...props}
        />
    </div>
);

const ForensicButton = ({ children, variant = "primary", className = "", ...props }) => {
    const variants = {
        primary: "bg-white text-black hover:bg-zinc-200",
        secondary: "bg-zinc-800 text-white hover:bg-zinc-700",
        ghost: "bg-transparent border border-white/10 text-white hover:bg-white/5",
        danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20"
    };

    return (
        <button
            className={`px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

const Dashboard = () => {
    const [videos, setVideos] = useState([]);
    const [channel, setChannel] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showUpload, setShowUpload] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showEditVideo, setShowEditVideo] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Refs — kept fully separate per surface so a click never targets an
    // input element that isn't actually mounted (see fix notes below)
    const uploadFileRef = useRef(null);
    const uploadThumbRef = useRef(null);
    const editThumbRef = useRef(null);
    const onboardAvatarRef = useRef(null);
    const onboardBannerRef = useRef(null);
    const editAvatarRef = useRef(null);
    const editBannerRef = useRef(null);

    // Forms
    const [videoForm, setVideoForm] = useState({ title: "", description: "", video: null, thumbnail: null, isAiGenerated: false });
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [editVideoForm, setEditVideoForm] = useState({ title: "", description: "", visibility: "public", isPublished: true, thumbnail: null });
    const [editThumbnailPreview, setEditThumbnailPreview] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const [channelForm, setChannelForm] = useState({ name: "", description: "", avatar: null, banner: null });
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);

    const [createForm, setCreateForm] = useState({ name: "", handle: "", description: "", avatar: null, banner: null });
    const [dragging, setDragging] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredVideos = videos.filter(v =>
        (v.title || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDrag = (e, zone) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragover') setDragging(zone);
        else setDragging(null);
    };

    const handleDrop = (e, zone, callback) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(null);
        const file = e.dataTransfer.files[0];
        if (file) callback(file);
    };

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [vRes, cRes, sRes] = await Promise.all([
                getMyVideos(),
                getMyChannel().catch(() => ({ data: { channel: null } })),
                getStudioStats().catch(() => ({ data: { stats: null } }))
            ]);

            setVideos(vRes.data.videos || []);
            setChannel(cRes.data.channel || null);
            setStats(sRes.data.stats || null);

            if (cRes.data.channel) {
                setChannelForm({
                    name: cRes.data.channel.name || "",
                    description: cRes.data.channel.description || "",
                    avatar: null,
                    banner: null
                });
            }
        } catch (err) {
            console.error("Dashboard load error:", err);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const retentionData = stats?.retentionCurve?.map((val, i) => ({
        bucket: `${i * 5}%`,
        value: val
    })) || [];

    // Handlers
    const handleUpload = async () => {
        if (!videoForm.title.trim() || !videoForm.video) return toast.error("Title and Video required");

        setSaving(true);
        const tid = toast.loading("Uploading Video...");
        try {
            const fd = new FormData();
            fd.append("title", videoForm.title.trim());
            fd.append("description", videoForm.description || "");
            fd.append("isAiGenerated", videoForm.isAiGenerated);
            if (videoForm.video) fd.append("video", videoForm.video);
            if (videoForm.thumbnail) fd.append("thumbnail", videoForm.thumbnail);

            await uploadVideo(fd, {
                onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total))
            });

            toast.success("Video Uploaded Successfully", { id: tid });
            setShowUpload(false);
            setVideoForm({ title: "", description: "", video: null, thumbnail: null, isAiGenerated: false });
            setThumbnailPreview(null);
            setUploadProgress(0);
            loadAllData();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Upload failed", { id: tid });
            setUploadProgress(0);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateChannel = async () => {
        setSaving(true);
        const tid = toast.loading("Updating Channel Settings...");
        try {
            const fd = new FormData();
            fd.append("name", channelForm.name);
            fd.append("description", channelForm.description || "");
            if (channelForm.avatar) fd.append("avatar", channelForm.avatar);
            if (channelForm.banner) fd.append("banner", channelForm.banner);

            await updateChannel(fd);
            toast.success("Channel Updated", { id: tid });
            setShowEdit(false);
            loadAllData();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Update failed", { id: tid });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteVideo = async (id) => {
        setSaving(true);
        const tid = toast.loading("Deleting Video...");
        try {
            await deleteVideo(id);
            toast.success("Video Deleted", { id: tid });
            setShowEditVideo(null);
            setConfirmDelete(false);
            loadAllData();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Delete failed", { id: tid });
        } finally {
            setSaving(false);
        }
    };

    const handleEditVideo = async () => {
        setSaving(true);
        const tid = toast.loading("Updating Metadata...");
        try {
            const fd = new FormData();
            fd.append("title", editVideoForm.title || "");
            fd.append("description", editVideoForm.description || "");
            fd.append("visibility", editVideoForm.visibility);
            fd.append("isPublished", editVideoForm.isPublished);
            if (editVideoForm.thumbnail) fd.append("thumbnail", editVideoForm.thumbnail);

            await updateVideo(showEditVideo._id, fd);
            toast.success("Metadata updated", { id: tid });
            setShowEditVideo(null);
            setEditThumbnailPreview(null);
            loadAllData();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Update failed", { id: tid });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-1 bg-white/10 relative overflow-hidden">
                <motion.div
                    initial={{ left: '-100%' }}
                    animate={{ left: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute inset-0 w-1/2 bg-white"
                />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">Loading Dashboard...</div>
        </div>
    );

    // ONBOARDING
    if (!channel) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-8 selection:bg-white selection:text-black">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl w-full space-y-12">
                    <div className="space-y-4 text-center">
                        <div className="w-20 h-20 bg-white/[0.03] border border-white/10 rounded-sm flex items-center justify-center mx-auto text-white overflow-hidden">
                            {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <Radio size={32} className="opacity-40" />}
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none text-white">
                                Create Your <span className="opacity-40 text-zinc-500">Channel.</span>
                            </h1>
                            <p className="text-zinc-500 font-medium text-[10px] tracking-[0.2em] uppercase">Set up your profile and start sharing.</p>
                        </div>
                    </div>

                    <GlassContainer className="p-10 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <PrecisionInput
                                label="Channel Name"
                                placeholder="Enter name"
                                value={createForm.name}
                                onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                            />
                            <PrecisionInput
                                label="Handle"
                                placeholder="@username"
                                value={createForm.handle}
                                onChange={e => setCreateForm({ ...createForm, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => onboardAvatarRef.current?.click()}
                                className="p-6 bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all text-left"
                            >
                                <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-3 tracking-widest">Profile Picture</label>
                                <div className="flex items-center gap-3">
                                    <ImageIcon size={14} className="opacity-30" />
                                    <span className="text-[10px] font-bold text-white truncate uppercase">{createForm.avatar ? createForm.avatar.name : "Select Image"}</span>
                                </div>
                            </button>
                            <button
                                onClick={() => onboardBannerRef.current?.click()}
                                className="p-6 bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all text-left"
                            >
                                <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-3 tracking-widest">Channel Banner</label>
                                <div className="flex items-center gap-3">
                                    <ImageIcon size={14} className="opacity-30" />
                                    <span className="text-[10px] font-bold text-white truncate uppercase">{createForm.banner ? createForm.banner.name : "Select Image"}</span>
                                </div>
                            </button>
                        </div>

                        <input type="file" hidden ref={onboardAvatarRef} accept="image/*" onChange={e => {
                            const f = e.target.files[0];
                            if (f) { setCreateForm({ ...createForm, avatar: f }); setAvatarPreview(URL.createObjectURL(f)); }
                        }} />
                        <input type="file" hidden ref={onboardBannerRef} accept="image/*" onChange={e => {
                            const f = e.target.files[0];
                            if (f) { setCreateForm({ ...createForm, banner: f }); setBannerPreview(URL.createObjectURL(f)); }
                        }} />

                        <ForensicButton disabled={saving} className="w-full py-5" onClick={async () => {
                            if (!createForm.name.trim() || !createForm.handle.trim()) return toast.error("Name and handle are required");
                            if (!/^[a-z0-9_]{3,30}$/.test(createForm.handle)) return toast.error("Handle must be 3-30 chars, lowercase letters/numbers/underscore");

                            setSaving(true);
                            const tid = toast.loading("Creating Channel...");
                            try {
                                const fd = new FormData();
                                fd.append("name", createForm.name.trim());
                                fd.append("handle", createForm.handle.trim());
                                fd.append("description", createForm.description || "");
                                if (createForm.avatar) fd.append("avatar", createForm.avatar);
                                if (createForm.banner) fd.append("banner", createForm.banner);
                                await createChannel(fd);
                                toast.success("Channel Created", { id: tid });
                                setAvatarPreview(null);
                                loadAllData();
                            } catch (e) {
                                toast.error(e?.response?.data?.message || "Failed to create channel", { id: tid });
                            } finally {
                                setSaving(false);
                            }
                        }}>
                            Create Channel
                        </ForensicButton>
                    </GlassContainer>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-white selection:text-black">
            <div className="max-w-[1400px] mx-auto px-8 py-16 space-y-16">

                {/* HEADER / CHANNEL SETTINGS */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-white/5 pb-16">
                    <div className="flex items-center gap-8">
                        <div className="w-24 h-24 bg-white/[0.03] border border-white/10 rounded-sm overflow-hidden flex items-center justify-center">
                            {channel?.avatar ? (
                                <img src={channel.avatar} className="w-full h-full object-cover" />
                            ) : (
                                <Users size={40} className="opacity-20" />
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-6xl font-black uppercase tracking-tighter leading-none">{channel?.name || "DASHBOARD"}</h1>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mt-2" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500">Handle: @{channel?.handle || "undefined"}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                        <ForensicButton variant="ghost" onClick={() => {
                            if (channel) {
                                setChannelForm({
                                    name: channel.name || "",
                                    description: channel.description || "",
                                    avatar: null,
                                    banner: null
                                });
                                setAvatarPreview(null);
                                setBannerPreview(null);
                            }
                            setShowEdit(true);
                        }}>
                            <Settings size={14} className="opacity-50" /> Channel Settings
                        </ForensicButton>
                        <ForensicButton variant="primary" onClick={() => setShowUpload(true)}>
                            <UploadCloud size={14} /> Upload Video
                        </ForensicButton>
                    </div>
                </div>

                {/* METRICS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Total Views", value: (stats?.totalViews || 0).toLocaleString(), icon: Eye },
                        { label: "Watch Time", value: `${stats?.watchTimeHours || 0}H`, icon: Clock },
                        { label: "Subscribers", value: (stats?.subscribers || 0).toLocaleString(), icon: Users },
                        { label: "Trust Score", value: `${stats?.avgTrustScore || 0}%`, icon: ShieldCheck },
                    ].map((s, i) => (
                        <div key={i} className="bg-white/[0.02] border border-white/5 p-8 space-y-4 group transition-all hover:bg-white/[0.04]">
                            <div className="flex justify-between items-start">
                                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500">{s.label}</p>
                                <s.icon size={14} className="text-zinc-600 group-hover:text-white transition-colors" />
                            </div>
                            <p className="text-5xl font-black tracking-tighter leading-none">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* DATA VISUALIZATION SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white flex items-center gap-3">
                                <Activity size={14} className="text-zinc-400" /> Audience Retention
                            </h3>
                            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Real-Time Data</div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 p-10 h-[350px]">
                            {retentionData.some(d => d.value > 0) ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={retentionData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                        <XAxis
                                            dataKey="bucket"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fontWeight: 700, fill: '#444', letterSpacing: '0.1em' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fontWeight: 700, fill: '#444' }}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0', fontSize: '10px' }}
                                            itemStyle={{ color: '#FFF', fontWeight: 'bold' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#FFFFFF"
                                            strokeWidth={1}
                                            fillOpacity={1}
                                            fill="url(#colorValue)"
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-center">
                                    <Activity size={32} className="text-zinc-700 mb-4" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Not enough watch data yet</p>
                                    <p className="text-[9px] text-zinc-700 mt-1 uppercase tracking-widest">Retention builds up as viewers watch your videos</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white/[0.02] border border-white/5 p-10 space-y-8 flex flex-col justify-between h-full">
                            <div className="space-y-6">
                                <div className="w-12 h-12 bg-white flex items-center justify-center text-black">
                                    <Cpu size={24} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Channel <br /> Health.</h3>
                                    <p className="text-[10px] font-medium text-zinc-500 leading-relaxed uppercase tracking-wider">
                                        Videos: <span className="text-white">{stats?.totalVideos ?? videos.length}</span><br />
                                        Trust Score: <span className="text-white">{stats?.avgTrustScore || 0}%</span>
                                    </p>
                                </div>
                            </div>
                            <div className="pt-8 border-t border-white/5">
                                <TrustMeter score={stats?.avgTrustScore || 0} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* VIDEO MANAGEMENT */}
                <div className="space-y-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black uppercase tracking-tighter">Video Management</h3>
                            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-500">Your uploaded videos</p>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                            <input
                                placeholder="SEARCH VIDEOS..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white/[0.02] border border-white/10 rounded-sm pl-12 pr-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white focus:border-white outline-none"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600 border-b border-white/5">
                                    <th className="py-6 px-4 font-bold">Video</th>
                                    <th className="py-6 px-4 font-bold">Visibility</th>
                                    <th className="py-6 px-4 font-bold">Performance</th>
                                    <th className="py-6 px-4 font-bold">Status</th>
                                    <th className="py-6 px-4 text-right font-bold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredVideos.length > 0 ? (
                                    filteredVideos.map(v => (
                                        <tr key={v._id} className="group hover:bg-white/[0.01] transition-colors">
                                            <td className="py-8 px-4">
                                                <div className="flex gap-6 items-center">
                                                    <div className="w-32 aspect-video bg-zinc-900 border border-white/5 overflow-hidden shrink-0 relative grayscale group-hover:grayscale-0 transition-all duration-700">
                                                        <img src={v.thumbnail} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-white/20">
                                                            <div className="h-full bg-white" style={{ width: `${Math.round(v.trustScore || 0)}%` }} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5 min-w-0">
                                                        <p className="font-bold text-sm uppercase tracking-tight truncate">{v.title}</p>
                                                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Added: {new Date(v.createdAt).toLocaleDateString()}</p>
                                                        {(v.status === "uploading" || v.status === "processing") && (
                                                            <div className="flex items-center gap-2 pt-0.5">
                                                                <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
                                                                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400/70">Running for</span>
                                                                <ElapsedTimer createdAt={v.createdAt} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-8 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1 h-1 rounded-full ${v.visibility === 'public' ? 'bg-white' : 'bg-zinc-700'}`} />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{v.visibility}</span>
                                                </div>
                                            </td>
                                            <td className="py-8 px-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                                        <span className="flex items-center gap-2 text-white"><Eye size={12} className="opacity-30" /> {v.views}</span>
                                                        <span className="flex items-center gap-2 text-white"><Zap size={12} className="opacity-30" /> {Math.round(v.trustScore || 0)}%</span>
                                                    </div>
                                                    <div className="h-[2px] w-32 bg-white/5 overflow-hidden">
                                                        <div className="h-full bg-white/40" style={{ width: `${Math.min(100, (v.views / 1000) * 100)}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-8 px-4">
                                                {v.status === "uploading" ? (
                                                    <div className="space-y-1.5">
                                                        <span className="text-amber-400 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" /> Uploading</span>
                                                        <p className="text-[8px] text-zinc-600 uppercase tracking-widest">~1–30 min total</p>
                                                    </div>
                                                ) : v.status === "processing" ? (
                                                    <div className="space-y-1.5">
                                                        <span className="text-blue-400 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" /> Processing</span>
                                                        <p className="text-[8px] text-zinc-600 uppercase tracking-widest">Converting + AI scan</p>
                                                    </div>
                                                ) : v.status === "ready" ? (
                                                    <span className="text-emerald-400 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Ready</span>
                                                ) : v.status === "failed" ? (
                                                    <span className="text-red-500 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-500 rounded-full" /> Failed</span>
                                                ) : v.isPublished ? (
                                                    <span className="text-white text-[9px] font-bold uppercase tracking-[0.2em]">Published</span>
                                                ) : (
                                                    <span className="text-zinc-700 text-[9px] font-bold uppercase tracking-[0.2em]">Draft</span>
                                                )}
                                            </td>
                                            <td className="py-8 px-4 text-right">
                                                <div className="flex justify-end gap-4 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => {
                                                        setShowEditVideo(v);
                                                        setEditThumbnailPreview(v.thumbnail);
                                                        setEditVideoForm({
                                                            title: v.title,
                                                            description: v.description,
                                                            visibility: v.visibility,
                                                            isPublished: v.isPublished,
                                                            thumbnail: null
                                                        });
                                                    }} className="text-zinc-500 hover:text-white transition-colors"><Edit size={14} /></button>
                                                    <button onClick={() => {
                                                        setShowEditVideo(v);
                                                        setConfirmDelete(true);
                                                        setEditThumbnailPreview(v.thumbnail);
                                                        setEditVideoForm({
                                                            title: v.title,
                                                            description: v.description,
                                                            visibility: v.visibility,
                                                            isPublished: v.isPublished,
                                                            thumbnail: null
                                                        });
                                                    }} className="text-zinc-800 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-600">
                                                {videos.length === 0 ? "No videos uploaded yet" : "No signals found matching your parameters"}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODALS */}
                <AnimatePresence>
                    {/* 1. UPLOAD MODAL */}
                    {showUpload && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto no-scrollbar">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !saving && setShowUpload(false)} className="fixed inset-0 bg-black/95 backdrop-blur-md" />
                            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="relative bg-[#0A0A0A] border border-white/10 rounded-sm w-full max-w-5xl p-10 sm:p-16 shadow-2xl space-y-12">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Upload Video</h2>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500">Share a new video with your audience</p>
                                    </div>
                                    <button onClick={() => !saving && setShowUpload(false)} className="text-zinc-500 hover:text-white transition-all"><X size={24} /></button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                    <div className="space-y-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Video File</label>
                                            <div
                                                onClick={() => uploadFileRef.current.click()}
                                                onDragOver={e => handleDrag(e, 'video')}
                                                onDragLeave={e => handleDrag(e, null)}
                                                onDrop={e => handleDrop(e, 'video', f => setVideoForm({ ...videoForm, video: f }))}
                                                className={`aspect-video border border-dashed flex flex-col items-center justify-center cursor-pointer transition-all p-12 text-center relative
                                                    ${videoForm.video ? 'border-white bg-white/5' : dragging === 'video' ? 'border-white bg-white/10' : 'border-white/10 hover:border-white/30 bg-white/[0.01]'}
                                                `}
                                            >
                                                {videoForm.video ? <Play size={40} className="text-white mb-4" /> : <UploadCloud size={40} className="opacity-20 mb-4" />}
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-white">{videoForm.video ? videoForm.video.name : "Select Video"}</p>
                                                <input type="file" hidden ref={uploadFileRef} accept="video/*" onChange={e => setVideoForm({ ...videoForm, video: e.target.files[0] })} />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Thumbnail</label>
                                            <div
                                                onClick={() => uploadThumbRef.current.click()}
                                                className="aspect-video border border-dashed border-white/10 hover:border-white/30 bg-white/[0.01] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden"
                                            >
                                                {thumbnailPreview ? (
                                                    <img src={thumbnailPreview} className="w-full h-full object-cover opacity-80" />
                                                ) : (
                                                    <ImageIcon size={32} className="opacity-10" />
                                                )}
                                                <input type="file" hidden ref={uploadThumbRef} accept="image/*" onChange={e => {
                                                    const file = e.target.files[0];
                                                    if (file) { setVideoForm({ ...videoForm, thumbnail: file }); setThumbnailPreview(URL.createObjectURL(file)); }
                                                }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-between">
                                        <div className="space-y-8">
                                            <PrecisionInput label="Video Title" placeholder="Enter title" value={videoForm.title} onChange={e => setVideoForm({ ...videoForm, title: e.target.value })} />
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Description</label>
                                                <textarea
                                                    value={videoForm.description}
                                                    onChange={e => setVideoForm({ ...videoForm, description: e.target.value })}
                                                    placeholder="Enter description..."
                                                    className="w-full h-40 bg-white/[0.02] border border-white/10 p-6 text-sm font-medium text-white outline-none focus:border-white transition-all resize-none"
                                                />
                                            </div>

                                            <div
                                                onClick={() => setVideoForm({ ...videoForm, isAiGenerated: !videoForm.isAiGenerated })}
                                                className={`p-5 border cursor-pointer transition-all flex items-center justify-between gap-4 ${videoForm.isAiGenerated ? 'bg-white/10 border-white/30' : 'bg-white/[0.02] border-white/10 hover:border-white/20'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Sparkles size={16} className={videoForm.isAiGenerated ? "text-white" : "text-zinc-500"} />
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest">AI Disclosure</p>
                                                        <p className="text-[9px] text-zinc-500 mt-0.5">Check if this video involves AI-generated content</p>
                                                    </div>
                                                </div>
                                                <div className={`w-10 h-5 rounded-full p-1 transition-colors ${videoForm.isAiGenerated ? 'bg-white' : 'bg-white/10'}`}>
                                                    <motion.div animate={{ x: videoForm.isAiGenerated ? 20 : 0 }} className={`w-3 h-3 rounded-full ${videoForm.isAiGenerated ? 'bg-black' : 'bg-white'}`} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-10 border-t border-white/5">
                                            {uploadProgress > 0 ? (
                                                <div className="space-y-4">
                                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.3em]">
                                                        <span>Uploading Video...</span>
                                                        <span>{uploadProgress}%</span>
                                                    </div>
                                                    <div className="h-[2px] w-full bg-white/5">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${uploadProgress}%` }}
                                                            className="h-full bg-white"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <ForensicButton disabled={saving} className="w-full py-6" onClick={handleUpload}>Upload Video</ForensicButton>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* 2. EDIT VIDEO MODAL */}
                    {showEditVideo && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowEditVideo(null); setConfirmDelete(false); }} className="fixed inset-0 bg-black/95 backdrop-blur-md" />
                            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="relative bg-[#0A0A0A] border border-white/10 rounded-sm w-full max-w-3xl p-12 shadow-2xl space-y-10">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black uppercase tracking-tighter">Edit Video</h2>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-500">Update video details</p>
                                    </div>
                                    <button onClick={() => { setShowEditVideo(null); setConfirmDelete(false); }} className="text-zinc-500 hover:text-white transition-all"><X size={20} /></button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <PrecisionInput label="Title" value={editVideoForm.title} onChange={e => setEditVideoForm({ ...editVideoForm, title: e.target.value })} />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Description</label>
                                            <textarea
                                                value={editVideoForm.description}
                                                onChange={e => setEditVideoForm({ ...editVideoForm, description: e.target.value })}
                                                className="w-full h-32 bg-white/[0.02] border border-white/10 p-5 text-sm font-medium text-white outline-none focus:border-white transition-all resize-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-6 text-center">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 block text-left ml-1">Thumbnail</label>
                                        <div
                                            onClick={() => editThumbRef.current.click()}
                                            className="aspect-video bg-zinc-900 border border-white/5 overflow-hidden cursor-pointer relative group"
                                        >
                                            <img src={editThumbnailPreview} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-all duration-700" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-all">
                                                <ImageIcon size={20} />
                                            </div>
                                            <input type="file" hidden ref={editThumbRef} accept="image/*" onChange={e => {
                                                const file = e.target.files[0];
                                                if (file) { setEditVideoForm({ ...editVideoForm, thumbnail: file }); setEditThumbnailPreview(URL.createObjectURL(file)); }
                                            }} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-3 text-left">
                                                <label className="text-[8px] font-bold uppercase tracking-widest text-zinc-600 ml-1">Visibility</label>
                                                <div className="flex bg-white/5 p-1 border border-white/5">
                                                    {['public', 'private'].map(v => (
                                                        <button
                                                            key={v}
                                                            onClick={() => setEditVideoForm({ ...editVideoForm, visibility: v })}
                                                            className={`flex-1 py-2 text-[8px] font-bold uppercase tracking-tighter ${editVideoForm.visibility === v ? 'bg-white text-black' : 'text-zinc-500'}`}
                                                        >
                                                            {v}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3 text-left">
                                                <label className="text-[8px] font-bold uppercase tracking-widest text-zinc-600 ml-1">State</label>
                                                <div className="flex bg-white/5 p-1 border border-white/5">
                                                    {[{ l: 'Live', v: true }, { l: 'Draft', v: false }].map(s => (
                                                        <button
                                                            key={s.l}
                                                            onClick={() => setEditVideoForm({ ...editVideoForm, isPublished: s.v })}
                                                            className={`flex-1 py-2 text-[8px] font-bold uppercase tracking-tighter ${editVideoForm.isPublished === s.v ? 'bg-white text-black' : 'text-zinc-500'}`}
                                                        >
                                                            {s.l}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 pt-4">
                                    <ForensicButton disabled={saving} className="w-full py-5" onClick={handleEditVideo}>Save Changes</ForensicButton>
                                    {!confirmDelete ? (
                                        <button onClick={() => setConfirmDelete(true)} className="text-[9px] font-bold uppercase tracking-[0.3em] text-red-900 hover:text-red-500 transition-colors py-4">Delete Video</button>
                                    ) : (
                                        <div className="flex items-center justify-between p-6 bg-red-500/5 border border-red-500/10">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-red-500">Confirm permanent deletion?</span>
                                            <div className="flex gap-4">
                                                <button onClick={() => setConfirmDelete(false)} className="text-[9px] font-bold uppercase text-zinc-500 underline">Cancel</button>
                                                <button disabled={saving} onClick={() => handleDeleteVideo(showEditVideo._id)} className="text-[9px] font-bold uppercase text-red-500 border border-red-500/20 px-4 py-2 hover:bg-red-500 hover:text-white transition-all disabled:opacity-40">Delete</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* 3. EDIT CHANNEL MODAL */}
                    {showEdit && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !saving && setShowEdit(false)} className="fixed inset-0 bg-black/95 backdrop-blur-md" />
                            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="relative bg-[#0A0A0A] border border-white/10 rounded-sm w-full max-w-2xl p-12 shadow-2xl space-y-12">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Channel Settings</h2>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-500">Update your channel profile</p>
                                    </div>
                                    <button onClick={() => !saving && setShowEdit(false)} className="text-zinc-500 hover:text-white transition-all"><X size={20} /></button>
                                </div>

                                <div className="space-y-10">
                                    <div className="relative aspect-[4/1] bg-white/[0.02] border border-white/5 overflow-hidden group">
                                        {bannerPreview || channel?.banner ? (
                                            <img src={bannerPreview || channel?.banner} className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-60 transition-all duration-1000" />
                                        ) : null}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                            <ForensicButton variant="ghost" onClick={() => editBannerRef.current.click()}>Update Banner</ForensicButton>
                                        </div>
                                        <input type="file" hidden ref={editBannerRef} accept="image/*" onChange={e => {
                                            const f = e.target.files[0];
                                            if (f) { setChannelForm({ ...channelForm, banner: f }); setBannerPreview(URL.createObjectURL(f)); }
                                        }} />
                                        <div className="absolute -bottom-6 left-10 w-24 h-24 bg-[#0A0A0A] border border-white/10 flex items-center justify-center overflow-hidden">
                                            {avatarPreview || channel?.avatar ? (
                                                <img src={avatarPreview || channel?.avatar} className="w-full h-full object-cover" />
                                            ) : <Users size={32} className="opacity-20" />}
                                            <div onClick={() => editAvatarRef.current.click()} className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                                                <ImageIcon size={20} />
                                            </div>
                                            <input type="file" hidden ref={editAvatarRef} accept="image/*" onChange={e => {
                                                const f = e.target.files[0];
                                                if (f) { setChannelForm({ ...channelForm, avatar: f }); setAvatarPreview(URL.createObjectURL(f)); }
                                            }} />
                                        </div>
                                    </div>

                                    <div className="space-y-8 pt-4">
                                        <PrecisionInput label="Channel Name" value={channelForm.name} onChange={e => setChannelForm({ ...channelForm, name: e.target.value })} />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Description</label>
                                            <textarea
                                                value={channelForm.description}
                                                onChange={e => setChannelForm({ ...channelForm, description: e.target.value })}
                                                className="w-full h-32 bg-white/[0.02] border border-white/10 p-6 text-sm font-medium text-white outline-none focus:border-white transition-all resize-none"
                                            />
                                        </div>
                                    </div>

                                    <ForensicButton disabled={saving} className="w-full py-6" onClick={handleUpdateChannel}>Save Changes</ForensicButton>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default Dashboard;