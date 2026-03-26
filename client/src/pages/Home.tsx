import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Skills from "@/components/sections/Skills";
import Projects from "@/components/sections/Projects";
import Contact from "@/components/sections/Contact";
import CustomCursor from "@/components/CustomCursor";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      <CustomCursor />
      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Contact />
      </main>
      
      <footer className="py-8 bg-black border-t border-white/10 text-center text-gray-500 font-body text-sm">
        <p>&copy; {new Date().getFullYear()} Ibrahim lotfi. All rights reserved.</p>
        <p className="mt-2">Designed with Future Tech.</p>
      </footer>
    </div>
  );
}
