import Typewriter from "typewriter-effect";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import ParticleBackground from "../ParticleBackground";
import { useTranslation } from "react-i18next";

export default function Hero() {
  const { t, i18n } = useTranslation();

  return (
    <section id="hero" className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      <ParticleBackground />
      
      {/* Background Gradient Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] animate-pulse delay-1000" />

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-primary font-body tracking-[0.2em] text-sm md:text-base mb-4 uppercase">
            {t("hero.subtitle")}
          </h2>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-display text-5xl md:text-7xl lg:text-9xl font-bold text-foreground mb-6 relative inline-block"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/50">
            {t("hero.title")}
          </span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-muted-foreground font-body h-12 flex justify-center items-center gap-2"
        >
          <span>{t("hero.build")}</span>
          <span className="text-primary min-w-[200px] inline-block">
            <Typewriter
              key={i18n.language} // Re-init on lang change
              options={{
                strings: [
                  t("hero.typewriter.ai"),
                  t("hero.typewriter.web"),
                  t("hero.typewriter.digital"),
                ],
                autoStart: true,
                loop: true,
                delay: 50,
              }}
            />
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 flex justify-center gap-6"
        >
          <a
            href="#projects"
            className="px-8 py-3 bg-primary/10 border border-primary/50 text-primary font-body font-bold uppercase tracking-wider hover:bg-primary hover:text-black transition-all duration-300 rounded-sm relative overflow-hidden group"
          >
            <span className="relative z-10">{t("hero.cta_work")}</span>
            <div className="absolute inset-0 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 -z-0"></div>
          </a>
          <a
            href="#contact"
            className="px-8 py-3 bg-transparent border border-border text-foreground font-body font-bold uppercase tracking-wider hover:border-primary transition-all duration-300 rounded-sm"
          >
            {t("hero.cta_contact")}
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground"
      >
        <ArrowDown size={24} />
      </motion.div>
    </section>
  );
}
