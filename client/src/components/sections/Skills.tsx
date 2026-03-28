import { motion } from "framer-motion";
import { Server, Cpu, Layout, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: string;
  icon?: string;
}

export default function Skills() {
  const { t } = useTranslation();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  const CATEGORY_MAP: Record<string, any> = {
    "Frontend": {
      name: t("skills.categories.frontend"),
      icon: <Layout className="w-8 h-8 text-primary" />,
      color: "border-primary/50",
      barColor: "bg-primary"
    },
    "Backend": {
      name: t("skills.categories.backend"),
      icon: <Server className="w-8 h-8 text-secondary" />,
      color: "border-secondary/50",
      barColor: "bg-secondary"
    },
    "AI & ML": {
      name: t("skills.categories.ai"),
      icon: <Cpu className="w-8 h-8 text-accent" />,
      color: "border-accent/50",
      barColor: "bg-accent"
    },
    "AI / ML": {
      name: t("skills.categories.ai"),
      icon: <Cpu className="w-8 h-8 text-accent" />,
      color: "border-accent/50",
      barColor: "bg-accent"
    },
    "Tools": {
      name: t("skills.categories.tools"),
      icon: <Server className="w-8 h-8 text-muted-foreground" />,
      color: "border-border",
      barColor: "bg-muted-foreground/30"
    }
  };

  useEffect(() => {
    fetch("/api/skills")
      .then(res => res.json())
      .then(data => {
        setSkills(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch skills:", err);
        setLoading(false);
      });
  }, []);

  const groupedSkills = Array.isArray(skills) ? skills.reduce((acc: any, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {}) : {};

  const categories = Object.keys(groupedSkills);

  if (loading) {
    return (
      <section id="skills" className="py-24 bg-background flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </section>
    );
  }

  // Fallback to original hardcoded skills if DB is empty
  if (skills.length === 0) {
    return (
      <section id="skills" className="py-24 bg-background relative">
        <div className="container mx-auto px-6 text-center text-gray-500">
          <p>{t("skills.fallback")}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="skills" className="py-24 bg-background relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            {t("skills.title")} <span className="text-secondary">{t("skills.subtitle")}</span>
          </h2>
          <p className="text-muted-foreground font-body max-w-2xl mx-auto">
            {t("skills.desc_1")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat, index) => {
            const config = CATEGORY_MAP[cat] || CATEGORY_MAP["Tools"];
            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                whileHover={{ y: -10 }}
                viewport={{ once: true }}
                className={`glass-card p-8 rounded-2xl border ${config.color} hover:shadow-[0_0_30px_rgba(var(--primary),0.15)] transition-all duration-300 group`}
              >
                <div className="mb-6 bg-card/50 w-16 h-16 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                  {config.icon}
                </div>
                <h3 className="font-display text-2xl font-bold mb-6">{config.name || cat}</h3>
                <div className="space-y-4">
                  {groupedSkills[cat].map((skill: Skill, i: number) => (
                    <div key={skill.id} className="relative">
                      <div className="flex justify-between mb-1">
                        <span className="font-body text-foreground/80">{skill.name}</span>
                        <span className="text-xs text-muted-foreground">{skill.proficiency}</span>
                      </div>
                      <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: skill.proficiency }}
                          transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                          className={`h-full rounded-full ${config.barColor}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
