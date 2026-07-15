import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hook/useAuth.js";
import { useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, ShieldCheck, ArrowRight } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleLogin } = useAuth();
  const { loading } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [focused, setFocused] = useState(null);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return;

    try {
      await handleLogin({
        email: form.email,
        password: form.password
      });
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#000000] font-sans overflow-x-hidden relative selection:bg-[#FF4D00] selection:text-white">
      {/* Editorial Background Text */}
      <div className="absolute top-10 left-10 opacity-[0.03] pointer-events-none select-none">
        <h1 className="text-[20vw] font-black leading-none tracking-tighter text-white uppercase">
          ANTIGRAVITY
        </h1>
      </div>

      <main className="flex-1 flex items-center justify-center p-6 md:p-12 z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-0 border border-white/10 bg-white/[0.02] backdrop-blur-3xl overflow-hidden"
        >
          {/* Left: Metadata Section (Editorial Style) */}
          <div className="md:col-span-5 p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-16">
                <div className="w-1 h-8 bg-[#FF4D00]"></div>
                <span className="text-sm font-black tracking-[0.3em] text-white uppercase">Identity.Protocol</span>
              </div>

              <h2 className="text-5xl font-black text-white leading-[0.9] tracking-tighter mb-8 uppercase">
                Access <br /> <span className="text-[#FF4D00]">Verified</span> <br /> Node
              </h2>

              <div className="space-y-6 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                <p className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00C853] rounded-full"></span>
                  Forensic Mode: Enabled
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                  Signal Status: encrypted
                </p>
              </div>
            </div>

            <div className="mt-12">
              <p className="text-[9px] text-gray-600 uppercase tracking-[0.3em] leading-relaxed">
                Auth code: 0x99281-AG <br />
                Location: [REDACTED]
              </p>
            </div>
          </div>

          {/* Right: Interaction Section */}
          <div className="md:col-span-7 p-8 md:p-16 flex flex-col justify-center">
            <header className="mb-12">
              <p className="text-[#00C853] text-[10px] font-black uppercase tracking-[0.4em] mb-4">Secure Access</p>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Login</h3>
            </header>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-8">
                <div className="relative group">
                  <label className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 block transition-all duration-300 ${focused === 'email' ? 'text-[#FF4D00]' : 'text-gray-500'}`}>
                    Email or Username
                  </label>
                  <input
                    name="email"
                    type="text"
                    value={form.email}
                    onChange={handleChange}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="Enter your email"
                    className="w-full bg-transparent border-b border-white/10 py-4 text-white font-bold placeholder:text-white/5 outline-none transition-all duration-500 focus:border-[#FF4D00] text-sm tracking-widest"
                    required
                  />
                </div>

                <div className="relative group">
                  <div className="flex justify-between items-center mb-3">
                    <label className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300 ${focused === 'password' ? 'text-[#FF4D00]' : 'text-gray-500'}`}>
                      Password
                    </label>
                    <button type="button" className="text-[9px] font-bold text-gray-600 hover:text-white transition-colors uppercase tracking-widest">Forgot Password?</button>
                  </div>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="Enter your password"
                    className="w-full bg-transparent border-b border-white/10 py-4 text-white font-bold placeholder:text-white/5 outline-none transition-all duration-500 focus:border-[#FF4D00] text-sm tracking-widest"
                    required
                  />
                </div>
              </div>

              <div className="pt-6">
                <motion.button
                  whileHover={{ backgroundColor: "#FFFFFF", color: "#000000" }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF4D00] text-white py-6 px-8 flex items-center justify-between transition-colors duration-500 disabled:opacity-60"
                >
                  <span className="text-sm font-black uppercase tracking-[0.3em]">
                    {loading ? "Logging In..." : "Login"}
                  </span>
                  {!loading && <ArrowRight size={20} />}
                </motion.button>
              </div>
            </form>

            <footer className="mt-16 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-white/5 pt-8">
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                Don't have an account?
              </p>
              <button
                onClick={() => navigate("/register")}
                className="text-white text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/20 hover:border-[#00C853] hover:text-[#00C853] transition-all pb-1"
              >
                Register
              </button>
            </footer>
          </div>
        </motion.div>
      </main>

      {/* Footer Branding */}
      <footer className="p-10 flex justify-between items-end border-t border-white/5 bg-black">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-white tracking-[0.5em] uppercase">ANTIGRAVITY // 2026</p>
          <p className="text-[8px] text-gray-700 tracking-[0.3em] uppercase">Forensic AI Intelligence Pipeline</p>
        </div>
        <div className="flex gap-8 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
          <span className="hover:text-white cursor-pointer transition-colors">Protocol</span>
          <span className="hover:text-white cursor-pointer transition-colors">Safety</span>
          <span className="hover:text-white cursor-pointer transition-colors">Terminals</span>
        </div>
      </footer>
    </div>
  );
};

export default Login;