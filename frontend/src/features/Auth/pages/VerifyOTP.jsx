import { useAuth } from "../hook/useAuth.js";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, RefreshCcw } from "lucide-react";

const VerifyOTP = () => {
  const { handleVerifyOTP } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [focused, setFocused] = useState(false);

  // Prevent access without email (refresh case)
  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      return;
    }

    try {
      await handleVerifyOTP({ email, otp });
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#000000] font-sans overflow-x-hidden relative selection:bg-[#FF4D00] selection:text-white">
      {/* Editorial Background Text */}
      <div className="absolute top-10 left-10 opacity-[0.03] pointer-events-none select-none">
        <h1 className="text-[18vw] font-black leading-none tracking-tighter text-white uppercase">
          VERIFY
        </h1>
      </div>

      <main className="flex-1 flex items-center justify-center p-6 md:p-12 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-0 border border-white/10 bg-white/[0.02] backdrop-blur-3xl overflow-hidden"
        >
          {/* Left: Metadata Section */}
          <div className="md:col-span-5 p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-16">
                <div className="w-1 h-8 bg-[#FF4D00]"></div>
                <span className="text-sm font-black tracking-[0.3em] text-white uppercase">Auth.Verification</span>
              </div>
              
              <h2 className="text-5xl font-black text-white leading-[0.9] tracking-tighter mb-8 uppercase">
                Identity <br /> <span className="text-[#00C853]">Validation</span> <br /> Node
              </h2>
              
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Email Target:</p>
                <div className="p-4 border border-white/5 bg-white/[0.01] text-xs font-mono text-[#00C853] break-all">
                  {email}
                </div>
              </div>
            </div>

            <div className="mt-12">
              <p className="text-[9px] text-gray-600 uppercase tracking-[0.3em] leading-relaxed">
                Verification Protocol v1.0 <br />
                Challenge: 6-DIGIT_OTP
              </p>
            </div>
          </div>

          {/* Right: Interaction Section */}
          <div className="md:col-span-7 p-8 md:p-16 flex flex-col justify-center">
            <header className="mb-12">
              <p className="text-[#FF4D00] text-[10px] font-black uppercase tracking-[0.4em] mb-4">Input Required</p>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Enter Code</h3>
            </header>

            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="relative">
                <label className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 block transition-all duration-300 ${focused ? 'text-[#FF4D00]' : 'text-gray-500'}`}>
                  Verification Signal
                </label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  className="w-full bg-transparent border-b border-white/10 py-6 text-white font-black placeholder:text-white/5 outline-none transition-all duration-500 focus:border-[#FF4D00] text-5xl tracking-[0.5em] font-mono text-center sm:text-left"
                />
              </div>

              <div className="pt-6">
                <motion.button
                  whileHover={{ backgroundColor: "#FFFFFF", color: "#000000" }}
                  type="submit"
                  disabled={otp.length !== 6}
                  className={`w-full py-6 px-8 flex items-center justify-between transition-colors duration-500 ${otp.length === 6 ? 'bg-[#00C853] text-black' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
                >
                  <span className="text-sm font-black uppercase tracking-[0.3em]">
                    Verify Signal
                  </span>
                  <ArrowRight size={20} />
                </motion.button>
              </div>
            </form>

            <footer className="mt-16 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-t border-white/5 pt-8">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Didn't receive signal?</p>
                <button 
                  className="flex items-center gap-2 text-white text-[9px] font-black uppercase tracking-[0.2em] hover:text-[#FF4D00] transition-colors"
                  onClick={() => console.log("Resend OTP")}
                >
                  <RefreshCcw size={12} />
                  Resend Code
                </button>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-all border-b border-transparent hover:border-white/20 pb-1"
              >
                Return to Login
              </button>
            </footer>
          </div>
        </motion.div>
      </main>

      {/* Footer Branding */}
      <footer className="p-10 flex justify-between items-end border-t border-white/5 bg-black">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-white tracking-[0.5em] uppercase">STITCH // AUTH</p>
          <p className="text-[8px] text-gray-700 tracking-[0.3em] uppercase">Verified Identity Node</p>
        </div>
      </footer>
    </div>
  );
};

export default VerifyOTP;
