import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Home, LogOut, X, LayoutDashboard, Compass, PlayCircle, History, UploadCloud } from "lucide-react";
import { useAuth } from "../../../Auth/hooks/useAuth.js";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = ({ open, setOpen, collapsed }) => {
  const { handleLogout } = useAuth();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const onLogout = async () => {
    await handleLogout();
    navigate("/login");
  };

  const navItems = [
    { name: "Home", icon: Home, path: "/", authOnly: false },
    { name: "Explore", icon: Compass, path: "/explore", authOnly: false },
    { name: "Subscriptions", icon: PlayCircle, path: "/subscriptions", authOnly: true },
    { name: "History", icon: History, path: "/history", authOnly: true },
    { name: "Upload", icon: UploadCloud, path: "/upload", authOnly: true },
    { name: "Studio", icon: LayoutDashboard, path: "/studio", authOnly: true },
  ];

  const visibleItems = navItems.filter((item) => !item.authOnly || user);

  const handleNavClick = (item, e) => {
    setOpen(false);
    if (item.authOnly && !user) {
      e.preventDefault();
      navigate("/login");
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed lg:sticky top-0 lg:top-16 left-0 h-full lg:h-[calc(100vh-4rem)] z-50
          glass lg:bg-transparent lg:border-r-0 lg:backdrop-blur-0
          transition-all duration-300 ease-in-out

          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 flex flex-col

          ${collapsed ? "lg:w-20" : "lg:w-64"}
          w-64
        `}
      >
        <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">

          {/* MOBILE LOGO & CLOSE */}
          <div className="lg:hidden flex items-center justify-between mb-4 border-b border-main pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-black">
                S
              </div>
              <span className="font-display font-black text-lg tracking-tight text-main uppercase italic">
                Sti<span className="text-brand-orange">tch</span>
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-muted hover:bg-black/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1.5">
            {visibleItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/"}
                onClick={(e) => handleNavClick(item, e)}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-3.5 py-3 rounded-2xl transition-all duration-300 group relative
                  ${isActive
                    ? "bg-brand-orange/10 text-brand-orange font-bold shadow-sm"
                    : "text-muted hover:bg-brand-orange/5 hover:text-main"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                    {!collapsed && <span className="whitespace-nowrap text-[12px] font-black uppercase tracking-widest">{item.name}</span>}
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute left-0 w-1 h-6 bg-brand-orange rounded-r-full"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-main ">
            {user ? (
              <button
                onClick={onLogout}
                className="w-full  flex cursor-pointer items-center gap-4 px-3.5 py-3 rounded-2xl text-brand-red hover:bg-brand-red/10 font-black text-[10px] uppercase tracking-widest transition-all group"
              >
                <LogOut className="w-5 h-5 shrink-0 transition-transform group-hover:-translate-x-1" />
                {!collapsed && <span className="whitespace-nowrap text-green-600">Sign Out</span>}
              </button>
            ) : (
              <button
                onClick={() => { setOpen(false); navigate("/login"); }}
                className="w-full cursor-pointer flex items-center gap-4 px-3.5 py-3 rounded-2xl bg-brand-orange text-green-600 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-brand-orange/90"
              >
                <LogOut className="w-5 cursor-pointer h-5 shrink-0 rotate-180" />
                {!collapsed && <span className="whitespace-nowrap text-green-600">Sign In</span>}
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;