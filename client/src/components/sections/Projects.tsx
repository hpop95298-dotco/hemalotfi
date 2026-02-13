import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";
import heroBg from "@/assets/hero-bg.png";
import projectCommerce from "@/assets/project-commerce.png";
import projectTask from "@/assets/project-task.png";

const projects = [
  {
    title: "Neural Vision AI",
    category: "Artificial Intelligence",
    description: "Real-time object detection system using advanced computer vision algorithms and deep learning models.",
    image: heroBg,
    tech: ["Python", "TensorFlow", "OpenCV", "React"],
    links: { demo: "#", github: "#" }
  },
  {
    title: "Cyberpunk E-Commerce",
    category: "Full Stack Web",
    description: "A futuristic shopping experience with 3D product previews and crypto payment integration.",
    image: projectCommerce,
    tech: ["Next.js", "Three.js", "Stripe", "Prisma"],
    links: { demo: "#", github: "#" }
  },
  {
    title: "Quantum Task Manager",
    category: "Productivity App",
    description: "AI-powered task prioritization tool that learns from your habits to optimize your workflow.",
    image: projectTask,
    tech: ["React", "Node.js", "OpenAI API", "MongoDB"],
    links: { demo: "#", github: "#" }
  }
];

export default function Projects() {
  return (
    <section id="projects" className="py-24 bg-black relative">
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
              Featured <span className="text-primary">Projects</span>
            </h2>
            <p className="text-gray-400 font-body">Selected works from my digital lab.</p>
          </div>
          <a href="#" className="hidden md:block text-primary font-body hover:underline">View All Archives -&gt;</a>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="group relative rounded-2xl overflow-hidden bg-card/50 border border-white/10 hover:border-primary/50 transition-all duration-500"
            >
              {/* Image with overlay */}
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-black/50 group-hover:bg-transparent transition-all duration-500 z-10" />
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
                />
              </div>

              {/* Content */}
              <div className="p-6 relative z-20">
                <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">{project.category}</div>
                <h3 className="font-display text-xl font-bold mb-3 group-hover:text-primary transition-colors">{project.title}</h3>
                <p className="text-gray-400 text-sm mb-6 line-clamp-3 font-body">{project.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tech.map(t => (
                    <span key={t} className="text-xs px-2 py-1 bg-white/5 rounded border border-white/10 text-gray-300">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex gap-4">
                  <a href={project.links.demo} className="flex items-center gap-2 text-sm font-bold text-white hover:text-primary transition-colors">
                    <ExternalLink size={16} /> Live Demo
                  </a>
                  <a href={project.links.github} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
                    <Github size={16} /> Code
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-12 text-center md:hidden">
            <a href="#" className="text-primary font-body hover:underline">View All Archives -&gt;</a>
        </div>
      </div>
    </section>
  );
}
