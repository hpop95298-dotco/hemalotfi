import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ExternalLink, Github, Loader2, Calendar, Tag } from "lucide-react";
import type { Project } from "@shared/schema";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";
import { useTranslation } from "react-i18next";

export default function ProjectDetails() {
  const { t, i18n } = useTranslation();
  const [, params] = useRoute("/project/:slug");
  const slug = params?.slug;

  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: [`/api/projects/${slug}`],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-6">
        <h1 className="text-4xl font-display font-bold mb-4">{t("projects.details_not_found")}</h1>
        <Link href="/">
          <a className="text-primary hover:underline flex items-center gap-2">
            {i18n.language === "ar" ? <ArrowRight size={20} /> : <ArrowLeft size={20} />} 
            {t("projects.back_home")}
          </a>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
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
            <Link href="/#projects">
              <a className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group">
                {i18n.language === "ar" ? (
                  <ArrowRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
                ) : (
                  <ArrowLeft size={20} className="transform group-hover:-translate-x-1 transition-transform" />
                )}
                {t("projects.back_projects")}
              </a>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Main Info */}
              <div>
                <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
                  {project.title}
                </h1>
                
                <p className="text-xl text-muted-foreground font-body mb-8 leading-relaxed">
                  {project.shortDescription}
                </p>

                <div className="flex flex-wrap gap-6 mb-12">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar size={18} className="text-primary" />
                    <span className="text-sm">{project.createdAt ? new Date(project.createdAt).toLocaleDateString(i18n.language) : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Tag size={18} className="text-primary" />
                    <span className="text-sm">{t("projects.featured")}</span>
                  </div>
                </div>

                <div className="flex gap-6 text-initial">
                  {project.liveUrl && project.liveUrl !== "#" && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full hover:scale-105 transition-transform"
                    >
                      <ExternalLink size={20} /> {t("projects.live_demo")}
                    </a>
                  )}
                  {project.githubUrl && project.githubUrl !== "#" && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-card/50 hover:bg-card border border-border font-bold rounded-full transition-all"
                    >
                      <Github size={20} /> {t("projects.source_code")}
                    </a>
                  )}
                </div>
              </div>

              {/* Project Image/Preview */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-purple-500/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video">
                  <img
                    src={project.imageUrl || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop"}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Detailed Description */}
            <div className="mt-24">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                  <h2 className="text-2xl font-display font-bold mb-6 text-primary">{t("projects.about")}</h2>
                  <div className="prose prose-invert max-w-none text-muted-foreground font-body leading-loose">
                    {project.fullDescription || project.shortDescription}
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-display font-bold mb-6 text-primary">{t("projects.tech_stack")}</h2>
                  <div className="flex flex-wrap gap-3">
                    {project.technologies?.map((tech) => (
                      <span
                        key={tech}
                        className="px-4 py-2 bg-card/50 border border-border rounded-lg text-sm font-body hover:border-primary/50 transition-colors"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
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
