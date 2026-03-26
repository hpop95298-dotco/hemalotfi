import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Shield, 
  Lock, 
  Search, 
  AlertTriangle, 
  FileText, 
  User, 
  Globe, 
  Monitor,
  Calendar,
  Eye,
  RefreshCw
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AuditLogsView() {
  const { t, i18n } = useTranslation();
  const [vaultPassword, setVaultPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data: logs, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/audit-logs", vaultPassword],
    queryFn: async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch("/api/admin/audit-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ vaultPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        setIsUnlocked(false);
        throw new Error(err.message || "Failed to unlock vault.");
      }
      const data = await res.json();
      console.log("[AUDIT UI] Logs decrypted and fetched:", data);
      return data;
    },
    enabled: isUnlocked,
    retry: false,
    refetchInterval: 5000,
  });

  const testLogMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch("/api/admin/test-log", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Diagnostic test failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Security Shield Active: Diagnostic event recorded.");
      refetch();
    },
    onError: () => {
      toast.error("Shield Diagnostic Failed. Check server connectivity.");
    }
  });

  const handleUnlock = async () => {
    if (!vaultPassword) return toast.error("Please enter the security hex.");
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    try {
      const res = await fetch("/api/admin/audit-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ vaultPassword }),
      });
      if (res.ok) {
        setIsUnlocked(true);
        toast.success("Vault Unlocked. Decrypting trails...");
      } else {
        const err = await res.json();
        toast.error(`Access Denied: ${err.message}`);
        setVaultPassword("");
      }
    } catch (e) {
      toast.error("Shield interference detected.");
    }
  };

  const filteredLogs = logs?.filter((log: any) => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entityType.toLowerCase().includes(search.toLowerCase()) ||
    log.ipAddress?.includes(search)
  );

  if (!isUnlocked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
          <Card className="bg-black/40 border-red-900/30 backdrop-blur-xl border-t-red-500/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-red-500/20">
                <Shield className="w-8 h-8 text-red-500 animate-pulse" />
              </div>
              <CardTitle className="text-2xl font-bold text-white tracking-tighter">
                {i18n.language === "ar" ? "خزنة السجلات المشفرة" : "Encrypted Audit Vault"}
              </CardTitle>
              <p className="text-sm text-gray-500 uppercase tracking-widest font-mono">Aegis Level 5 Protocol</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Input
                type="password"
                placeholder={i18n.language === "ar" ? "أدخل مفتاح الأمان" : "Enter Security Hex"}
                className="bg-white/5 border-white/10 h-12 font-mono text-center tracking-[0.5em]"
                value={vaultPassword}
                onChange={(e) => setVaultPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              />
              <Button onClick={handleUnlock} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold group">
                {i18n.language === "ar" ? "فك التشفير" : "Decrypt & Access"} 🛡️
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="text-red-500" />
            {i18n.language === "ar" ? "سجل العمليات الإدارية" : "Administrative Audit Trail"}
          </h2>
          <p className="text-gray-500 font-mono text-sm">Real-time surveillance active</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => testLogMutation.mutate()} 
            disabled={testLogMutation.isPending}
            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
          >
            {testLogMutation.isPending ? "Testing..." : (i18n.language === "ar" ? "اختبار الدرع" : "Test Shield")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-white/10 hover:bg-white/5">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {i18n.language === "ar" ? "تحديث" : "Sync"}
          </Button>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder={i18n.language === "ar" ? "بحث في السجلات..." : "Search logs..."}
              className="bg-white/5 border-white/10 pl-10 h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="bg-black/40 border-white/10 overflow-hidden backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-white/5 font-mono text-[10px] uppercase">
            <TableRow className="border-white/5">
              <TableHead className="text-gray-400">{i18n.language === "ar" ? "العملية" : "Action"}</TableHead>
              <TableHead className="text-gray-400">{i18n.language === "ar" ? "النوع" : "Entity"}</TableHead>
              <TableHead className="text-gray-400">{i18n.language === "ar" ? "العنوان" : "IP Address"}</TableHead>
              <TableHead className="text-gray-400">{i18n.language === "ar" ? "الوقت" : "Timestamp"}</TableHead>
              <TableHead className="text-right text-gray-400">{i18n.language === "ar" ? "التفاصيل" : "Details"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filteredLogs?.map((log: any) => (
                <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <TableCell className="font-bold">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        log.action.includes("DELETE") || log.action.includes("FAILURE") ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                        log.action.includes("CREATE") || log.action.includes("SUCCESS") ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" :
                        "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                      }`} />
                      <span className="text-white text-xs tracking-wider">{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400 text-xs font-mono">{log.entityType}</TableCell>
                  <TableCell className="text-gray-500 text-xs font-mono">{log.ipAddress}</TableCell>
                  <TableCell className="text-gray-400 text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 opacity-50" />
                      {log.createdAt ? format(new Date(log.createdAt), "HH:mm:ss d/M") : "---"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500"
                      onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
        {filteredLogs?.length === 0 && (
          <div className="p-12 text-center text-gray-600 font-mono text-sm italic">
            {i18n.language === "ar" ? "لا توجد سجلات مطابقة للبحث" : "No intercepted signals matching criteria."}
          </div>
        )}
      </Card>

      {/* Slide-out Detail Panel */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:w-96 z-50"
          >
            <Card className="bg-zinc-950 border-white/20 shadow-2xl shadow-black ring-1 ring-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5">
                <CardTitle className="text-sm font-mono text-gray-400">Payload Diagnostics</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedLog(null)}>×</Button>
              </CardHeader>
              <CardContent className="pt-4">
                <pre className="text-[10px] text-red-400/80 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                  {JSON.stringify(JSON.parse(selectedLog.details || "{}"), null, 2)}
                </pre>
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2 text-[10px] text-gray-600 font-mono">
                  <div className="flex justify-between">
                    <span>AGENT:</span>
                    <span className="text-gray-400 truncate max-w-[200px]">{selectedLog.userAgent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LOG_ID:</span>
                    <span className="text-gray-400">{selectedLog.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
