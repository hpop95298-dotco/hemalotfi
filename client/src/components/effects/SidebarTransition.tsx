import { motion, AnimatePresence } from "framer-motion";

interface SidebarTransitionProps {
  isVisible: boolean;
}

export default function SidebarTransition({ isVisible }: SidebarTransitionProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          {/* Main Aurora Wave */}
          <motion.div
            initial={{ x: "-180%" }}
            animate={{ x: "180%" }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 2, 
              ease: [0.65, 0, 0.35, 1],
              times: [0, 1] 
            }}
            className="absolute inset-y-0 w-[120%] bg-gradient-to-r from-transparent via-primary/40 to-transparent blur-[120px] mix-blend-screen"
            style={{
              background: `linear-gradient(90deg, 
                transparent 0%, 
                rgba(0, 243, 255, 0.2) 30%, 
                rgba(0, 243, 255, 0.6) 50%, 
                rgba(139, 92, 246, 0.5) 70%, 
                transparent 100%)`
            }}
          />

          {/* Secondary Soft Glow */}
          <motion.div
            initial={{ x: "-180%", opacity: 0 }}
            animate={{ x: "180%", opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 2.2, 
              ease: "easeInOut",
              delay: 0.1
            }}
            className="absolute inset-y-0 w-full bg-gradient-to-r from-transparent via-secondary/20 to-transparent blur-[150px]"
          />

          {/* Central Refraction Line (Subtle) */}
          <motion.div
             initial={{ x: "-180%" }}
             animate={{ x: "180%" }}
             transition={{ duration: 1.8, ease: "easeInOut" }}
             className="absolute inset-y-0 w-1 bg-white/20 blur-md z-[101]"
          />
        </div>
      )}
    </AnimatePresence>
  );
}
