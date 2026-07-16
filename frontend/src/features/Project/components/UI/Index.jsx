import { motion } from "framer-motion";
import { forwardRef } from "react";

export const Card = ({ children, className = "" }) => (
  <div className={`glass rounded-[2rem] border border-main shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 md:p-8 ${className}`}>{children}</div>
);

export const Button = forwardRef(({ children, className = "", variant = "primary", disabled = false, ...props }, ref) => {
  const variants = {
    primary: "bg-black text-white hover:bg-black/90",
    brand: "bg-brand-orange text-white shadow-lg shadow-brand-orange/20 hover:scale-[1.02] active:scale-[0.98]",
    ghost: "bg-transparent border border-main text-main hover:bg-surface-low",
    danger: "bg-brand-red/10 text-brand-red border border-brand-red/20 hover:bg-brand-red/20",
    success: "bg-brand-green/10 text-brand-green border border-brand-green/20 hover:bg-brand-green/20"
  };

  return (
    <motion.button
      ref={ref}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      disabled={disabled}
      className={`px-6 py-2.5 rounded-2xl font-bold text-sm tracking-tight transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
});
Button.displayName = "Button";

export const Input = forwardRef(({ label, icon: Icon, error, className = "", ...props }, ref) => (
  <div className="space-y-2 w-full">
    {label && (
      <label className="text-[10px] font-black uppercase tracking-widest text-muted px-1">
        {label}
      </label>
    )}
    <div className="relative group">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-brand-orange transition-colors">
          <Icon size={18} />
        </div>
      )}
      <input
        ref={ref}
        className={`w-full ${Icon ? 'pl-12' : 'px-5'} pr-5 py-3 rounded-2xl bg-surface-low border text-main placeholder:text-muted/50 focus:ring-2 focus:ring-brand-orange/30 outline-none transition-all duration-300 ${error ? 'border-brand-red focus:border-brand-red' : 'border-main focus:border-brand-orange/40'} ${className}`}
        {...props}
      />
    </div>
    {error && (
      <p className="text-[10px] font-bold text-brand-red px-1">{error}</p>
    )}
  </div>
));
Input.displayName = "Input";