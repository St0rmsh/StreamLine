import { useState } from "react";
import { ShieldCheck, ShieldAlert, FileText, BarChart3, ChevronDown, ChevronUp, Info, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AIInsightsPanel = ({ video }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  if (!video?.verification && !video?.transcript) {
    return (
      <div className="bg-stitch-grey p-6 rounded-2xl border border-border-main animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-2 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  const { summary, claims, finalVerdict, confidence } = video.verification || {};
  const trustScore = video.trustScore ?? 0;
  const deepfakeScore = video.deepfakeScore || 0;

  // trustScore is stored 0-100 already (per the model default); confidence from
  // the AI pipeline can arrive as either 0-1 or 0-100 depending on the LLM's
  // adherence to the prompt spec — normalize defensively.
  const normalizedConfidence = confidence > 1 ? confidence : (confidence || 0) * 100;

  const getVerdictStyles = (verdict) => {
    switch (verdict) {
      case "TRUE": return "bg-brand-green/10 text-brand-green border-brand-green/20";
      case "FALSE":
      case "DISINFORMATION": return "bg-brand-red/10 text-brand-red border-brand-red/20";
      case "PARTIALLY TRUE":
      case "MISINFORMATION": return "bg-brand-earth/10 text-brand-earth border-brand-earth/20";
      default: return "bg-stitch-grey text-text-muted border-border-main";
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-border-main overflow-hidden shadow-sm transition-all hover:shadow-md">
      {/* Header / Summary */}
      <div
        className="p-6 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl border ${getVerdictStyles(finalVerdict)}`}>
            {finalVerdict === "TRUE" ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-stitch-black tracking-tight">AI Content Intelligence</h3>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${getVerdictStyles(finalVerdict)}`}>
                {finalVerdict || "Analyzing"}
              </span>
            </div>
            <p className="text-sm text-text-muted line-clamp-1 font-medium mt-1">
              {summary || "Generating veracity report..."}
            </p>
          </div>
        </div>
        <div className="text-text-muted">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border-main"
          >
            <div className="p-6 space-y-8">

              {video.isAiGenerated && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-brand-earth/5 border border-brand-earth/20">
                  <Sparkles size={16} className="text-brand-earth shrink-0" />
                  <p className="text-xs font-bold text-brand-earth">
                    The creator has disclosed that this content involves AI generation.
                  </p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-stitch-grey rounded-2xl border border-border-main">
                  <div className="flex items-center gap-2 text-text-muted mb-2">
                    <BarChart3 size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Confidence</span>
                  </div>
                  <div className="text-xl font-display font-black">{normalizedConfidence.toFixed(0)}%</div>
                  <div className="w-full h-1 bg-gray-200 mt-2 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-orange" style={{ width: `${normalizedConfidence}%` }}></div>
                  </div>
                </div>

                <div className="p-4 bg-stitch-grey rounded-2xl border border-border-main">
                  <div className="flex items-center gap-2 text-text-muted mb-2">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Authenticity</span>
                  </div>
                  <div className="text-xl font-display font-black">{(100 - (deepfakeScore * 100)).toFixed(0)}%</div>
                  <div className="w-full h-1 bg-gray-200 mt-2 rounded-full overflow-hidden">
                    <div className={`h-full ${deepfakeScore > 0.4 ? 'bg-brand-red' : 'bg-brand-green'}`} style={{ width: `${100 - (deepfakeScore * 100)}%` }}></div>
                  </div>
                </div>

                <div className="p-4 bg-stitch-grey rounded-2xl border border-border-main">
                  <div className="flex items-center gap-2 text-text-muted mb-2">
                    <Info size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Trust Score</span>
                  </div>
                  <div className="text-xl font-display font-black">{trustScore}</div>
                  <div className="w-full h-1 bg-gray-200 mt-2 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-earth" style={{ width: `${trustScore}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Full Summary */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
                  <FileText size={12} />
                  Detailed Analysis
                </h4>
                <p className="text-sm leading-relaxed text-stitch-grey-dark font-medium antialiased">
                  {summary || "No summary generated for this video yet."}
                </p>
              </div>

              {/* Claims List */}
              {claims?.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Key Fact Checks</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {claims.map((claim, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white border border-border-main flex gap-4 items-start shadow-sm">
                        <div className={`mt-1 ${claim.verdict === 'TRUE' ? 'text-brand-green' : 'text-brand-red'}`}>
                          {claim.verdict === 'TRUE' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-stitch-black leading-tight mb-1">{claim.text}</p>
                          <p className="text-[11px] text-text-muted leading-relaxed">{claim.explanation}</p>
                          {claim.sources?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {claim.sources.slice(0, 3).map((s, si) => (
                                
                                <a  key={si}
                                  href={s}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] font-bold text-indigo-500 hover:underline truncate max-w-[140px]"
                                >
                                  {(() => { try { return new URL(s).hostname; } catch { return s; } })()}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript Toggle */}
              {video.transcript && (
                <div className="pt-4 mt-4 border-t border-border-main">
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-earth hover:text-brand-orange transition-colors"
                  >
                    <FileText size={14} />
                    {showTranscript ? "Hide Transcript" : "View Full Transcript"}
                  </button>
                  <AnimatePresence>
                    {showTranscript && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-4 bg-stitch-grey rounded-2xl text-xs text-stitch-grey-dark leading-relaxed font-medium max-h-60 overflow-y-auto"
                      >
                        {video.transcript}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIInsightsPanel;