import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface PortalTransitionProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export default function PortalTransition({ isVisible, onComplete }: PortalTransitionProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          onAnimationComplete={() => {
            if (!isVisible && onComplete) onComplete();
          }}
          className="fixed inset-0 z-[9999] bg-background pointer-events-none flex items-center justify-center overflow-hidden"
        >
          {/* Scanning Beam */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-primary/30 to-transparent skew-x-12"
          />

          <div className="relative">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="text-primary font-display text-4xl font-bold tracking-[0.5em] uppercase"
            >
              Initializing...
            </motion.div>
            
            {/* HUD Elements */}
            <div className="absolute -inset-10 border border-primary/20 rounded-full animate-ping opacity-20" />
            <div className="absolute -inset-20 border border-primary/10 rounded-full animate-pulse opacity-10" />
          </div>

          {/* Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
