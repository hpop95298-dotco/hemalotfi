import { motion } from "framer-motion";
import avatar from "@/assets/avatar-placeholder.png";

export default function About() {
  return (
    <section id="about" className="py-24 bg-background relative overflow-hidden">
      {/* Decorative Line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center gap-16"
        >
          {/* Image */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-end" data-aos="fade-right">
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-2 border-2 border-secondary/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
              <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-background shadow-2xl shadow-primary/20">
                <img src={avatar} alt="Ibrahim Lotfi" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="w-full md:w-1/2" data-aos="fade-left">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              About <span className="text-primary">Me</span>
            </h2>
            <div className="space-y-6 text-gray-400 font-body text-lg leading-relaxed glass-card p-8 rounded-2xl border-l-4 border-l-primary">
              <p>
                I am a visionary Computer Science student with a passion for <strong className="text-white">Artificial Intelligence</strong> and <strong className="text-white">High-End Web Development</strong>.
              </p>
              <p>
                My work bridges the gap between raw data and immersive user experiences. I don't just write code; I architect digital ecosystems that feel alive, responsive, and futuristic.
              </p>
              
              <div className="pt-4 flex gap-8">
                <div>
                  <h3 className="text-3xl font-display font-bold text-white">03+</h3>
                  <p className="text-sm uppercase tracking-wider text-gray-500">Years Exp</p>
                </div>
                <div>
                  <h3 className="text-3xl font-display font-bold text-white">15+</h3>
                  <p className="text-sm uppercase tracking-wider text-gray-500">Projects</p>
                </div>
                <div>
                  <h3 className="text-3xl font-display font-bold text-white">100%</h3>
                  <p className="text-sm uppercase tracking-wider text-gray-500">Dedication</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
