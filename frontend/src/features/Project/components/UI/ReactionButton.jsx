import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const PARTICLES = ["❤️", "💜", "💛", "💖", "💙"];

const ReactionButton = ({ type, count, active, onClick, disabled = false }) => {
  const [burst, setBurst] = useState(false);
  const isLike = type === "LIKE";

  const handleClick = () => {
    if (disabled) return;
    if (isLike && !active) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    }
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-full flex items-center gap-2 relative overflow-visible transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? isLike
            ? "bg-indigo-500 text-white shadow-lg"
            : "bg-red-500 text-white shadow-lg"
          : "bg-gray-200 hover:bg-gray-300"
      }`}
      whileTap={{ scale: 0.9 }}
    >
      <motion.span
        animate={
          active
            ? isLike
              ? { scale: [1, 1.6, 1.2, 1] }
              : { rotate: [0, -10, 10, -6, 6, 0] }
            : {}
        }
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
      >
        {isLike ? "👍" : "👎"}
      </motion.span>

      <motion.span
        key={count}
        initial={{ scale: 0.8, y: -3 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
      >
        {count}
      </motion.span>

      <AnimatePresence>
        {burst && isLike && (
          <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            {PARTICLES.map((p, i) => {
              const angle = (i / PARTICLES.length) * 360;
              const distance = 30 + Math.random() * 20;
              return (
                <motion.span
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    x: Math.cos((angle * Math.PI) / 180) * distance,
                    y: Math.sin((angle * Math.PI) / 180) * distance - 20,
                    scale: 1,
                    opacity: 0
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute text-sm"
                >
                  {p}
                </motion.span>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default ReactionButton;