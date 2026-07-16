import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

const Error = () => {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-bg text-text-main px-6">

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center max-w-lg relative z-10"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-brand-orange/20 blur-3xl rounded-full pointer-events-none" />

        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="flex justify-center mb-6 relative"
        >
          <div className="w-24 h-24 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shadow-[0_0_30px_rgba(232,48,42,0.2)]">
            <AlertTriangle size={48} className="text-brand-orange" />
          </div>
        </motion.div>

        <h1 className="text-7xl font-black tracking-tighter mb-4 text-white">
          404
        </h1>

        <p className="text-xl md:text-2xl font-bold text-text-main mb-2">
          Page Not Found
        </p>
        <p className="text-base text-text-muted mb-8">
          The page you are looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/">
            <button className="w-full sm:w-auto px-8 py-3 rounded-xl bg-brand-orange text-white font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-brand-orange/30 hover:scale-[1.02] active:scale-95 transition-all">
              Return Home
            </button>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-8 py-3 rounded-xl border border-border-main text-text-main font-black text-sm uppercase tracking-widest hover:bg-white/5 active:scale-95 transition-all"
          >
            Go Back
          </button>
        </div>

        <p className="mt-8 text-xs text-text-muted uppercase tracking-widest font-bold opacity-60">
          Error Code: ROUTE_NOT_FOUND
        </p>
      </motion.div>
    </div>
  );
};

export default Error;