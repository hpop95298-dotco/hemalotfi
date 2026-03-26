import { Switch, Route, Redirect, useLocation } from "wouter";
import { useEffect, useState } from "react";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ProjectDetails from "./pages/ProjectDetails";
import Blog from "./pages/Blog";
import PostDetails from "./pages/PostDetails";
import ProjectsPage from "./pages/ProjectsPage";
import NotFound from "./pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AOS from "aos";
import "aos/dist/aos.css";
import { useTranslation } from "react-i18next";
import CustomCursor from "./components/CustomCursor";
import ChatWidget from "./components/ChatWidget";
import SEO from "./components/SEO";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import SidebarTransition from "./components/effects/SidebarTransition";

const ADMIN_SECRET_PATH = "/ibrahim-workspace-portal"; // Obfuscated path

function ProtectedRoute({ component: Component }: any) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    fetch("/api/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true);
        } else {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          setAuthenticated(false);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        setAuthenticated(false);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-white">Checking auth...</div>;

  return authenticated ? <Component /> : <Redirect to="/login" />;
}

function InactivityLogout() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (token) {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          setLocation("/login");
          window.location.reload(); // Force refresh to clear all states
        }
      }, 30 * 60 * 1000); // 30 minutes
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      clearTimeout(timeout);
    };
  }, [setLocation]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path={ADMIN_SECRET_PATH}>
        <ProtectedRoute component={Admin} />
      </Route>
      {/* Redirect old /admin to 404/NotFound for obfuscation */}
      <Route path="/admin">
        <Redirect to="/404" />
      </Route>
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/project/:slug" component={ProjectDetails} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={PostDetails} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { i18n } = useTranslation();
  const [location] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const handleTransition = () => {
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 2000);
    };
    window.addEventListener("portal-transition", handleTransition);
    return () => window.removeEventListener("portal-transition", handleTransition);
  }, []);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: "ease-out-quart",
    });
  }, []);

  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
    AOS.refresh();
  }, [i18n.language]);

  useEffect(() => {
    if (location === ADMIN_SECRET_PATH || location === "/login") {
      document.body.style.cursor = "default";
    } else {
      document.body.style.cursor = "none";
    }
  }, [location]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
        <InactivityLogout />
        <SEO />
        <TooltipProvider>
          <Toaster />
          <SidebarTransition isVisible={isTransitioning} />
          {location !== ADMIN_SECRET_PATH && location !== "/login" && <CustomCursor />}
          {location !== ADMIN_SECRET_PATH && location !== "/login" && <ChatWidget />}
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;