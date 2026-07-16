import { motion } from "framer-motion";
import { Activity } from "lucide-react";

const TrustMeter = ({ score = 0, type = "trust" }) => {
  const isTrust = type === "trust";

  // Accept either a 0-1 fraction or a 0-100 value defensively, since callers
  // in this app pass both shapes (e.g. Dashboard divides by 100 before calling this).
  const normalizedScore = Math.min(100, Math.max(0, score <= 1 ? score * 100 : score));

  const color = "#FFFFFF"; // High-Contrast White — Forensic Editorial palette

  return (
    <div className="bg-white/[0.03] backdrop-blur-3xl p-8 border border-white/5 rounded-sm relative overflow-hidden group h-full flex flex-col justify-center">
      <div className="absolute -top-10 -right-10 w-32 h-32 blur-[60px] opacity-5 bg-white transition-all duration-700 group-hover:opacity-10" />

      <div className="flex flex-col items-center gap-8 relative z-10">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="72" cy="72" r="68"
              fill="transparent"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="2"
            />
            <motion.circle
              cx="72" cy="72" r="68"
              fill="transparent"
              stroke={color}
              strokeWidth="2"
              strokeDasharray="427.04"
              initial={{ strokeDashoffset: 427.04 }}
              animate={{ strokeDashoffset: 427.04 - (427.04 * normalizedScore) / 100 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              strokeLinecap="butt"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-5xl font-black tracking-tighter text-white leading-none">
              {Math.round(normalizedScore)}<span className="text-xs opacity-20 ml-1">%</span>
            </span>
            <div className="w-8 h-[1px] bg-white/20 my-2" />
            <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-zinc-500">
              {isTrust ? "Confidence" : "Synthetic"}
            </span>
          </div>
        </div>

        <div className="w-full space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-3">
              <Activity className="w-3 h-3 text-white/40" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white">
                {isTrust ? "Confidence Score" : "Verification"}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500 leading-relaxed font-medium uppercase tracking-wider">
            {isTrust
              ? "Verified against trusted sources. Data integrity confirmed."
              : "Detected patterns consistent with AI generation."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrustMeter;