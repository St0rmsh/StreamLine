import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

const Error = () => {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0c0c22] text-gray-900 dark:text-[#e5e3ff] px-6 transition-colors duration-300">

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center max-w-lg relative z-10"
      >
        {/* Glow effect background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-red-500/20 blur-3xl rounded-full pointer-events-none" />

        {/* Icon */}
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="flex justify-center mb-6 relative"
        >
          <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <AlertTriangle size={48} className="text-red-500" />
          </div>
        </motion.div>

        {/* Title */}
        <h1 className="text-7xl font-bold tracking-tighter mb-4 text-transparent bg-clip-text bg-linear-to-r from-red-500 to-orange-500">
          404
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl font-medium text-gray-700 dark:text-gray-300 mb-2">
          Page Not Found
        </p>
        <p className="text-base text-gray-500 dark:text-[#aaa8c6] mb-8">
          The page you are looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/">
            <button className="w-full sm:w-auto px-8 py-3 rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all">
              Return Home
            </button>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-8 py-3 rounded-xl border border-gray-300 dark:border-white/10 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition-all"
          >
            Go Back
          </button>
        </div>

        {/* Extra Hint */}
        <p className="mt-8 text-xs text-gray-400 dark:text-[#6a6886] uppercase tracking-widest font-semibold">
          Error Code: ROUTE_NOT_FOUND
        </p>
      </motion.div>
    </div>
  );
};

export default Error;