import React, { useState } from 'react';
import {
  Settings,
  Server,
  Download,
  Upload,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Bell,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useSettingsStore } from '../store/useSettingsStore';
import { api } from '../services/api';
import { notificationService } from '../services/notificationService';
import { ThemeMode } from '../types';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, apiBaseUrl, setApiBaseUrl, resetApiBaseUrl } = useSettingsStore();

  const [inputUrl, setInputUrl] = useState(apiBaseUrl);
  const [testStatus, setTestStatus] = useState<{
    tested: boolean;
    success?: boolean;
    message?: string;
  }>({ tested: false });
  const [isTesting, setIsTesting] = useState(false);

  // Backup restore states
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [mergeStrategy, setMergeStrategy] = useState<'merge' | 'replace'>('merge');
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Notifications
  const [notifGranted, setNotifGranted] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus({ tested: false });
    try {
      let target = inputUrl.trim();
      if (target.endsWith('/')) target = target.slice(0, -1);

      const res = await fetch(`${target}/health`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setTestStatus({
          tested: true,
          success: true,
          message: `Connection successful! Server: ${data.app || 'SmartTask'} (v${data.version || '1.0'})`,
        });
        setApiBaseUrl(target);
      } else {
        setTestStatus({
          tested: true,
          success: false,
          message: `Server returned HTTP status ${res.status}`,
        });
      }
    } catch (e: any) {
      setTestStatus({
        tested: true,
        success: false,
        message: `Failed to connect: ${e.message || 'Network unreachable'}. Please check URL and CORS.`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetUrl = () => {
    resetApiBaseUrl();
    const defaultUrl = useSettingsStore.getState().apiBaseUrl;
    setInputUrl(defaultUrl);
    setTestStatus({
      tested: true,
      success: true,
      message: 'Reset to default API endpoint.',
    });
  };

  const handleExportJson = async () => {
    try {
      const data = await api.backup.exportJson();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smarttask_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const handleExportCsv = () => {
    const csvUrl = api.backup.exportCsvUrl();
    window.open(csvUrl, '_blank');
  };

  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile || isRestoring) return;

    try {
      setIsRestoring(true);
      setRestoreStatus(null);
      const fileText = await restoreFile.text();
      const parsedJson = JSON.parse(fileText);

      const result = await api.backup.restoreJson(parsedJson, mergeStrategy);
      setRestoreStatus(`Success: ${result.message}! Reloading data...`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setRestoreStatus(`Restore error: ${err.message || 'Invalid backup file'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setNotifGranted(granted);
    if (granted) {
      await notificationService.scheduleNotification(
        1,
        'SmartTask Notifications Enabled',
        'You will now receive upcoming deadline and focus alerts!'
      );
    }
  };

  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Application Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage system preferences, configure backend API servers, and manage data backups.
        </p>
      </div>

      {/* 1. Theme Preferences */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Appearance & Theme
          </h2>
          <p className="text-xs text-slate-500">
            Choose light, dark, or automatic system theme.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { mode: 'light' as ThemeMode, label: 'Light', icon: Sun },
            { mode: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
            { mode: 'system' as ThemeMode, label: 'System', icon: Laptop },
          ].map((item) => (
            <button
              key={item.mode}
              onClick={() => setTheme(item.mode)}
              className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                theme === item.mode
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Configurable API Endpoint */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Backend API Server URL
            </h2>
            <p className="text-xs text-slate-500">
              Configure the connection URL for Desktop browser, LAN access, or Android APK.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="http://localhost:8000 or http://192.168.1.100:8000 or https://api.myvps.com"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test & Save'}</span>
            </button>
            <button
              onClick={handleResetUrl}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Reset
            </button>
          </div>

          {testStatus.tested && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-xs border ${
                testStatus.success
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900'
              }`}
            >
              {testStatus.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{testStatus.message}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 space-y-1 leading-relaxed">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              💡 Connecting from Android or other devices:
            </p>
            <p>
              • <strong>MacBook Localhost</strong>: Runs on <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">http://localhost:8000</code>.
            </p>
            <p>
              • <strong>Android Emulator</strong>: Use <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">http://10.0.2.2:8000</code> to connect to your host MacBook.
            </p>
            <p>
              • <strong>Physical Android Phone (Local Wi-Fi)</strong>: Use your MacBook's LAN IP address (e.g. <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">http://192.168.x.x:8000</code>).
            </p>
            <p>
              • <strong>Remote Cloud / VPS</strong>: Use your public HTTPS domain (e.g. <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">https://smarttask.yourdomain.com</code>).
            </p>
          </div>
        </div>
      </div>

      {/* 3. Notifications */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Notifications & Reminders
              </h2>
              <p className="text-xs text-slate-500">
                Receive local device alerts for deadlines and daily focus tasks.
              </p>
            </div>
          </div>

          <button
            onClick={handleEnableNotifications}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            {notifGranted ? 'Notifications Active' : 'Enable Notifications'}
          </button>
        </div>
      </div>

      {/* 4. Backup & Restore Data Portability */}
      <div className="glass-card p-6 rounded-3xl space-y-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Data Portability, Backup & Restore
          </h2>
          <p className="text-xs text-slate-500">
            Export complete JSON database archives, download task CSV reports, or restore from existing backups.
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-indigo-500" />
            <span>Export Full Backup (JSON)</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Export Task Report (CSV)</span>
          </button>
        </div>

        {/* Restore section */}
        <form onSubmit={handleRestoreSubmit} className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Restore from JSON Backup File:
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
            <input
              type="file"
              accept=".json"
              onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300 hover:file:bg-indigo-100"
            />

            <select
              value={mergeStrategy}
              onChange={(e) => setMergeStrategy(e.target.value as 'merge' | 'replace')}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="merge">Merge (Keep existing)</option>
              <option value="replace">Replace (Overwrite all)</option>
            </select>

            <button
              type="submit"
              disabled={!restoreFile || isRestoring}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isRestoring ? 'Restoring...' : 'Restore Backup'}</span>
            </button>
          </div>

          {restoreStatus && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              {restoreStatus}
            </p>
          )}
        </form>
      </div>

      {/* 5. Device Information */}
      <div className="glass-card p-6 rounded-3xl flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-slate-400" />
          <span>Platform: {isNative ? 'Capacitor Android Native Container' : 'Modern Web Browser'}</span>
        </div>
        <span>SmartTask v1.0.0 (Production Architecture)</span>
      </div>
    </div>
  );
};
