import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";

const LenisContext = createContext(null);

export const useLenis = () => {
  const ctx = useContext(LenisContext);
  if (!ctx) {
    // Not fatal — components can render before/without the provider in tests etc.
    return { lenis: null, stop: () => {}, start: () => {}, scrollTo: () => {} };
  }
  return ctx;
};

const LenisProvider = ({ children }) => {
  const lenisRef = useRef(null);
  const rafIdRef = useRef(null);
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Respect accessibility preference — don't force smooth-scroll physics
    // on users who've asked the OS for reduced motion.
    if (prefersReducedMotion) {
      setReady(true);
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
      autoRaf: false, // we drive the loop ourselves so we can cancel it cleanly
    });

    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      rafIdRef.current = requestAnimationFrame(raf);
    }
    rafIdRef.current = requestAnimationFrame(raf);
    setReady(true);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // 🔝 Reset scroll on every route change — plain window.scrollTo won't
  // work correctly once Lenis owns the scroll, so this has to go through
  // the Lenis instance itself.
  useEffect(() => {
    if (!ready) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, ready]);

  const stop = () => lenisRef.current?.stop();
  const start = () => lenisRef.current?.start();
  const scrollTo = (target, opts) => lenisRef.current?.scrollTo(target, opts);

  return (
    <LenisContext.Provider value={{ lenis: lenisRef.current, stop, start, scrollTo }}>
      {children}
    </LenisContext.Provider>
  );
};

export default LenisProvider;