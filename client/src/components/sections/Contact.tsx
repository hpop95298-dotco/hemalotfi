import { motion } from "framer-motion";
import { Send, Mail, MapPin, Phone, MessageCircle, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function Contact() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const formSchema = z.object({
    name: z.string().min(2, i18n.language === "ar" ? "الاسم يجب أن يكون حرفين على الأقل" : "Name must be at least 2 characters"),
    email: z.string().email(i18n.language === "ar" ? "البريد الإلكتروني غير صالح" : "Invalid email address"),
    message: z.string().min(10, i18n.language === "ar" ? "الرسالة يجب أن تكون 10 أحرف على الأقل" : "Message must be at least 10 characters"),
    website_url_honey: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
      website_url_honey: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("contact.form.error_desc"));
      }

      toast({
        title: t("contact.form.success_title"),
        description: t("contact.form.success_desc"),
      });

      form.reset();

    } catch (error: any) {
      toast({
        title: t("contact.form.error_title"),
        description: error.message || t("contact.form.error_desc"),
        variant: "destructive",
      });
    }
  }

  return (
    <section id="contact" className="py-24 bg-background relative overflow-hidden">

      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[128px]" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            {t("contact.title")} <span className="text-secondary">{t("contact.touch")}</span>
          </h2>
          <p className="text-muted-foreground font-body max-w-2xl mx-auto">
            {t("contact.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: i18n.language === "ar" ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="glass-card p-8 rounded-2xl border border-border space-y-6">

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Mail />
                </div>
                <div>
                  <h4 className="font-display font-bold text-lg">{t("contact.info.email")}</h4>
                  <p className="text-muted-foreground">mn8665967@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <Phone />
                </div>
                <div>
                  <h4 className="font-display font-bold text-lg">{t("contact.info.phone")}</h4>
                  <p className="text-muted-foreground">+20 1006513538</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <MapPin />
                </div>
                <div>
                  <h4 className="font-display font-bold text-lg">{t("contact.info.location")}</h4>
                  <p className="text-muted-foreground">{t("contact.info.address")}</p>
                </div>
              </div>

              <a
                href="https://wa.me/201006513538"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 group/item hover:bg-white/5 p-2 -m-2 rounded-xl transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 group-hover/item:scale-110 transition-transform">
                  <MessageCircle />
                </div>
                <div>
                  <h4 className="font-display font-bold text-lg">{t("contact.info.whatsapp")}</h4>
                  <p className="text-muted-foreground group-hover/item:text-primary transition-colors">Chat on WhatsApp</p>
                </div>
              </a>

              <a
                href="https://www.linkedin.com/in/ebrahim-lotfi-266714224/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 group/item hover:bg-white/5 p-2 -m-2 rounded-xl transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 group-hover/item:scale-110 transition-transform">
                  <Linkedin />
                </div>
                <div>
                  <h4 className="font-display font-bold text-lg">{t("contact.info.linkedin")}</h4>
                  <p className="text-muted-foreground group-hover/item:text-primary transition-colors">Connect on LinkedIn</p>
                </div>
              </a>

            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: i18n.language === "ar" ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="glass-card p-8 rounded-2xl border border-border text-initial"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">{t("contact.form.name")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("contact.form.name")}
                          {...field}
                          className="bg-card/50 border-border focus:border-primary text-foreground"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">{t("contact.form.email")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="example@gmail.com"
                          {...field}
                          className="bg-card/50 border-border focus:border-primary text-foreground"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">{t("contact.form.message")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="..."
                          {...field}
                          className="bg-card/50 border-border focus:border-primary text-foreground min-h-[120px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Honeypot field - invisible to users, enticing to bots */}
                <FormField
                  control={form.control}
                  name="website_url_honey"
                  render={({ field }) => (
                    <FormItem className="hidden opacity-0 h-0 w-0 overflow-hidden pointer-events-none">
                      <FormControl>
                        <Input
                          autoComplete="off"
                          tabIndex={-1}
                          {...field}
                          className="hidden"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full bg-primary hover:bg-primary/80 text-black font-bold py-6 transition-all active:scale-[0.98]"
                >
                  <Send className={cn("mr-2 h-4 w-4", i18n.language === "ar" && "ml-2 mr-0 rotate-180")} />
                  {form.formState.isSubmitting ? t("contact.form.sending") : t("contact.form.send")}
                </Button>

              </form>
            </Form>
          </motion.div>

        </div>
      </div>
    </section>
  );
};