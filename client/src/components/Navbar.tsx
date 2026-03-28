import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";


export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();

  const navItems = [
    { name: t("nav.home"), href: "#hero" },
    { name: t("nav.about"), href: "#about" },
    { name: t("nav.skills", "Skills"), href: "#skills" },
    { name: t("nav.projects"), href: "/#projects" },
    { name: t("nav.blog"), href: "/blog" },
    { name: t("nav.contact"), href: "#contact" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<any>, href: string) => {
    if (href.startsWith("/")) {
      setIsOpen(false);
      return;
    }

    if (location !== "/") {
      setIsOpen(false);
      // Construct the absolute path for anchor on home page
      window.location.href = "/" + href;
      return;
    }

    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-40 transition-all duration-300 border-b border-transparent",
        scrolled ? "bg-background/80 backdrop-blur-md border-border py-4" : "bg-transparent py-6"
      )}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <a 
          href={location === "/" ? "#hero" : "/#hero"}
          className="text-2xl font-display font-bold text-foreground tracking-widest uppercase hover:text-primary transition-colors"
          onClick={(e) => scrollToSection(e, "#hero")}
        >
          {i18n.language === "ar" ? "إبراهيم" : "Ibrahim"}<span className="text-primary">.</span>{i18n.language === "ar" ? "لطفي" : "Lotfi"}
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            item.href.startsWith("/") ? (
              <Link key={item.name} href={item.href} className="font-body text-sm font-medium tracking-wide text-muted-foreground hover:text-primary transition-colors relative group">
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ) : (
              <a
                key={item.name}
                href={location === "/" ? item.href : `/${item.href}`}
                onClick={(e) => scrollToSection(e, item.href)}
                className="font-body text-sm font-medium tracking-wide text-muted-foreground hover:text-primary transition-colors relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            )
          ))}
          <LanguageSwitcher />
        </div>

        {/* Mobile Nav Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <LanguageSwitcher />
          <button 
            className="text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 w-full bg-background/95 backdrop-blur-xl border-b border-border p-6 flex flex-col gap-4 md:hidden">
            {navItems.map((item) => (
              item.href.startsWith("/") ? (
                <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)} className="text-lg font-body text-white hover:text-primary">
                    {item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={location === "/" ? item.href : `/${item.href}`}
                  onClick={(e) => scrollToSection(e, item.href)}
                  className="text-lg font-body text-foreground hover:text-primary"
                >
                  {item.name}
                </a>
              )
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
