import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

interface AnalyticsViewProps {
  messages: any[];
  chatSessions: any[];
  analytics: {
    visits: number;
    messages: number;
    projects: number;
    posts: number;
    skills: number;
    guestbook: number;
  } | null;
}

export default function AnalyticsView({ messages, chatSessions, analytics }: AnalyticsViewProps) {
  const { t, i18n } = useTranslation();

  const { data: health } = useQuery<{ latency: string; uptime: string; memoryUsage: string; memoryPercentage: number }>({
    queryKey: ["/api/admin/health"],
    refetchInterval: 10000, // Refresh every 10s
  });

  // 1. Process data for Message Trends (last 7 days)
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString(i18n.language);
    }).reverse();

    return last7Days.map((date) => {
      const count = messages.filter(
        (m) => new Date(m.createdAt).toLocaleDateString(i18n.language) === date
      ).length;
      return { date, count };
    });
  }, [messages, i18n.language]);

  // 2. Process data for Status Distribution
  const pieData = useMemo(() => {
    const read = messages.filter((m) => m.isRead).length;
    const unread = messages.length - read;
    return [
      { name: i18n.language === "ar" ? "مقروء" : "Read", value: read, color: "#10b981" },
      { name: i18n.language === "ar" ? "غير مقروء" : "Unread", value: unread, color: "#ef4444" },
    ];
  }, [messages, i18n.language]);

  const avgResponseTime = useMemo(() => {
    const readMessages = messages.filter(m => m.isRead && m.createdAt && m.updatedAt);
    if (readMessages.length === 0) return i18n.language === "ar" ? "لا توجد بيانات" : "No data";
    
    // Approximate response time based on updatedAt (when it was marked read)
    const totalTime = readMessages.reduce((acc, m) => {
      const created = new Date(m.createdAt).getTime();
      const updated = new Date(m.updatedAt).getTime();
      const diff = Math.max(0, updated - created);
      return acc + diff;
    }, 0);
    
    const avgMs = totalTime / readMessages.length;
    const avgHours = Math.round(avgMs / (1000 * 60 * 60));
    
    if (avgHours < 1) return i18n.language === "ar" ? "أقل من ساعة" : "Under 1h";
    return i18n.language === "ar" ? `حوالي ${avgHours} ساعة` : `Approx. ${avgHours}h`;
  }, [messages, i18n.language]);

  return (
    <div className="space-y-8">
      {/* 📊 Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Row 1 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">{t("admin.analytics_view.total_visits")}</CardTitle>
              <span className="text-2xl group-hover:scale-110 transition-transform">🌐</span>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white leading-tight">{analytics?.visits || 0}</div>
              <p className="text-xs text-gray-500 mt-2 italic">Actual unique entry logs</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">{t("admin.analytics_view.total_messages")}</CardTitle>
              <span className="text-2xl group-hover:scale-110 transition-transform">📩</span>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white leading-tight">{analytics?.messages || messages.length}</div>
              <p className="text-xs text-blue-400 mt-2 font-medium">+{messages.filter(m => !m.isRead).length} New</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">{t("admin.analytics_view.total_projects")}</CardTitle>
              <span className="text-2xl group-hover:scale-110 transition-transform">📂</span>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white leading-tight">{analytics?.projects || 0}</div>
              <p className="text-xs text-gray-500 mt-2">Showcased works</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Row 2 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">{t("admin.analytics_view.total_posts")}</CardTitle>
              <span className="text-2xl group-hover:scale-110 transition-transform">✍️</span>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white leading-tight">{analytics?.posts || 0}</div>
              <p className="text-xs text-gray-500 mt-2">Articles & updates</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">{t("admin.analytics_view.total_skills")}</CardTitle>
              <span className="text-2xl group-hover:scale-110 transition-transform">🛠️</span>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white leading-tight">{analytics?.skills || 0}</div>
              <p className="text-xs text-gray-500 mt-2">Core competencies</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}>
          <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">{t("admin.analytics_view.active_chats")}</CardTitle>
              <span className="text-2xl group-hover:scale-110 transition-transform">🤖</span>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-500 leading-tight">{chatSessions.length}</div>
              <p className="text-xs text-gray-500 mt-2">Digital interaction</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 📈 Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">{t("admin.analytics_view.activity_7d")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
                  <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#1f1f1f", border: "1px solid #333" }} />
                  <Area type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">{t("admin.analytics_view.status_dist")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1f1f1f", border: "1px solid #333" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🚑 Health & Logs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">{t("admin.analytics_view.health")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">{t("admin.analytics_view.db_status")}</span>
              <span className="text-green-500 font-bold">{i18n.language === "ar" ? "متصل" : "Online"}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">{t("admin.analytics_view.response_rate")}</span>
              <span className="text-white font-medium">{avgResponseTime}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">{t("admin.analytics_view.uptime")}</span>
              <span className="text-gray-200">{health?.uptime || "..."}</span>
            </div>
            <div className="pt-4 border-t border-white/5">
              <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                <span>Memory ({health?.memoryUsage || "..."})</span>
                <span>{health?.memoryPercentage || 0}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${health?.memoryPercentage || 0}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{t("admin.analytics_view.audit_logs")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {messages.slice(0, 4).map((msg, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 text-xs">
                  <span className="font-medium text-gray-200">
                    {msg.isRead 
                      ? (i18n.language === "ar" ? `قراءة: ${msg.name}` : `Read: ${msg.name}`)
                      : (i18n.language === "ar" ? `جديد: ${msg.name}` : `New: ${msg.name}`)}
                  </span>
                  <span className="text-gray-500">{new Date(msg.createdAt).toLocaleDateString(i18n.language)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
