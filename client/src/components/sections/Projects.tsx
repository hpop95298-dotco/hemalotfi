import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { useTranslation } from "react-i18next";

export default function Projects() {
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
    const base = selectedTech === "All" 
      ? projects 
      : projects.filter(p => (p.technologies as string[] | null)?.includes(selectedTech));
    return base.slice(0, 6);
  }, [selectedTech, projects]);

  if (isLoading) return <div className="py-20 text-center">{t("common.loading", "Loading projects...")}</div>;

  return (
    <section id="projects" className="py-24 bg-background relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-end mb-16"
        >
          <div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              {t("projects.title")} <span className="text-primary">{t("projects.subtitle")}</span>
            </h2>
            <p className="text-muted-foreground font-body">{t("projects.desc_1")}</p>
          </div>
        </motion.div>

        {/* 👇 Filtering Bar */}
        <div className="flex flex-wrap gap-3 mb-12">
          {technologies.map((tech) => (
            <button
              key={tech}
              onClick={() => setSelectedTech(tech)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                selectedTech === tech
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/50 text-muted-foreground hover:bg-card/80 border border-border"
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
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative rounded-2xl overflow-hidden bg-card/30 border border-border hover:border-primary/50 transition-all duration-500"
            >
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-black/50 group-hover:bg-transparent transition-all duration-500 z-10" />
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
                      className="text-xs px-2 py-1 bg-card/50 rounded border border-border text-foreground/80"
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

        <div className="mt-16 text-center">
          <Link href="/projects">
            <a className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-black font-bold uppercase tracking-widest rounded-sm hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(0,229,255,0.2)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)]">
              {t("projects.view_all", "View All Projects")} 
              {i18n.language === "ar" ? "←" : "→"}
            </a>
          </Link>
        </div>
      </div>
    </section>
  );
}
