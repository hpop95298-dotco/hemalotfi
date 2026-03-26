import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Loader2, Calendar, User, ArrowRight, ArrowLeft } from "lucide-react";
import type { Post } from "@shared/schema";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";
import SEO from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export default function Blog() {
  const { t, i18n } = useTranslation();
  const { data: posts, isLoading, error } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <SEO 
        title={t("blog.seo_title")} 
        description={t("blog.seo_desc")} 
      />
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
            className="mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
              {t("blog.title")} <span className="text-primary">{t("blog.subtitle")}</span>
            </h1>
            <p className="text-xl text-muted-foreground font-body max-w-2xl leading-relaxed">
              {t("blog.desc_1")}
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500 font-body">
              {t("blog.error")}
            </div>
          ) : !posts || posts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground font-body">
              {t("blog.empty")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative rounded-2xl overflow-hidden bg-card/30 border border-border hover:border-primary/50 transition-all duration-500 flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.imageUrl || "https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=1000&auto=format&fit=crop"}
                      alt={post.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-background/40 group-hover:bg-transparent transition-colors" />
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} className="text-primary" />
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString(i18n.language) : 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={14} className="text-primary" />
                        {post.author}
                      </span>
                    </div>

                    <h2 className="text-xl font-display font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>

                    <p className="text-muted-foreground text-sm mb-6 line-clamp-3 font-body flex-grow">
                      {post.excerpt}
                    </p>

                    <Link href={`/blog/${post.slug}`}>
                      <a className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline group/link">
                        {t("blog.read_more")} 
                        {i18n.language === "ar" ? (
                          <ArrowLeft size={16} className="transform group-hover/link:-translate-x-1 transition-transform" />
                        ) : (
                          <ArrowRight size={16} className="transform group-hover/link:translate-x-1 transition-transform" />
                        )}
                      </a>
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="py-12 border-t border-border text-center text-muted-foreground text-sm relative z-10">
        <p>&copy; {new Date().getFullYear()} {i18n.language === "ar" ? "إبراهيم لطفي" : "Ibrahim Lotfi"}. {t("common.rights")}</p>
      </footer>
    </div>
  );
}
