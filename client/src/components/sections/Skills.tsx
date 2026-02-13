import { motion } from "framer-motion";
import { Code, Server, Cpu, Database, Layout, Terminal } from "lucide-react";

const skills = [
  {
    category: "Frontend",
    icon: <Layout className="w-8 h-8 text-primary" />,
    items: ["React.js", "TypeScript", "Tailwind CSS", "Three.js", "GSAP"],
    color: "border-primary/50"
  },
  {
    category: "Backend",
    icon: <Server className="w-8 h-8 text-secondary" />,
    items: ["Node.js", "Python", "FastAPI", "PostgreSQL", "Firebase"],
    color: "border-secondary/50"
  },
  {
    category: "AI / ML",
    icon: <Cpu className="w-8 h-8 text-accent" />,
    items: ["TensorFlow", "PyTorch", "OpenCV", "NLP", "Neural Networks"],
    color: "border-accent/50"
  }
];

export default function Skills() {
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
            Technical <span className="text-secondary">Arsenal</span>
          </h2>
          <p className="text-gray-400 font-body max-w-2xl mx-auto">
            My stack is built for performance, scalability, and futuristic interactions.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {skills.map((skill, index) => (
            <motion.div
              key={skill.category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              whileHover={{ y: -10 }}
              viewport={{ once: true }}
              className={`glass-card p-8 rounded-2xl border ${skill.color} hover:shadow-[0_0_30px_rgba(0,243,255,0.15)] transition-all duration-300 group`}
            >
              <div className="mb-6 bg-white/5 w-16 h-16 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                {skill.icon}
              </div>
              <h3 className="font-display text-2xl font-bold mb-6">{skill.category}</h3>
              <div className="space-y-4">
                {skill.items.map((item, i) => (
                  <div key={item} className="relative">
                    <div className="flex justify-between mb-1">
                      <span className="font-body text-gray-300">{item}</span>
                    </div>
                    <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.random() * 20 + 80}%` }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                        className={`h-full rounded-full ${
                          index === 0 ? "bg-primary" : index === 1 ? "bg-secondary" : "bg-accent"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
