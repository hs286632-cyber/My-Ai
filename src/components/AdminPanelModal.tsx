import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Lock,
  BarChart2,
  Sliders,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Save,
  CheckCircle2,
  Users,
  MessageSquare,
  Image as ImageIcon,
  Key,
} from "lucide-react";
import { AdminSettings, UsageStats, SystemLog } from "../types";

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "dark" | "light";
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<"stats" | "settings" | "logs">("stats");
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [newPasscode, setNewPasscode] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    }
  }, [isAuthenticated]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
      } else {
        setAuthError(data.error || "Invalid passcode.");
      }
    } catch (err) {
      setAuthError("Failed to authenticate.");
    }
  };

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data.stats);
      setSettings(data.settings);
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings,
          newPasscode: newPasscode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setSaveSuccess(true);
        if (newPasscode.trim()) setNewPasscode("");
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert("Failed to update admin settings.");
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to clear all error and activity logs?")) return;
    try {
      await fetch("/api/admin/clear-logs", { method: "POST" });
      fetchAdminData();
    } catch (err) {
      alert("Failed to clear logs.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`relative w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-[90vh] ${
          theme === "dark"
            ? "bg-slate-950 text-slate-100 border-slate-800"
            : "bg-white text-slate-900 border-slate-200"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-inherit flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base leading-tight">
                Admin Control Panel
              </h2>
              <p className="text-xs text-slate-400">
                System monitoring, AI model configuration & usage metrics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Login Auth Screen */}
        {!isAuthenticated ? (
          <div className="p-8 max-w-md mx-auto w-full space-y-5 text-center my-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Admin Authentication</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your admin passcode to access system settings. (Default: <code className="text-amber-400">admin123</code>)
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                placeholder="Enter admin passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-sm outline-none focus:border-amber-500"
                autoFocus
              />
              {authError && (
                <p className="text-xs text-rose-400 font-medium">{authError}</p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition"
              >
                Access Panel
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Nav Tabs */}
            <div className="flex border-b border-inherit px-4 bg-slate-950/40 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("stats")}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
                  activeTab === "stats"
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <BarChart2 className="w-4 h-4" /> Overview Stats
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
                  activeTab === "settings"
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sliders className="w-4 h-4" /> AI & Model Settings
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
                  activeTab === "logs"
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <AlertTriangle className="w-4 h-4" /> System Logs ({stats?.logs.length || 0})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: OVERVIEW STATS */}
              {activeTab === "stats" && stats && (
                <div className="space-y-6">
                  {/* Metric Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Total Messages</span>
                        <MessageSquare className="w-4 h-4 text-indigo-400" />
                      </div>
                      <p className="text-2xl font-bold text-slate-100">
                        {stats.totalMessages}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Images Created</span>
                        <ImageIcon className="w-4 h-4 text-purple-400" />
                      </div>
                      <p className="text-2xl font-bold text-slate-100">
                        {stats.totalImages}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Active Sessions</span>
                        <Users className="w-4 h-4 text-green-400" />
                      </div>
                      <p className="text-2xl font-bold text-slate-100">
                        {stats.activeUsersCount}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Error Count</span>
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      </div>
                      <p className="text-2xl font-bold text-slate-100">
                        {stats.errorCount}
                      </p>
                    </div>
                  </div>

                  {/* System Status Summary */}
                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs space-y-2">
                    <h4 className="font-semibold text-slate-200">API Health Status</h4>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Gemini API Backend:</span>
                      <span className="text-green-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active & Operational
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Server Engine:</span>
                      <span className="text-slate-200">Express Node.js on Cloud Run</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: AI & MODEL SETTINGS */}
              {activeTab === "settings" && settings && (
                <div className="space-y-5 max-w-2xl">
                  {/* Model Choice */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Default Language Model
                    </label>
                    <select
                      value={settings.defaultModel}
                      onChange={(e) =>
                        setSettings({ ...settings, defaultModel: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs outline-none"
                    >
                      <option value="gemini-3.6-flash">
                        gemini-3.6-flash (Fast, Multi-lingual standard)
                      </option>
                      <option value="gemini-3.1-pro-preview">
                        gemini-3.1-pro-preview (Advanced Reasoning)
                      </option>
                    </select>
                  </div>

                  {/* System Instruction */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      System Instruction / AI Persona
                    </label>
                    <textarea
                      value={settings.systemInstruction}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          systemInstruction: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs outline-none"
                    />
                  </div>

                  {/* Temperature */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-300">
                        Creativity Temperature ({settings.temperature})
                      </span>
                      <span className="text-slate-400">
                        {settings.temperature < 0.5 ? "Focused" : "Creative"}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.temperature}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          temperature: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-amber-500"
                    />
                  </div>

                  {/* Image & Rate Limits */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Daily Image Limit Per User
                      </label>
                      <input
                        type="number"
                        value={settings.imageLimitDaily}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            imageLimitDaily: parseInt(e.target.value) || 10,
                          })
                        }
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Change Admin Passcode
                      </label>
                      <input
                        type="password"
                        placeholder="New passcode (optional)"
                        value={newPasscode}
                        onChange={(e) => setNewPasscode(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs outline-none placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  {/* Save Action */}
                  <div className="flex items-center gap-3 pt-3">
                    <button
                      onClick={handleSaveSettings}
                      className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Save Configurations
                    </button>
                    {saveSuccess && (
                      <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Saved successfully!
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: LOGS */}
              {activeTab === "logs" && stats && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-300">
                      Recent Activity & Exception Logs
                    </h3>
                    <button
                      onClick={handleClearLogs}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear Logs
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {stats.logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.type === "error"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : log.type === "image"
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-indigo-500/20 text-indigo-400"
                            }`}
                          >
                            {log.type}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="font-medium text-slate-200">{log.message}</p>
                        {log.details && (
                          <p className="text-[11px] text-slate-400 font-mono">
                            {log.details}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
