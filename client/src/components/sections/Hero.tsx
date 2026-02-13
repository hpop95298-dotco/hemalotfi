import Typewriter from "typewriter-effect";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import ParticleBackground from "../ParticleBackground";

export default function Hero() {
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
            Future Ready Developer
          </h2>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-display text-5xl md:text-7xl lg:text-9xl font-bold text-white mb-6 relative inline-block"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
            IBRAHIM LOTFI
          </span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-gray-400 font-body h-12 flex justify-center items-center gap-2"
        >
          <span>I build</span>
          <span className="text-primary">
            <Typewriter
              options={{
                strings: [
                  "Artificial Intelligence",
                  "Futuristic Web Apps",
                  "Digital Experiences",
                  "Neural Networks",
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
            <span className="relative z-10">View Work</span>
            <div className="absolute inset-0 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 -z-0"></div>
          </a>
          <a
            href="#contact"
            className="px-8 py-3 bg-transparent border border-white/20 text-white font-body font-bold uppercase tracking-wider hover:border-white transition-all duration-300 rounded-sm"
          >
            Contact Me
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-gray-500"
      >
        <ArrowDown size={24} />
      </motion.div>
    </section>
  );
}
