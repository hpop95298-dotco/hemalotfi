import { useTranslation } from "react-i18next";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Languages } from "lucide-react";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const [isProcessing, setIsProcessing] = useState(false);

  const toggleLanguage = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Trigger Aurora Sweep Transition
    window.dispatchEvent(new CustomEvent("portal-transition"));
    
    // Switch language exactly when the wave is central (approx 750ms)
    setTimeout(() => {
      const newLang = i18n.language === "en" ? "ar" : "en";
      i18n.changeLanguage(newLang);
      document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = newLang;
    }, 750);

    // Reset processing state after animation (match App.tsx 2s)
    setTimeout(() => setIsProcessing(false), 2000);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleLanguage}
      className="relative flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all duration-300 group overflow-hidden"
    >
      <Languages size={16} className="text-primary group-hover:rotate-12 transition-transform duration-300" />
      <div className="flex items-center text-xs font-bold font-display uppercase tracking-wider">
        <AnimatePresence mode="wait">
          <motion.span
            key={i18n.language}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-white"
          >
            {i18n.language === "en" ? "AR" : "EN"}
          </motion.span>
        </AnimatePresence>
      </div>
      
      {/* Subtle Glow Effect */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.button>
  );
}
