import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function Login() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  // 🔐 Auto Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      setLocation("/ibrahim-workspace-Admin");
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    setError("");

    // Basic Validation
    if (!username.trim() || !password.trim()) {
      setError(t("login.error_required"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          username, 
          password,
          twoFactorCode: mfaRequired ? twoFactorCode : undefined
        }),
      });

      const data = await res.json();

      if (res.status === 403 && data.mfaRequired) {
        setMfaRequired(true);
        setError("");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (remember) {
        localStorage.setItem("token", data.token);
      } else {
        sessionStorage.setItem("token", data.token);
      }

      setLocation("/ibrahim-workspace-Admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black text-white">

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl">

        <h1 className="text-3xl font-bold text-center mb-2">
          {t("login.title")}
        </h1>
        <p className="text-center text-gray-400 text-sm mb-8">
          {t("login.subtitle")}
        </p>

        <form onSubmit={handleLogin} className="space-y-5">

          {/* Username */}
          <div>
            <label className="text-sm text-gray-400">{t("login.username")}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1 p-3 bg-black border border-gray-700 rounded-lg focus:border-white outline-none transition"
              placeholder={t("login.username_placeholder")}
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-gray-400">{t("login.password")}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 p-3 bg-black border border-gray-700 rounded-lg focus:border-white outline-none transition"
                placeholder={t("login.password_placeholder")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm bg-black px-2"
              >
                {showPassword ? t("login.hide") : t("login.show")}
              </button>
            </div>
          </div>

          {/* 🔐 2FA Code Field (Dynamic) */}
          {mfaRequired && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2 border-t border-white/10 pt-4"
            >
              <label className="text-sm text-secondary font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                {t("login.2fa_code") || "Two-Factor Code (TOTP)"}
              </label>
              <input
                type="text"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                autoFocus
                className="w-full p-3 bg-secondary/5 border border-secondary/30 rounded-lg focus:border-secondary outline-none transition text-center text-2xl tracking-[1em] font-mono"
                placeholder="000000"
              />
              <p className="text-[10px] text-gray-500 text-center">
                {t("login.2fa_help") || "Enter the 6-digit code from your authenticator app"}
              </p>
            </motion.div>
          )}

          {/* Remember */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
              />
              {t("login.remember")}
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold transition disabled:opacity-50 ${
              mfaRequired ? "bg-secondary text-black shadow-[0_0_20px_rgba(0,229,255,0.3)]" : "bg-white text-black"
            }`}
          >
            {loading ? t("login.signing_in") : (mfaRequired ? (t("login.verify") || "Verify & Enter") : t("login.signin"))}
          </button>

        </form>
      </div>
    </div>
  );
}