import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CRITICAL_ASSETS = [
  "/Assets/no bg logo.png",
  "/Assets/Images/heros/hero1.jpeg",
  "/Assets/Images/heros/hero2.jpeg",
];

const CACHE_FLAG = "nova_assets_loaded";

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  /* Skip the splash on repeat visits — assets are already cached */
  useEffect(() => {
    let skip = false;
    try {
      skip = sessionStorage.getItem(CACHE_FLAG) === "1";
    } catch {
      /* ignore */
    }
    if (skip) {
      onComplete();
    }
  }, [onComplete]);

  useEffect(() => {
    let count = 0;
    let mounted = true;
    const total = CRITICAL_ASSETS.length;

    const handleLoaded = () => {
      if (!mounted) return;
      count++;
      setLoadedCount(count);
      const percent = Math.round((count / total) * 100);
      setProgress(percent);
      if (count === total) {
        try {
          sessionStorage.setItem(CACHE_FLAG, "1");
        } catch {
          /* ignore */
        }
        setTimeout(() => {
          if (!mounted) return;
          setIsFinished(true);
          setTimeout(() => onComplete(), 350);
        }, 300);
      }
    };

    CRITICAL_ASSETS.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = handleLoaded;
      img.onerror = handleLoaded; // never hang on a failed asset
    });

    return () => {
      mounted = false;
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isFinished && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "linear-gradient(135deg, #0b1320 0%, #162944 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
          }}
        >
          {/* Logo Pulse Animation */}
          <motion.img
            src="/Assets/no bg logo.png"
            alt="Nova Store"
            animate={{
              scale: [0.98, 1.05, 0.98],
              filter: [
                "drop-shadow(0 0 12px rgba(51, 153, 212, 0.4))",
                "drop-shadow(0 0 32px rgba(51, 153, 212, 0.85))",
                "drop-shadow(0 0 12px rgba(51, 153, 212, 0.4))",
              ],
            }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            style={{
              height: 145,
              width: "auto",
              marginBottom: "2rem",
              objectFit: "contain",
            }}
          />

          {/* Progress Spinner & Percentage */}
          <div
            style={{
              position: "relative",
              width: 90,
              height: 90,
              marginBottom: "1.5rem",
            }}
          >
            <svg width="90" height="90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="6"
                fill="none"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                stroke="#3399D4"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * progress) / 100}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "#EAF1F9",
              }}
            >
              {progress}%
            </div>
          </div>

          <div
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#B8C7DD",
              letterSpacing: "0.05em",
            }}
          >
            Preloading High-Resolution Store Assets ({loadedCount}/
            {CRITICAL_ASSETS.length})
          </div>

          {/* Loading Bar Slider */}
          <div
            style={{
              width: 240,
              height: 4,
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: 2,
              marginTop: "1rem",
              overflow: "hidden",
            }}
          >
            <motion.div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #3399D4, #34A2DF)",
                borderRadius: 2,
                width: `${progress}%`,
              }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
