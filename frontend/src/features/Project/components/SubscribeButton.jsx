import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { Bell, BellRing } from "lucide-react";

const SubscribeButton = ({ subscribed, loading, onClick, subscriberCount }) => {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const prevSubscribed = useRef(subscribed);
  const confettiIntervalRef = useRef(null);

  useEffect(() => {
    if (subscribed && !prevSubscribed.current && isSubscribing) {
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      confettiIntervalRef.current = setInterval(function () {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(confettiIntervalRef.current);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#818CF8', '#A855F7', '#10B981']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#818CF8', '#A855F7', '#10B981']
        });
      }, 250);

      setIsSubscribing(false);
    }
    prevSubscribed.current = subscribed;

    return () => clearInterval(confettiIntervalRef.current);
  }, [subscribed, isSubscribing]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setIsSubscribing(true);
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      disabled={loading}
      className={`
        relative px-6 py-2 rounded-full font-bold text-sm tracking-tight transition-all duration-300 overflow-hidden flex items-center gap-2.5 shadow-lg active:shadow-sm disabled:cursor-wait
        ${subscribed
          ? "bg-surface-low text-main border border-main"
          : "subscribe-button-active"
        }
      `}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        .subscribe-button-active { 
          background-color: var(--contrast-bg); 
          color: var(--contrast-text); 
        }
      `}} />

      <AnimatePresence mode="wait">
        {subscribed ? (
          <motion.div
            key="subscribed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2"
          >
            <BellRing className="w-3.5 h-3.5 text-brand-indigo" />
            <span>Subscribed{subscriberCount != null ? ` · ${subscriberCount.toLocaleString()}` : ""}</span>
          </motion.div>
        ) : (
          <motion.div
            key="subscribe"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Subscribe{subscriberCount != null ? ` · ${subscriberCount.toLocaleString()}` : ""}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!subscribed && (
        <motion.div
          className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/20 to-white/0 -translate-x-full"
          animate={{ x: '300%' }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 5 }}
        />
      )}

      {loading && (
        <div className="absolute inset-0 bg-surface/20 flex items-center justify-center backdrop-blur-[2px] z-10">
          <div className="w-3 h-3 border-2 border-brand-indigo border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </motion.button>
  );
};

export default SubscribeButton;