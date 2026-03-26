import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Loader2, User, Cpu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  aiReply: string;
  createdAt: string;
}

export default function Guestbook() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [websiteUrlHoney, setWebsiteUrlHoney] = useState("");

  const { data: entries, isLoading } = useQuery<GuestbookEntry[]>({
    queryKey: ["/api/guestbook"],
  });

  const mutation = useMutation({
    mutationFn: async (newEntry: { name: string; message: string }) => {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEntry, website_url_honey: websiteUrlHoney }),
      });
      if (!res.ok) throw new Error("Failed to post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guestbook"] });
      setName("");
      setMessage("");
      setWebsiteUrlHoney("");
      toast({ title: t("guestbook.success") || "Message Posted!" });
    },
    onError: () => {
      toast({ title: t("guestbook.error") || "Error", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    mutation.mutate({ name, message });
  };

  return (
    <section id="guestbook" className="py-24 bg-[#050505] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl font-bold mb-4"
          >
            {t("nav.guestbook") || "AI Guestbook"}
          </motion.h2>
          <p className="text-gray-400 max-w-2xl mx-auto italic">
             {t("guestbook.subtitle") || "Leave a message and IBM will reply instantly."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="glass-card p-8 rounded-3xl border-primary/20 h-fit"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t("contact.name")}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                  placeholder={i18n.language === "ar" ? "اسمك..." : "Your name..."}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t("contact.message")}</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all resize-none"
                  placeholder={i18n.language === "ar" ? "اترك رسالة..." : "Leave a message..."}
                />
              </div>

              {/* Honeypot field - Keep hidden */}
              <input
                type="text"
                value={websiteUrlHoney}
                onChange={(e) => setWebsiteUrlHoney(e.target.value)}
                autoComplete="off"
                tabIndex={-1}
                className="hidden opacity-0 h-0 w-0 overflow-hidden pointer-events-none"
              />
              <button
                disabled={mutation.isPending}
                className="w-full bg-primary hover:bg-primary-dark text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {mutation.isPending ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                {t("contact.send")}
              </button>
            </form>
          </motion.div>

          {/* Feed */}
          <div className="space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
            <AnimatePresence mode="popLayout">
              {entries?.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-4"
                >
                  {/* Visitor Message */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                       <User size={18} className="text-gray-400" />
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5 flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-sm text-primary">{entry.name}</span>
                        <span className="text-[10px] text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-300">{entry.message}</p>
                    </div>
                  </div>

                  {/* AI Reply */}
                  {entry.aiReply && (
                    <div className="flex gap-4 justify-end">
                      <div className="bg-primary/10 p-4 rounded-2xl rounded-tr-none border border-primary/20 flex-1 relative">
                        <div className="flex items-center gap-2 mb-1">
                           <Cpu size={14} className="text-primary" />
                           <span className="font-bold text-xs text-primary uppercase tracking-tighter">IBM (AI)</span>
                        </div>
                        <p className="text-sm text-primary/90 italic">{entry.aiReply}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center shrink-0">
                         <div className="w-6 h-6 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#00e5ff]" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {entries?.length === 0 && (
              <p className="text-center text-gray-500 py-12">{t("guestbook.empty") || "Be the first to sign!"}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
