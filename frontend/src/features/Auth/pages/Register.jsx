import { useNavigate } from "react-router-dom";
import { useAuth } from "../hook/useAuth";
import { useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Shield, ArrowRight, Sparkles } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { handleRegister } = useAuth();
  const { loading } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: ""
  });

  const [focused, setFocused] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (form.name.trim().length < 2) errors.name = "Name must be at least 2 characters";
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) errors.username = "3-30 chars, letters/numbers/underscore only";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Enter a valid email";
    if (form.password.length < 6) errors.password = "At least 6 characters";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      await handleRegister({
        name: form.name,
        username: form.username,
        email: form.email,
        password: form.password
      });
      navigate("/verify-otp", { state: { email: form.email } });
    } catch (error) {
      console.error(error);
    }
  };

  const inputFields = [
    { name: "name", label: "Full Name", placeholder: "Your full name", type: "text" },
    { name: "username", label: "Username", placeholder: "Choose a username", type: "text" },
    { name: "email", label: "Email Address", placeholder: "Enter your email", type: "email" },
    { name: "password", label: "Password", placeholder: "Create a password", type: "password" },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#000000] font-sans overflow-x-hidden relative selection:bg-[#00C853] selection:text-black">
      {/* Editorial Background Text */}
      <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none select-none text-right">
        <h1 className="text-[15vw] font-black leading-none tracking-tighter text-white uppercase">
          JOIN <br /> ANTIGRAVITY
        </h1>
      </div>

      <main className="flex-1 flex items-center justify-center p-6 md:p-12 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-0 border border-white/10 bg-white/[0.02] backdrop-blur-3xl overflow-hidden"
        >
          {/* Left: Metadata Section (Editorial Style) */}
          <div className="md:col-span-4 p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between bg-white/[0.01]">
            <div>
              <div className="flex items-center gap-3 mb-16">
                <div className="w-8 h-1 bg-[#00C853]"></div>
                <span className="text-sm font-black tracking-[0.3em] text-white uppercase">Registration</span>
              </div>

              <h2 className="text-5xl font-black text-white leading-[0.9] tracking-tighter mb-8 uppercase">
                Create <br /> <span className="text-[#00C853]">Your</span> <br /> Account
              </h2>

              <div className="space-y-6 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                <p className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00C853] rounded-full animate-pulse"></span>
                  Access: Public
                </p>
                <p className="flex items-center gap-2 text-white/40">
                  <span className="w-1 h-1 bg-[#FF4D00] rounded-full"></span>
                  Secure Encryption
                </p>
              </div>
            </div>

            <div className="mt-12">
              <p className="text-[9px] text-gray-600 uppercase tracking-[0.3em] leading-relaxed">
                Antigravity v1.0 <br />
                User Protocol: verified
              </p>
            </div>
          </div>

          {/* Right: Interaction Section */}
          <div className="md:col-span-8 p-8 md:p-16 flex flex-col justify-center">
            <header className="mb-12">
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Account Setup</p>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Create Account</h3>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                {inputFields.map((field) => (
                  <div key={field.name} className="relative group">
                    <label className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 block transition-all duration-300 ${focused === field.name ? 'text-[#00C853]' : fieldErrors[field.name] ? 'text-[#FF4D00]' : 'text-gray-500'}`}>
                      {field.label}
                    </label>
                    <input
                      name={field.name}
                      type={field.type}
                      value={form[field.name]}
                      onChange={handleChange}
                      onFocus={() => setFocused(field.name)}
                      onBlur={() => setFocused(null)}
                      placeholder={field.placeholder}
                      className={`w-full bg-transparent border-b py-4 text-white font-bold placeholder:text-white/5 outline-none transition-all duration-500 text-sm tracking-widest ${fieldErrors[field.name] ? 'border-[#FF4D00]' : 'border-white/10 focus:border-[#00C853]'}`}
                    />
                    {fieldErrors[field.name] && (
                      <p className="text-[9px] font-bold text-[#FF4D00] mt-2 uppercase tracking-widest">{fieldErrors[field.name]}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-10">
                <motion.button
                  whileHover={{ backgroundColor: "#00C853", color: "#000000" }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black py-6 px-8 flex items-center justify-between transition-colors duration-500 disabled:opacity-60"
                >
                  <span className="text-sm font-black uppercase tracking-[0.3em]">
                    {loading ? "Creating Account..." : "Create Account"}
                  </span>
                  {!loading && <ArrowRight size={20} />}
                </motion.button>
              </div>
            </form>

            <footer className="mt-16 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-white/5 pt-8">
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                Already have an account?
              </p>
              <button
                onClick={() => navigate("/login")}
                className="text-white text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/20 hover:border-[#FF4D00] hover:text-[#FF4D00] transition-all pb-1"
              >
                Sign In
              </button>
            </footer>
          </div>
        </motion.div>
      </main>

      {/* Footer Branding */}
      <footer className="p-10 flex justify-between items-end border-t border-white/5 bg-black">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-white tracking-[0.5em] uppercase">STITCH // PROTOCOL</p>
          <p className="text-[8px] text-gray-700 tracking-[0.3em] uppercase">Secure Decentralized Verification</p>
        </div>
        <div className="flex gap-8 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
          <span className="hover:text-white cursor-pointer transition-colors">Manifesto</span>
          <span className="hover:text-white cursor-pointer transition-colors">Nodes</span>
          <span className="hover:text-white cursor-pointer transition-colors">Network</span>
        </div>
      </footer>
    </div>
  );
};

export default Register;