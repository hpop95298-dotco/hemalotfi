import { motion } from "framer-motion";
import avatar from "@/assets/hema.png";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

export default function About() {
  const { t, i18n } = useTranslation();
  
  const { data: stats } = useQuery<{ visits: number; projects: number }>({
    queryKey: ["/api/stats"],
  });

  const experienceYears = new Date().getFullYear() - 2022;
  const projectDisplay = (stats?.projects || 0) > 10 ? `${stats?.projects}+` : "10+";
  const visitDisplay = stats?.visits ? (stats.visits > 1000 ? `${(stats.visits / 1000).toFixed(1)}k+` : `${stats.visits}+`) : "500+";

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
              {t("about.title")} <span className="text-primary">{t("about.me")}</span>
            </h2>
            <div className="space-y-6 text-muted-foreground font-body text-lg leading-relaxed glass-card p-8 rounded-2xl border-l-4 border-l-primary/50">
              <p>
                {t("about.desc_1")}
              </p>
              <p>
                {t("about.desc_2")}
              </p>
              
              <div className="pt-4 grid grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-3xl font-display font-bold text-foreground">{experienceYears}+</h3>
                  <p className="text-sm uppercase tracking-wider text-muted-foreground">{t("about.stats.years")}</p>
                </div>
                <div>
                  <h3 className="text-3xl font-display font-bold text-foreground">{projectDisplay}</h3>
                  <p className="text-sm uppercase tracking-wider text-muted-foreground">{t("about.stats.projects")}</p>
                </div>
                <div>
                  <h3 className="text-3xl font-display font-bold text-foreground">{visitDisplay}</h3>
                  <p className="text-sm uppercase tracking-wider text-muted-foreground">{t("about.stats.visitors")}</p>
                </div>
                <div>
                  <h3 className="text-3xl font-display font-bold text-foreground">100%</h3>
                  <p className="text-sm uppercase tracking-wider text-muted-foreground">{t("about.stats.dedication")}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
