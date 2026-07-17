import { useNavigate } from "react-router-dom";
import { Search, Menu, User, LogOut, Video, X, LayoutDashboard } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { searchVideos } from "../../services/ytapi.service";
import { useAuth } from "../../../Auth/hook/useAuth";
import { motion, AnimatePresence } from "framer-motion";

const Topbar = ({ setSidebarOpen, collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const { handleLogout } = useAuth();
  const { user } = useSelector((state) => state.auth);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const dropdownRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.trim()) {
        try {
          const res = await searchVideos(query);
          setResults(res.data?.videos || []);
          setShowDropdown(true);
        } catch (error) {
          console.error(error);
        }
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // 🖱️ Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && query.trim()) {
      setShowDropdown(false);
      setMobileSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleSelectResult = (videoId) => {
    setShowDropdown(false);
    setMobileSearchOpen(false);
    setQuery("");
    navigate(`/video/${videoId}`);
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-10 bg-bg border-b border-border-main sticky top-0 z-40 transition-all duration-300">
      {/* LEFT SECTION */}
      <div className={`flex items-center gap-3 sm:gap-6 ${mobileSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
        <button
          onClick={() => {
            if (window.innerWidth < 1024) setSidebarOpen((prev) => !prev);
            else setCollapsed(!collapsed);
          }}
          className="p-2 -ml-2 rounded-lg text-text-muted hover:bg-white/5 hover:text-text-main transition-colors"
        >
          <Menu size={20} />
        </button>

        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-orange text-white shadow-sm shadow-brand-orange/30 group-hover:bg-white group-hover:text-brand-orange transition-colors duration-300">
            <Video size={16} fill="currentColor" />
          </div>
          <span className="hidden md:block font-display font-black text-lg tracking-tight text-text-main uppercase">
            Stream<span className="text-brand-orange italic">Line</span>
          </span>
        </div>
      </div>

      {/* CENTER SEARCH */}
      <div className={`
        flex-1 items-center gap-3 px-4 relative z-50
        ${mobileSearchOpen ? 'flex absolute inset-x-0 h-16 bg-bg' : 'hidden md:flex justify-center max-w-xl'}
      `}
      ref={dropdownRef}>
        {mobileSearchOpen && (
          <button
            onClick={() => setMobileSearchOpen(false)}
            className="p-2 md:hidden text-text-muted hover:bg-white/5 rounded-xl"
          >
            <X size={20} />
          </button>
        )}

        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
            <Search size={16} />
          </div>
          <input
            placeholder="Search intelligence..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            onFocus={() => query.trim() && setShowDropdown(true)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-surface-low border border-transparent text-sm text-text-main placeholder-text-muted outline-none focus:bg-surface focus:border-brand-orange/40 focus:ring-4 focus:ring-brand-orange/10 transition-all"
          />
        </div>

        {/* SEARCH DROPDOWN */}
        <AnimatePresence>
          {showDropdown && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`absolute top-12 left-0 w-full px-4 z-50 ${mobileSearchOpen ? 'top-16 px-0' : ''}`}
            >
              <div className="w-full bg-surface rounded-2xl shadow-2xl border border-border-main overflow-hidden py-2 max-h-[60vh] overflow-y-auto">
                {results.map((video) => (
                  <div
                    key={video._id}
                    onClick={() => handleSelectResult(video._id)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="w-12 h-8 bg-surface-low rounded overflow-hidden shrink-0 border border-white/5">
                      {video.thumbnail && (
                        <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-main truncate">
                        {video.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT SECTION */}
      <div className={`items-center gap-2 sm:gap-4 ${mobileSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
        <button
          onClick={() => setMobileSearchOpen(true)}
          className="p-2 md:hidden text-text-muted hover:bg-white/5 hover:text-text-main rounded-lg transition-colors"
        >
          <Search size={20} />
        </button>

        {user ? (
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-9 h-9 rounded-full bg-surface-low flex items-center justify-center text-text-main border border-border-main hover:border-brand-orange/40 transition-all active:scale-95 overflow-hidden"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-text-muted" />
              )}
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-48 bg-surface rounded-2xl shadow-2xl border border-border-main py-2 z-50"
                >
                  <div className="px-4 py-2 border-b border-border-main mb-1">
                    <p className="text-xs font-black text-text-main truncate">@{user.username}</p>
                  </div>
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate("/studio"); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-text-main hover:bg-white/5 transition-colors"
                  >
                    <LayoutDashboard size={14} className="text-brand-orange" />
                    Creator Studio
                  </button>
                  <div className="h-px bg-border-main my-1" />
                  <button
                    onClick={() => { setShowProfileMenu(false); handleLogout(); navigate("/"); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-brand-red hover:bg-brand-red/5 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="px-5 py-2 rounded-full bg-brand-orange text-white text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default Topbar;