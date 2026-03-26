import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import AnalyticsView from "@/components/admin/AnalyticsView";
import AuditLogsView from "@/components/admin/AuditLogsView";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Shield } from "lucide-react";

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  status: string;
}

interface Project {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  imageUrl: string;
  liveUrl: string;
  githubUrl: string;
  technologies: string[];
  isFeatured: boolean;
  isPublished: boolean;
}

interface ChatSession {
  id: string;
  status: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'ai' | 'admin';
  content: string;
  createdAt: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  imageUrl: string;
  author: string;
  isPublished: boolean;
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

export default function Admin() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("analytics");

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectDialog, setProjectDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState({
    title: "",
    shortDescription: "",
    fullDescription: "",
    imageUrl: "",
    liveUrl: "",
    githubUrl: "",
    technologies: "",
    isFeatured: false,
    isPublished: true,
  });

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [replyInput, setReplyInput] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [postDialog, setPostDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [postForm, setPostForm] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    imageUrl: "",
    isPublished: true,
  });

  // Expanded features states
  const [skills, setSkills] = useState<any[]>([]);
  const [skillDialog, setSkillDialog] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any>(null);
  const [skillForm, setSkillForm] = useState({ name: "", category: "Frontend", proficiency: "90%", icon: "" });

  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [testimonialDialog, setTestimonialDialog] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
  const [testimonialForm, setTestimonialForm] = useState({ clientName: "", role: "", content: "", avatarUrl: "" });

  const [analytics, setAnalytics] = useState<any>(null);
  const [seo, setSeo] = useState<any[]>([]);

  // Fetch messages and chats on mount
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      setLocation("/login");
      return;
    }
    fetchMessages(token);
    fetchChatSessions(token);
    fetchProjects(token);
    fetchPosts(token);
    fetchConfigStatus(token);
    fetchSkills();
    fetchTestimonials();
    fetchAnalytics(token);
    fetchSEO();
    fetch2FAStatus(token);
  }, []);

  async function fetch2FAStatus(token: string) {
    try {
      // We can use the setup endpoint to check if it returns 400/403 or success
      // Or just assume it's disabled if we haven't enabled it in this session.
      // Better: Add a quick status check in storage/routes.
      const res = await fetch("/api/admin/config-status", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIs2FAEnabled(!!data.twoFactorEnabled);
      }
    } catch (e) { console.error(e); }
  }

  const [aiTestResult, setAiTestResult] = useState<any>(null);
  const [testingAi, setTestingAi] = useState(false);

  // Security states
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });

  const [twoFactorDialog, setTwoFactorDialog] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ secret: string; instructions: string } | null>(null);
  const [mfaVerifyCode, setMfaVerifyCode] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [settingUp2FA, setSettingUp2FA] = useState(false);

  async function handleTestAi() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await fetch("/api/admin/test-ai", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAiTestResult(data);
      if (res.ok) {
        toast({ title: "AI Connection Stable", description: `Model: ${data.model}` });
      } else {
        toast({ title: "AI Test Failed", description: data.message || "Check server logs", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Test Error", description: "Failed to connect to API", variant: "destructive" });
    } finally {
      setTestingAi(false);
    }
  }

  async function handleUpdatePassword() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    if (passwordForm.newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: passwordForm.newPassword })
      });
      if (res.ok) {
        toast({ title: "Success", description: "Admin password updated successfully" });
        setPasswordDialog(false);
        setPasswordForm({ newPassword: "", confirmPassword: "" });
      } else {
        const data = await res.json();
        toast({ title: "Update Failed", description: data.message || "Something went wrong", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Update Error", description: "Network error", variant: "destructive" });
    } finally {
      setUpdatingPassword(false);
    }
  }

  async function handleInit2FA() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    setSettingUp2FA(true);
    try {
      const res = await fetch("/api/admin/2fa/setup", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTwoFactorSetup(await res.json());
        setTwoFactorDialog(true);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to start 2FA setup", variant: "destructive" });
    } finally {
      setSettingUp2FA(false);
    }
  }

  async function handleVerify2FA() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token || !twoFactorSetup) return;

    try {
      const res = await fetch("/api/admin/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ secret: twoFactorSetup.secret, code: mfaVerifyCode })
      });
      if (res.ok) {
        toast({ title: "Success", description: "Two-Factor Authentication Enabled!" });
        setTwoFactorDialog(false);
        setIs2FAEnabled(true);
        setTwoFactorSetup(null);
        setMfaVerifyCode("");
      } else {
        const data = await res.json();
        toast({ title: "Failed", description: data.message || "Invalid code", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Verification failed", variant: "destructive" });
    }
  }

  async function fetchProjects(token: string) {
    try {
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProjects(await res.json());
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) { console.error(err); }
  }

  async function fetchPosts(token: string) {
    try {
      const res = await fetch("/api/posts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPosts(await res.json());
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) { console.error(err); }
  }

  async function handleSaveProject() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
      const isEditing = !!editingProject;
      const url = isEditing ? `/api/projects/${editingProject.id}` : "/api/projects";
      const method = isEditing ? "PATCH" : "POST";

      const projectData = {
        ...projectForm,
        slug: editingProject?.slug || projectForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        technologies: projectForm.technologies.split(",").map(t => t.trim()).filter(Boolean),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });

      if (res.ok) {
        toast({ title: isEditing ? "Project updated" : "Project created" });
        setProjectDialog(false);
        fetchProjects(token);
        setProjectForm({
          title: "",
          shortDescription: "",
          fullDescription: "",
          imageUrl: "",
          liveUrl: "",
          githubUrl: "",
          technologies: "",
          isFeatured: false,
          isPublished: true,
        });
        setEditingProject(null);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({
          title: "Failed to save project",
          description: errorData.message || "Please check all fields and try again.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "An error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProject(id: string) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setProjects(prev => prev.filter(p => p.id !== id));
      toast({ title: "Project deleted" });
    }
  }

  async function handleSavePost() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
      const isEditing = !!editingPost;
      const url = isEditing ? `/api/posts/${editingPost.id}` : "/api/posts";
      const method = isEditing ? "PATCH" : "POST";

      const blogData = {
        ...postForm,
        slug: postForm.slug || postForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(blogData),
      });

      if (res.ok) {
        toast({ title: isEditing ? "Post updated" : "Post created" });
        setPostDialog(false);
        fetchPosts(token);
        setPostForm({
          title: "",
          slug: "",
          content: "",
          excerpt: "",
          imageUrl: "",
          isPublished: true,
        });
        setEditingPost(null);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({
          title: "Failed to save post",
          description: errorData.message || "Please check all fields and try again.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "An error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePost(id: string) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/posts/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.id !== id));
      toast({ title: "Post deleted" });
    }
  }

  const [configStatus, setConfigStatus] = useState({ openai: false, gemini: false });

  async function fetchConfigStatus(token: string) {
    try {
      const res = await fetch("/api/admin/config-status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConfigStatus(data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) { console.error(err); }
  }

  async function fetchChatSessions(token: string) {
    try {
      const res = await fetch("/api/admin/chat/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChatSessions(data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (activeChatId) {
      const token = localStorage.getItem("token");
      if (token) fetchChatMessages(activeChatId, token);

      const interval = setInterval(() => {
        if (token) fetchChatMessages(activeChatId, token);
      }, 5000); // Polling every 5s

      return () => clearInterval(interval);
    }
  }, [activeChatId]);

  async function fetchChatMessages(sessionId: string, token: string) {
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSendReply() {
    if (!activeChatId || !replyInput.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setSendingReply(true);
    try {
      const res = await fetch("/api/admin/chat/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId: activeChatId, content: replyInput.trim() }),
      });

      if (res.ok) {
        setReplyInput("");
        fetchChatMessages(activeChatId, token);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSendingReply(false);
    }
  }

  async function fetchSkills() {
    try {
      const res = await fetch("/api/skills");
      if (res.ok) setSkills(await res.json());
    } catch (err) { console.error(err); }
  }

  async function fetchTestimonials() {
    try {
      const res = await fetch("/api/testimonials");
      if (res.ok) setTestimonials(await res.json());
    } catch (err) { console.error(err); }
  }

  async function fetchAnalytics(token: string) {
    try {
      const res = await fetch("/api/admin/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAnalytics(await res.json());
    } catch (err) { console.error(err); }
  }

  async function fetchSEO() {
    try {
      const res = await fetch("/api/seo");
      if (res.ok) setSeo(await res.json());
    } catch (err) { console.error(err); }
  }

  async function handleSaveSkill() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const isEditing = !!editingSkill;
      const url = isEditing ? `/api/skills/${editingSkill.id}` : "/api/skills";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(skillForm),
      });
      if (res.ok) {
        toast({ title: isEditing ? "Skill updated" : "Skill added" });
        setSkillDialog(false);
        fetchSkills();
        setSkillForm({ name: "", category: "Frontend", proficiency: "90%", icon: "" });
        setEditingSkill(null);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({
          title: "Failed to save skill",
          description: errorData.message || "Please check all fields and try again.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "An error occurred", variant: "destructive" });
    }
    finally { setLoading(false); }
  }

  async function handleDeleteSkill(id: string) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token || !confirm("Are you sure?")) return;
    const res = await fetch(`/api/skills/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchSkills();
  }

  async function handleSaveTestimonial() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const isEditing = !!editingTestimonial;
      const url = isEditing ? `/api/testimonials/${editingTestimonial.id}` : "/api/testimonials";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(testimonialForm),
      });
      if (res.ok) {
        toast({ title: isEditing ? "Testimonial updated" : "Testimonial saved" });
        setTestimonialDialog(false);
        fetchTestimonials();
        setEditingTestimonial(null);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleDeleteTestimonial(id: string) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token || !confirm("Are you sure?")) return;
    const res = await fetch(`/api/testimonials/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchTestimonials();
  }

  async function handleSaveSEO(key: string, value: string) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    const res = await fetch("/api/admin/seo", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ key, value }),
    });
    if (res.ok) {
      toast({ title: "SEO optimized" });
      fetchSEO();
    }
  }

  async function fetchMessages(token: string) {
    try {
      const res = await fetch("/api/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      } else if (res.status === 401) {
        handleLogout();
      } else {
        console.error("Failed to fetch messages:", res.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function markAsRead(id: string) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/messages/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessages(prev =>
          prev.map(msg => (msg.id === id ? { ...msg, isRead: true } : msg))
        );
        fetchAnalytics(token);
      }
    } catch (err) { console.error(err); }
  }

  async function handleViewMessage(msg: Message) {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      await markAsRead(msg.id);
    }
  }

  async function handleDelete(id: string) {
    const token = localStorage.getItem("token");
    if (!token) return;

    await fetch(`/api/messages/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setMessages(prev => prev.filter(msg => msg.id !== id));
    setSelectedMessage(null);
    toast({ title: "Message deleted" });
  }

  function handleBulkDelete() {
    selectedIds.forEach(id => handleDelete(id));
    setSelectedIds([]);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setLocation("/login");
  }

  const filteredMessages = useMemo(
    () =>
      messages.filter(
        msg =>
          msg.name.toLowerCase().includes(search.toLowerCase()) ||
          msg.email.toLowerCase().includes(search.toLowerCase()) ||
          msg.message.toLowerCase().includes(search.toLowerCase())
      ),
    [messages, search]
  );

  const totalPages = Math.ceil(filteredMessages.length / ITEMS_PER_PAGE);
  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const todayCount = messages.filter(
    m => new Date(m.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const unreadCount = messages.filter(m => m.status === "new").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-black/50 border-r border-gray-800 p-6 hidden md:block">
        <h2 className="text-2xl font-bold mb-10">⚡ Admin Panel</h2>
        <div className="space-y-4 text-gray-400">
          <p className="text-white font-semibold flex items-center gap-2 italic uppercase tracking-tighter text-xs opacity-50 mb-2">Navigation</p>
          <div className="space-y-2">
            {[
              { id: "analytics", label: "Analytics", icon: "📊" },
              { id: "messages", label: "Messages", icon: "📩" },
              { id: "projects", label: "Projects", icon: "📂" },
              { id: "blog", label: "Blog", icon: "✍️" },
              { id: "chats", label: "AI Chats", icon: "🤖" },
              { id: "skills", label: "Skills", icon: "🛠️" },
              { id: "settings", label: "Settings", icon: "⚙️" },
            ].map((item) => (
              <p
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`hover:text-white transition-colors cursor-pointer flex items-center gap-3 py-2 px-3 rounded-lg ${activeTab === item.id ? "bg-white/5 text-white" : ""
                  }`}
              >
                {item.icon} {item.label}
              </p>
            ))}

            {/* 🔐 Vault Lock Section */}
            <hr className="border-white/5 my-4" />
            <p
              onClick={() => setActiveTab("audit")}
              className={`hover:text-red-400 transition-colors cursor-pointer flex items-center gap-3 py-2 px-3 rounded-lg group ${activeTab === "audit" ? "bg-red-500/10 text-red-500" : "text-gray-500"
                }`}
            >
              <Shield className={`w-4 h-4 ${activeTab === "audit" ? "text-red-500" : "text-gray-600 group-hover:text-red-400"}`} />
              <span className="text-sm font-bold tracking-tighter uppercase">
                {i18n.language === "ar" ? "خزنة السجلات" : "Audit Vault"}
              </span>
            </p>
          </div>
          <div className="px-3 mb-6">
            <LanguageSwitcher />
          </div>
          <button
            onClick={handleLogout}
            className="text-red-500 hover:text-red-400 mt-4 w-full text-left rtl:text-right py-2 px-3 flex items-center gap-3 transition-colors"
          >
            <span className="opacity-70 group-hover:opacity-100">🚪</span>
            {t("admin.logout")}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-10 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8 bg-zinc-900 border border-white/10 p-1 h-auto overflow-x-auto">
            <TabsTrigger value="analytics">Dashboard</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="chats">AI Chats</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <p className="text-gray-400 text-sm">Total Visits</p>
                <h3 className="text-3xl font-bold mt-2">{analytics?.visits || 0}</h3>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <p className="text-gray-400 text-sm">Total Messages</p>
                <h3 className="text-3xl font-bold mt-2">{analytics?.messages || 0}</h3>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <p className="text-gray-400 text-sm">Total Projects</p>
                <h3 className="text-3xl font-bold mt-2">{analytics?.projects || 0}</h3>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <p className="text-gray-400 text-sm">Active Chats</p>
                <h3 className="text-3xl font-bold mt-2">{chatSessions.length}</h3>
              </div>
            </div>

            <div className="mb-10">
              <AnalyticsView messages={messages} chatSessions={chatSessions} analytics={analytics} />
            </div>

            <div className="bg-primary/10 border border-primary/20 p-8 rounded-3xl">
              <h2 className="text-2xl font-bold mb-4">SEO Quick Setup</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['title', 'description', 'keywords'].map(key => (
                  <div key={key} className="space-y-2">
                    <label className="text-sm capitalize text-gray-400">{key}</label>
                    <Input
                      className="bg-black/40 border-white/10"
                      defaultValue={seo.find(s => s.key === key)?.value || ""}
                      onBlur={(e) => handleSaveSEO(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t("admin.messages")}</h2>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <Input
                  placeholder={t("admin.messages_tab.search")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white/5 border-white/10 w-full md:w-64"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={selectedIds.length === 0}
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("admin.messages_tab.delete_selected")}
                </Button>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left rtl:text-right">
                  <thead className="bg-white/5 text-gray-400 font-medium border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filteredMessages.length && filteredMessages.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds(filteredMessages.map(m => m.id));
                            else setSelectedIds([]);
                          }}
                        />
                      </th>
                      <th className="px-6 py-4">{t("admin.messages_tab.name")}</th>
                      <th className="px-6 py-4">{t("admin.messages_tab.email")}</th>
                      <th className="px-6 py-4">{t("admin.messages_tab.message")}</th>
                      <th className="px-6 py-4">{t("admin.messages_tab.date")}</th>
                      <th className="px-6 py-4">{t("admin.messages_tab.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedMessages.length > 0 ? paginatedMessages.map((msg) => (
                      <tr
                        key={msg.id}
                        className={`hover:bg-white/5 transition-colors cursor-pointer ${!msg.isRead ? 'bg-primary/5' : ''}`}
                        onClick={() => handleViewMessage(msg)}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(msg.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelect(msg.id);
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 font-medium">{msg.name}</td>
                        <td className="px-6 py-4 text-gray-400">{msg.email}</td>
                        <td className="px-6 py-4 text-gray-400 max-w-xs truncate">{msg.message}</td>
                        <td className="px-6 py-4 text-gray-400 text-xs text-nowrap">
                          {new Date(msg.createdAt).toLocaleDateString(i18n.language)}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(msg.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          {t("admin.messages_tab.no_messages")} 📭
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 space-x-3">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${currentPage === i + 1 ? "bg-primary text-black font-bold" : "bg-white/5 hover:bg-white/10"
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{t("admin.projects")}</h2>
              <Dialog open={projectDialog} onOpenChange={setProjectDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingProject(null);
                    setProjectForm({
                      title: "", shortDescription: "", fullDescription: "",
                      imageUrl: "", liveUrl: "", githubUrl: "",
                      technologies: "", isFeatured: false, isPublished: true,
                    });
                  }}>
                    <Plus className="w-4 h-4 mr-2" /> {t("admin.add_new")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-zinc-900 border-white/10 text-white max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingProject ? t("admin.edit") : t("admin.add_new")} {t("admin.projects")}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">{t("projects_tab.title")}</label>
                      <Input className="bg-white/5 border-white/10 text-white" value={projectForm.title} onChange={e => setProjectForm({ ...projectForm, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">Image URL / Upload</label>
                      <div className="flex gap-2">
                        <Input
                          className="bg-white/5 border-white/10 flex-1 text-white"
                          value={projectForm.imageUrl}
                          onChange={e => setProjectForm({ ...projectForm, imageUrl: e.target.value })}
                        />
                        <label className="cursor-pointer">
                          <Input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                              const formData = new FormData();
                              formData.append("image", file);
                              try {
                                const res = await fetch("/api/admin/upload", {
                                  method: "POST",
                                  headers: { Authorization: `Bearer ${token}` },
                                  body: formData
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setProjectForm(prev => ({ ...prev, imageUrl: data.url }));
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                          />
                          <div className="h-10 px-4 flex items-center bg-primary/20 text-primary border border-primary/30 rounded-md">
                            <Plus size={18} />
                          </div>
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400">Live URL</label>
                        <Input className="bg-white/5 border-white/10 text-white" value={projectForm.liveUrl} onChange={e => setProjectForm({ ...projectForm, liveUrl: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400">GitHub URL</label>
                        <Input className="bg-white/5 border-white/10 text-white" value={projectForm.githubUrl} onChange={e => setProjectForm({ ...projectForm, githubUrl: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">Technologies</label>
                      <Input className="bg-white/5 border-white/10 text-white" value={projectForm.technologies} onChange={e => setProjectForm({ ...projectForm, technologies: e.target.value })} placeholder="React, Tailwind, etc." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">Short Description</label>
                      <Textarea className="bg-white/5 border-white/10 text-white" value={projectForm.shortDescription} onChange={e => setProjectForm({ ...projectForm, shortDescription: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">Full Content (Markdown)</label>
                      <Textarea className="bg-white/5 border-white/10 text-white h-32" value={projectForm.fullDescription} onChange={e => setProjectForm({ ...projectForm, fullDescription: e.target.value })} />
                    </div>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={projectForm.isFeatured} onChange={e => setProjectForm({ ...projectForm, isFeatured: e.target.checked })} />
                        <span className="text-sm">{t("projects_tab.featured")}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={projectForm.isPublished} onChange={e => setProjectForm({ ...projectForm, isPublished: e.target.checked })} />
                        <span className="text-sm">{t("projects_tab.published")}</span>
                      </label>
                    </div>
                    <Button onClick={handleSaveProject} disabled={loading} className="w-full mt-4">
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t("admin.save")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden overflow-x-auto">
              <table className="w-full text-sm text-left rtl:text-right">
                <thead className="bg-white/5 text-gray-400 font-medium border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4">{t("projects_tab.title")}</th>
                    <th className="px-6 py-4">{t("projects_tab.featured")}</th>
                    <th className="px-6 py-4">{t("projects_tab.status")}</th>
                    <th className="px-6 py-4">{t("projects_tab.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium">{project.title}</td>
                      <td className="px-6 py-4">
                        {project.isFeatured ? (
                          <span className="text-primary text-xs bg-primary/10 px-2 py-1 rounded">{t("projects_tab.yes")}</span>
                        ) : (
                          <span className="text-gray-500 text-xs">{t("projects_tab.no")}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {project.isPublished ? (
                          <span className="text-green-500 text-xs">{t("projects_tab.published")}</span>
                        ) : (
                          <span className="text-yellow-500 text-xs">{t("projects_tab.draft")}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditingProject(project);
                            setProjectForm({
                              title: project.title,
                              shortDescription: project.shortDescription || "",
                              fullDescription: project.fullDescription || "",
                              imageUrl: project.imageUrl || "",
                              liveUrl: project.liveUrl || "",
                              githubUrl: project.githubUrl || "",
                              technologies: (project.technologies || []).join(", "),
                              isFeatured: !!project.isFeatured,
                              isPublished: !!project.isPublished,
                            });
                            setProjectDialog(true);
                          }}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteProject(project.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{t("admin.blog")}</h2>
              <Dialog open={postDialog} onOpenChange={setPostDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingPost(null);
                    setPostForm({
                      title: "", slug: "", content: "",
                      excerpt: "", imageUrl: "", isPublished: true,
                    });
                  }}>
                    <Plus className="w-4 h-4 mr-2" /> {t("admin.add_new")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl bg-zinc-900 border-white/10 text-white max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingPost ? t("admin.edit") : t("admin.add_new")} {t("admin.blog")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400">{t("blog_tab.title")}</label>
                        <Input className="bg-white/5 border-white/10 text-white" value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400">Slug</label>
                        <Input className="bg-white/5 border-white/10 text-white" value={postForm.slug} onChange={e => setPostForm({ ...postForm, slug: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">Image URL / Upload</label>
                      <div className="flex gap-2">
                        <Input
                          className="bg-white/5 border-white/10 flex-1 text-white"
                          value={postForm.imageUrl}
                          onChange={e => setPostForm({ ...postForm, imageUrl: e.target.value })}
                        />
                        <label className="cursor-pointer">
                          <Input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                              const formData = new FormData();
                              formData.append("image", file);
                              try {
                                const res = await fetch("/api/admin/upload", {
                                  method: "POST",
                                  headers: { Authorization: `Bearer ${token}` },
                                  body: formData
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setPostForm(prev => ({ ...prev, imageUrl: data.url }));
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                          />
                          <div className="h-10 px-4 flex items-center bg-primary/20 text-primary border border-primary/30 rounded-md">
                            <Plus size={18} />
                          </div>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">Excerpt</label>
                      <Input className="bg-white/5 border-white/10 text-white" value={postForm.excerpt} onChange={e => setPostForm({ ...postForm, excerpt: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">Content (Markdown)</label>
                      <Textarea className="bg-white/5 border-white/10 text-white h-64" value={postForm.content} onChange={e => setPostForm({ ...postForm, content: e.target.value })} />
                    </div>
                    <div className="pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={postForm.isPublished} onChange={e => setPostForm({ ...postForm, isPublished: e.target.checked })} />
                        <span className="text-sm text-gray-300">{t("blog_tab.status")} ({t("projects_tab.published")})</span>
                      </label>
                    </div>
                    <Button onClick={handleSavePost} disabled={loading} className="w-full mt-4">
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t("admin.save")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden overflow-x-auto">
              <table className="w-full text-sm text-left rtl:text-right">
                <thead className="bg-white/5 text-gray-400 font-medium border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4">{t("blog_tab.title")}</th>
                    <th className="px-6 py-4">{t("blog_tab.status")}</th>
                    <th className="px-6 py-4">{t("blog_tab.date")}</th>
                    <th className="px-6 py-4">{t("blog_tab.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium">{post.title}</td>
                      <td className="px-6 py-4">
                        {post.isPublished ? (
                          <span className="text-green-500 text-xs">{t("projects_tab.published")}</span>
                        ) : (
                          <span className="text-yellow-500 text-xs">{t("projects_tab.draft")}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString(i18n.language)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditingPost(post);
                            setPostForm({
                              title: post.title,
                              slug: post.slug,
                              content: post.content,
                              excerpt: post.excerpt,
                              imageUrl: post.imageUrl || "",
                              isPublished: post.isPublished,
                            });
                            setPostDialog(true);
                          }}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeletePost(post.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* AI Chats Tab */}
          <TabsContent value="chats">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-4xl font-bold">{t("admin.chats")}</h1>
                <p className="text-gray-400 mt-1">{i18n.language === "ar" ? "مراقبة والتدخل في محادثات الذكاء الاصطناعي." : "Monitor and intervene in AI conversations."}</p>
              </div>
              <Button onClick={handleTestAi} disabled={testingAi} variant="outline" className="border-primary/50 text-primary">
                {testingAi ? <Loader2 className="animate-spin mr-2" size={16} /> : `⚡ ${t("admin.settings_tab.test_ai")}`}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
              {/* Sessions List */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/10 bg-white/5 font-bold text-sm">
                  {i18n.language === "ar" ? "الجلسات النشطة" : "Active Sessions"}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {chatSessions.length === 0 && <p className="text-center text-gray-500 py-10 text-sm">
                    {i18n.language === "ar" ? "لا توجد جلسات نشطة" : "No active sessions"}
                  </p>}
                  {chatSessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => setActiveChatId(session.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all border ${activeChatId === session.id ? 'bg-primary/20 border-primary/50' : 'hover:bg-white/5 border-transparent'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">ID: {session.id.slice(0, 8)}...</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-500">{session.status}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {i18n.language === "ar" ? "آخر نشاط" : "Last active"}: {new Date(session.updatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat View */}
              <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden text-left rtl:text-right">
                {activeChatId ? (
                  <>
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                      <span className="font-bold">Chat Session: {activeChatId.slice(0, 8)}</span>
                      <Button variant="ghost" size="sm" onClick={() => fetchChatMessages(activeChatId, localStorage.getItem("token") || "")}>Refresh</Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {chatMessages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-primary text-black font-bold' :
                              msg.sender === 'admin' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-200'
                            }`}>
                            <p className="text-[10px] opacity-50 mb-1 uppercase font-bold">{msg.sender}</p>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-white/10 flex gap-2">
                      <Input
                        placeholder={i18n.language === "ar" ? "اكتب رد المسؤول..." : "Type admin response..."}
                        value={replyInput}
                        onChange={e => setReplyInput(e.target.value)}
                        className="bg-black/50 border-white/10 text-white"
                        onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                      />
                      <Button onClick={handleSendReply} disabled={sendingReply || !replyInput.trim()}>
                        {sendingReply ? <Loader2 className="animate-spin" size={16} /> : (i18n.language === "ar" ? "إرسال" : "Send")}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-center items-center justify-center text-gray-500 flex-col gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center opacity-20">🤖</div>
                    <p>{i18n.language === "ar" ? "اختر جلسة لعرض المحادثة" : "Select a session to view the conversation"}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{t("admin.skills")}</h2>
              <Dialog open={skillDialog} onOpenChange={setSkillDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingSkill(null);
                    setSkillForm({ name: "", category: "Frontend", proficiency: "90%", icon: "" });
                  }}>
                    <Plus className="w-4 h-4 mr-2" /> {t("admin.add_new")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle>{editingSkill ? t("admin.edit") : t("admin.add_new")} {t("admin.skills")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">{t("skills_tab.name")}</label>
                      <Input className="bg-white/5 border-white/10 text-white" value={skillForm.name} onChange={e => setSkillForm({ ...skillForm, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400">{t("skills_tab.category")}</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 py-2 px-3 text-sm text-white"
                          value={skillForm.category}
                          onChange={e => setSkillForm({ ...skillForm, category: e.target.value })}
                        >
                          <option value="Frontend">Frontend</option>
                          <option value="Backend">Backend</option>
                          <option value="AI & ML">AI & ML</option>
                          <option value="Tools">Tools</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400">{t("skills_tab.proficiency")}</label>
                        <Input className="bg-white/5 border-white/10 text-white" value={skillForm.proficiency} onChange={e => setSkillForm({ ...skillForm, proficiency: e.target.value })} />
                      </div>
                    </div>
                    <Button onClick={handleSaveSkill} disabled={loading} className="w-full mt-4">
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t("admin.save")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {skills.map(skill => (
                <div key={skill.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center group">
                  <div>
                    <h4 className="font-bold">{skill.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 uppercase">{skill.category}</span>
                      <span className="text-xs text-primary">{skill.proficiency}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingSkill(skill);
                        setSkillForm({
                          name: skill.name,
                          category: skill.category,
                          proficiency: skill.proficiency,
                          icon: skill.icon || ""
                        });
                        setSkillDialog(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleDeleteSkill(skill.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Testimonials Tab */}
          <TabsContent value="testimonials">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{t("admin.testimonials")}</h2>
              <Dialog open={testimonialDialog} onOpenChange={setTestimonialDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingTestimonial(null);
                    setTestimonialForm({ clientName: "", role: "", content: "", avatarUrl: "" });
                  }}>
                    <Plus className="w-4 h-4 mr-2" /> {t("admin.add_new")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle>{t("admin.add_new")} {t("admin.testimonials")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input placeholder={t("testimonials_tab.client")} className="bg-white/5 border-white/10 text-white" value={testimonialForm.clientName} onChange={e => setTestimonialForm({ ...testimonialForm, clientName: e.target.value })} />
                    <Input placeholder={t("testimonials_tab.role")} className="bg-white/5 border-white/10 text-white" value={testimonialForm.role} onChange={e => setTestimonialForm({ ...testimonialForm, role: e.target.value })} />
                    <Textarea placeholder={t("testimonials_tab.content")} className="bg-white/5 border-white/10 text-white" value={testimonialForm.content} onChange={e => setTestimonialForm({ ...testimonialForm, content: e.target.value })} />
                    <Button onClick={handleSaveTestimonial} disabled={loading} className="w-full mt-2">
                      {t("admin.save")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials.map(t_item => (
                <div key={t_item.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl relative group">
                  <div className="flex gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                      {t_item.clientName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold">{t_item.clientName}</h4>
                      <p className="text-xs text-gray-500">{t_item.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 italic">"{t_item.content}"</p>
                  <div className="absolute top-4 right-4 text-nowrap">
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDeleteTestimonial(t_item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{t("admin.settings_tab.title")}</h2>
            </div>
            <div className="max-w-2xl space-y-8">
              <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">🔒 {t("admin.settings_tab.sec_security")}</h3>
                <Button onClick={() => setPasswordDialog(true)} className="w-full">
                  {t("admin.settings_tab.change_pwd")}
                </Button>

                <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm">Two-Factor Authentication (2FA)</h4>
                      <p className="text-xs text-gray-500">Secure your account with TOTP (Google Authenticator)</p>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${is2FAEnabled ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                      {is2FAEnabled ? 'Protected' : 'Risk Detected'}
                    </span>
                  </div>
                  {!is2FAEnabled ? (
                    <Button
                      variant="outline"
                      onClick={handleInit2FA}
                      disabled={settingUp2FA}
                      className="w-full border-secondary/30 text-secondary hover:bg-secondary/10"
                    >
                      {settingUp2FA ? <Loader2 className="animate-spin mr-2" /> : "🚀 Activate 2FA"}
                    </Button>
                  ) : (
                    <p className="text-xs text-green-500 text-center font-mono">Military-Grade 2FA is Active</p>
                  )}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">🤖 {t("admin.settings_tab.sec_ai")}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-sm">Gemini 1.5 Flash</span>
                    <span className={`text-xs px-2 py-1 rounded ${configStatus.gemini ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {configStatus.gemini ? 'Active' : 'Missing API Key'}
                    </span>
                  </div>
                  <Button onClick={handleTestAi} disabled={testingAi} variant="outline" className="w-full">
                    {t("admin.settings_tab.test_ai")}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Audit Vault Tab */}
          <TabsContent value="audit">
            <div className="py-6">
              <AuditLogsView />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Reply Modal */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{i18n.language === "ar" ? "تفاصيل الرسالة" : "Message Details"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center text-xs text-gray-400">
              <p>{selectedMessage?.name} &lt;{selectedMessage?.email}&gt;</p>
              <p>{selectedMessage && new Date(selectedMessage.createdAt).toLocaleString(i18n.language)}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/5 text-sm whitespace-pre-wrap min-h-[100px]">
              {selectedMessage?.message}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setSelectedMessage(null)}>{i18n.language === "ar" ? "إغلاق" : "Close"}</Button>
            <Button onClick={() => {
              window.location.href = `mailto:${selectedMessage?.email}`;
            }}>{i18n.language === "ar" ? "رد بالبريد" : "Reply via Email"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{t("admin.settings_tab.change_pwd")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              type="password"
              placeholder={i18n.language === "ar" ? "كلمة المرور الجديدة" : "New Password"}
              className="bg-white/5 border-white/10 text-white"
              value={passwordForm.newPassword}
              onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            />
            <Input
              type="password"
              placeholder={i18n.language === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
              className="bg-white/5 border-white/10 text-white"
              value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            />
            <Button onClick={handleUpdatePassword} disabled={updatingPassword} className="w-full">
              {updatingPassword && <Loader2 className="animate-spin mr-2" size={16} />}
              {t("admin.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Dialog */}
      <Dialog open={twoFactorDialog} onOpenChange={setTwoFactorDialog}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{i18n.language === "ar" ? "ربط تطبيق المصادقة" : "Link Mobile Authenticator"}</DialogTitle>
          </DialogHeader>
          {twoFactorSetup && (
            <div className="space-y-6 pt-4">
              <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                <p className="text-xs text-secondary font-bold uppercase mb-2">
                  {i18n.language === "ar" ? "الكود السري" : "Secret Key"}
                </p>
                <p className="text-xl font-mono tracking-widest text-primary select-all">
                  {twoFactorSetup.secret}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-400">
                  {i18n.language === "ar"
                    ? "1. أدخل الكود السري يدوياً في تطبيق Google Authenticator."
                    : "1. Manually enter the code above in Google Authenticator."}
                </p>
                <p className="text-xs text-gray-400">
                  {i18n.language === "ar"
                    ? "2. أدخل الأرقام الستة من التطبيق للتفعيل."
                    : "2. Enter the 6-digit code from the app below to verify."}
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="000000"
                  maxLength={6}
                  className="bg-white/5 border-white/10 text-center text-2xl tracking-[0.5em]"
                  value={mfaVerifyCode}
                  onChange={e => setMfaVerifyCode(e.target.value)}
                />
                <Button onClick={handleVerify2FA} className="w-full bg-secondary hover:bg-secondary/80 text-black font-bold">
                  {i18n.language === "ar" ? "تحقق وتفعيل" : "Verify & Activate"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}