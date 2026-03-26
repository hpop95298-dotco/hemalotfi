import { motion } from "framer-motion";
import { ExternalLink, Github, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";

export default function ProjectsPage() {
  const { t, i18n } = useTranslation();
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const [selectedTech, setSelectedTech] = useState<string>("All");

  const technologies = useMemo(() => {
    const techs = new Set<string>(["All"]);
    projects?.forEach(p => (p.technologies as string[] | null)?.forEach(t => techs.add(t)));
    return Array.from(techs);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (selectedTech === "All") return projects;
    return projects.filter(p => (p.technologies as string[] | null)?.includes(selectedTech));
  }, [selectedTech, projects]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">{t("common.loading", "Loading projects...")}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="fixed inset-0 z-0">
        <ParticleBackground />
      </div>

      <main className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/">
              <a className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group">
                {i18n.language === "ar" ? <ArrowRight size={20} className="transform group-hover:translate-x-1 transition-transform" /> : <ArrowLeft size={20} className="transform group-hover:-translate-x-1 transition-transform" />}
                {t("projects.back_home")}
              </a>
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-end mb-16">
              <div>
                <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
                  {t("projects.title")} <span className="text-primary">{t("projects.subtitle")}</span>
                </h1>
                <p className="text-muted-foreground font-body text-lg max-w-2xl">{t("projects.desc_1")}</p>
              </div>
            </div>

            {/* 👇 Filtering Bar */}
            <div className="flex flex-wrap gap-3 mb-12">
              {technologies.map((tech) => (
                <button
                  key={tech}
                  onClick={() => setSelectedTech(tech)}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                    selectedTech === tech
                      ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,229,255,0.3)]"
                      : "bg-card/30 text-muted-foreground hover:bg-card/50 border border-border"
                  }`}
                >
                  {tech === "All" ? t("projects.filter_all") : tech}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group relative rounded-2xl overflow-hidden bg-card/20 border border-border/50 hover:border-primary/50 transition-all duration-500 backdrop-blur-sm"
                >
                  <div className="relative h-56 overflow-hidden">
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-all duration-500 z-10" />
                    <img
                      src={project.imageUrl || ""}
                      alt={project.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>

                  <div className="p-6 relative z-20">
                    <h3 className="font-display text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6 line-clamp-3 font-body">
                      {project.shortDescription}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {((project.technologies as string[]) || []).map((t: string) => (
                        <span
                          key={t}
                          className="text-xs px-2 py-1 bg-primary/10 rounded border border-primary/20 text-primary/80"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      <Link href={`/project/${project.slug}`}>
                        <a className="flex items-center gap-2 text-sm font-bold text-primary hover:underline transition-colors">
                          {t("projects.view_details")}
                        </a>
                      </Link>
                      {project.liveUrl && project.liveUrl !== "#" && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink size={16} /> {t("projects.live_demo")}
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="py-12 border-t border-border bg-background/50 backdrop-blur-sm relative z-10 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} {i18n.language === "ar" ? "إبراهيم لطفي" : "Ibrahim Lotfi"}. {t("common.rights")}</p>
      </footer>
    </div>
  );
}
