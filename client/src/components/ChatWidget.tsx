import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

type Message = {
  id: string;
  sender: 'user' | 'ai' | 'admin';
  content: string;
  createdAt: string;
};

export default function ChatWidget() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start polling when widget is open and sessionId exists
    let interval: NodeJS.Timeout;
    if (isOpen && sessionId) {
      fetchMessages(sessionId);
      interval = setInterval(() => fetchMessages(sessionId), 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, sessionId]);

  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lastMessageId]);

  const fetchMessages = async (sid?: string) => {
    const targetId = sid || sessionId;
    if (!targetId) return;
    try {
      const res = await apiRequest("GET", `/api/chat/sessions/${targetId}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/chat/messages", {
        sessionId,
        content: userContent
      });
      const data = await res.json();
      
      if (!sessionId) {
        setSessionId(data.sessionId);
      }

      await fetchMessages(data.sessionId);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-80 md:w-96 h-[600px] glass-card rounded-2xl border border-primary/20 flex flex-col overflow-hidden shadow-[0_0_40px_rgba(0,243,255,0.1)] relative"
          >
            {/* Animated Glow Border */}
            <div className="absolute inset-0 border-2 border-primary/10 rounded-2xl pointer-events-none" />
            
            {/* Header */}
            <div className="p-4 bg-primary/10 border-b border-primary/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-display font-bold text-sm">{t("chat.header")}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                <X size={18} />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    {t("chat.welcome")}
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        m.sender === "user"
                          ? "bg-primary text-primary-foreground font-bold"
                          : m.sender === "admin"
                          ? "bg-secondary text-secondary-foreground border border-secondary/50"
                          : "bg-card/50 text-foreground border border-border"
                      }`}
                    >
                      {m.sender === 'admin' && <p className="text-[10px] opacity-70 mb-1">{t("chat.human_response")}</p>}
                      {m.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-card/50 p-3 rounded-2xl border border-border">
                      <Loader2 size={16} className="animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-background border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("chat.placeholder")}
                  className="bg-card border-border focus:border-primary/50"
                />
                <Button type="submit" size="icon" disabled={isLoading}>
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.4)] border-2 border-primary/50 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </motion.button>
    </div>
  );
}
