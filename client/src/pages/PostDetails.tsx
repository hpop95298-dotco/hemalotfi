import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Calendar, User, Clock } from "lucide-react";
import type { Post } from "@shared/schema";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";
import SEO from "@/components/SEO";
import { useTranslation } from "react-i18next";

export default function PostDetails() {
  const { t, i18n } = useTranslation();
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug;

  const { data: post, isLoading, error } = useQuery<Post>({
    queryKey: [`/api/posts/${slug}`],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6">
        <h1 className="text-4xl font-display font-bold mb-4">{t("blog.not_found")}</h1>
        <Link href="/blog">
          <a className="text-primary hover:underline flex items-center gap-2">
            {i18n.language === "ar" ? <ArrowRight size={20} /> : <ArrowLeft size={20} />} 
            {t("blog.back_blog")}
          </a>
        </Link>
      </div>
    );
  }

  const formatContent = (content: string) => {
    if (!content) return "";
    
    // Check if it's already HTML (contains < tags) - if so, just return it
    if (content.includes("</h1>") || content.includes("</h2>") || (content.includes("<p") && content.includes(">"))) return content;

    // Simple yet powerful Regex-based Markdown to HTML converter
    const formatted = content
      // Headings
      .replace(/^# (.*$)/gm, '<h1 class="text-4xl md:text-5xl font-display font-bold mb-10 text-primary border-b border-primary/20 pb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-display font-bold mb-6 mt-12 flex items-center gap-3 text-white"><span>$1</span><div class="h-px flex-grow bg-white/10"></div></h2>')
      // Horizontal Rules
      .replace(/^---$/gm, '<div class="my-12 flex items-center justify-center gap-4"><div class="h-px w-24 bg-white/10"></div><div class="w-2 h-2 rounded-full bg-primary/40"></div><div class="h-px w-24 bg-white/10"></div></div>')
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-bold">$1</strong>')
      // List items (supports multi-line lists by capturing individual lines)
      .replace(/^\- (.*$)/gm, '<li class="ml-6 mb-3 list-disc marker:text-primary leading-relaxed text-gray-300">$1</li>');

    // Wrap remaining paragraphs, avoiding wrapping existing HTML tags
    return formatted
      .split('\n\n')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => {
        if (p.startsWith('<h') || p.startsWith('<div') || p.startsWith('<li') || p.startsWith('<ul')) return p;
        // If it's pure li's, wrap them in a ul
        if (p.startsWith('<li')) return `<ul class="mb-8 space-y-2">${p}</ul>`;
        return `<p class="mb-8 leading-[1.8] text-gray-400 text-lg">${p}</p>`;
      })
      .join('\n');
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-black">
      <SEO title={`${post.title} | ${i18n.language === "ar" ? "مدونة إبراهيم لطفي" : "Ibrahim Lotfi Blog"}`} description={post.excerpt || ""} />
      <Navbar />
      <div className="fixed inset-0 z-0">
        <ParticleBackground />
      </div>

      <main className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/blog">
              <a className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-8 group">
                {i18n.language === "ar" ? (
                  <ArrowRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
                ) : (
                  <ArrowLeft size={20} className="transform group-hover:-translate-x-1 transition-transform" />
                )}
                {t("blog.all_posts")}
              </a>
            </Link>

            <img
              src={post.imageUrl || "https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=1000&auto=format&fit=crop"}
              alt={post.title}
              className="w-full aspect-video object-cover rounded-2xl mb-12 border border-white/10"
            />

            <h1 className="text-4xl md:text-6xl font-display font-bold mb-8 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap gap-8 mb-12 py-4 border-y border-white/10 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <User size={18} className="text-primary" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString(i18n.language) : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-primary" />
                <span>{i18n.language === "ar" ? "قراءة 5 دقائق" : "5 min read"}</span>
              </div>
            </div>

            <div 
              className="prose prose-invert max-w-none font-body text-lg leading-relaxed text-gray-300
                prose-headings:font-display prose-headings:text-white prose-a:text-primary hover:prose-a:underline
                prose-code:text-primary prose-code:bg-white/5 prose-code:px-1 prose-code:rounded"
              dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
            />
          </motion.div>
        </div>
      </main>

      <footer className="py-12 border-t border-white/10 text-center text-gray-500 text-sm relative z-10">
        <p>&copy; {new Date().getFullYear()} {i18n.language === "ar" ? "إبراهيم لطفي" : "Ibrahim Lotfi"}. {t("common.rights")}</p>
      </footer>
    </div>
  );
}
