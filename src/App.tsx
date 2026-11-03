/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  DEFAULT_SEED_STATE,
  PrivacySettings,
  SleepLogEntry,
  UserProfile,
  VitaPulseState,
  WaterIntakeEntry,
  createSnapshotRecordFromState,
  formatMaskedNumber,
  isGitHubDemoLocked,
  isPreventCloseLocked,
  loadState,
  saveState,
} from './utils/storage';
import {
  QuestionnaireAnswers,
  calculateBMI,
  calculateBMR,
  calculateNutritionAndExercisePlan,
  calculateStressIndex,
  calculateTDEE,
  classifyBMI,
  evaluateHealthQuestionnaire,
} from './utils/healthCalculations';
import { BmiOverviewTab } from './components/BmiOverviewTab';
import { QuestionnaireAndGoalsTab } from './components/QuestionnaireAndGoalsTab';
import { SleepAndWaterTab } from './components/SleepAndWaterTab';
import { HeartRateAndStressTab } from './components/HeartRateAndStressTab';
import { HistoryAndPrivacyTab } from './components/HistoryAndPrivacyTab';
import { UserGuideTab } from './components/UserGuideTab';
import {
  Eye,
  EyeOff,
  Lock,
  Sun,
  Moon,
  CheckCircle2,
  ShieldAlert,
  BookOpen,
  Globe,
  Server,
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'questionnaire'
  | 'sleep-water'
  | 'vitals-stress'
  | 'history-privacy'
  | 'guide';

const SESSION_LOCK_KEY = 'vitapulse_pin_locked_session';

export default function App() {
  const [state, setState] = useState<VitaPulseState>(() => loadState());
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isPinLocked, setIsPinLocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_LOCK_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [unlockInput, setUnlockInput] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [quickSaveToast, setQuickSaveToast] = useState<string | null>(null);

  const [restingHr, setRestingHr] = useState<number>(
    state.history[state.history.length - 1]?.restingHr || 60
  );
  const [stressParams, setStressParams] = useState({
    baselineHr: 60,
    sleepHours: state.sleepLogs[0]?.actualHours || 7.7,
    perceivedStress: 3,
    caffeineCups: 1,
    workHours: 8,
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    try {
      if (isPinLocked) {
        sessionStorage.setItem(SESSION_LOCK_KEY, '1');
      } else {
        sessionStorage.removeItem(SESSION_LOCK_KEY);
      }
    } catch {
      // Ignore storage access errors
    }
  }, [isPinLocked]);

  const { profile, questionnaire, history, waterLogsToday, sleepLogs, privacy } = state;
  const masked = privacy.maskSensitiveNumbers;
  const isGithubLocked = isGitHubDemoLocked(privacy);
  const effectiveDemoMode = isGithubLocked ? true : privacy.demoModeEnabled;
  const preventCloseLocked = isPreventCloseLocked(privacy);
  const effectivePreventClose = preventCloseLocked ? true : privacy.preventAccidentalClose;

  // Prevent accidental browser tab/window close when effectivePreventClose is enabled
  useEffect(() => {
    if (!effectivePreventClose) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '您有正在管理的健康紀錄，確定要離開或關閉視窗嗎？';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [effectivePreventClose]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const bmi = calculateBMI(profile.heightCm, profile.weightKg);
  const bmiInfo = classifyBMI(bmi, profile.bmiStandard);
  const bmr = calculateBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const nutritionPlan = calculateNutritionAndExercisePlan(tdee, profile.weightKg, bmi, profile.goal);
  const qEval = evaluateHealthQuestionnaire(questionnaire, bmi);
  const stressEval = calculateStressIndex({ restingHr, ...stressParams });
  const totalWaterMl = waterLogsToday.reduce((sum, w) => sum + w.amountMl, 0);
  const latestSleep = sleepLogs[0];

  const handleUpdateProfile = (partial: Partial<UserProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...partial },
    }));
  };

  const handleUpdateQuestionnaire = (partial: Partial<QuestionnaireAnswers>) => {
    setState((prev) => ({
      ...prev,
      questionnaire: { ...prev.questionnaire, ...partial },
    }));
  };

  const handleUpdatePrivacy = (partial: Partial<PrivacySettings>) => {
    setState((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, ...partial },
    }));
  };

  const handleSaveSnapshot = (note: string) => {
    setState((prev) => {
      const record = createSnapshotRecordFromState(
        prev,
        note,
        restingHr,
        stressEval.stressIndex
      );
      return {
        ...prev,
        history: [...prev.history, record],
      };
    });
    setQuickSaveToast(`已儲存今日健康快照（BMI ${bmi} / 體重 ${profile.weightKg} kg / 心率 ${restingHr} bpm）`);
    setTimeout(() => setQuickSaveToast(null), 3500);
  };

  const handleAddWater = (amountMl: number, beverageType: WaterIntakeEntry['beverageType']) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const entry: WaterIntakeEntry = {
      id: `w-${Date.now()}`,
      time: timeStr,
      amountMl,
      beverageType,
    };
    setState((prev) => ({
      ...prev,
      waterLogsToday: [entry, ...prev.waterLogsToday],
    }));
  };

  const handleRemoveWater = (id: string) => {
    setState((prev) => ({
      ...prev,
      waterLogsToday: prev.waterLogsToday.filter((w) => w.id !== id),
    }));
  };

  const handleUpdateWaterReminder = (enabled: boolean, intervalMins: number) => {
    setState((prev) => ({
      ...prev,
      waterReminderEnabled: enabled,
      waterReminderIntervalMins: intervalMins,
    }));
  };

  const handleAddSleepLog = (entry: Omit<SleepLogEntry, 'id'>) => {
    const newLog: SleepLogEntry = {
      ...entry,
      id: `s-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      sleepLogs: [newLog, ...prev.sleepLogs],
    }));
    setStressParams((prev) => ({ ...prev, sleepHours: entry.actualHours }));
  };

  const handleRemoveSleepLog = (id: string) => {
    setState((prev) => ({
      ...prev,
      sleepLogs: prev.sleepLogs.filter((s) => s.id !== id),
    }));
  };

  const handleDeleteHistoryRecord = (id: string) => {
    setState((prev) => ({
      ...prev,
      history: prev.history.filter((h) => h.id !== id),
    }));
  };

  const handleClearHistory = () => {
    setState((prev) => ({
      ...prev,
      history: [],
    }));
  };

  const handleRestoreDemoData = () => {
    setState(DEFAULT_SEED_STATE);
  };

  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = privacy.pinCode || '2580';
    if (unlockInput === expected) {
      setIsPinLocked(false);
      setUnlockInput('');
      setUnlockError(null);
    } else {
      setUnlockError('安全碼驗證錯誤，請輸入正確的 4~6 位數 PIN 碼以解鎖系統。');
    }
  };

  const NAV_ITEMS: { id: ActiveTab; label: string }[] = [
    { id: 'overview', label: '身體組成與總覽' },
    { id: 'questionnaire', label: '健康問卷與處方' },
    { id: 'sleep-water', label: '睡眠與飲水管家' },
    { id: 'vitals-stress', label: '心率與壓力分析' },
    { id: 'history-privacy', label: '歷史趨勢與隱私' },
    { id: 'guide', label: '使用說明' },
  ];

  // Strict PIN Lock Screen (Quick Skip Demo button removed; shows Demo PIN hint when in Demo Mode)
  if (isPinLocked) {
    const activePinCode = privacy.pinCode || '2580';
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
        <div
          role="dialog"
          aria-labelledby="pin-lock-title"
          className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h1 id="pin-lock-title" className="text-lg font-bold">
                VitaPulse 個人健康隱私鎖定中
              </h1>
            </div>
            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
              強制安全驗證
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            您的健康紀錄與生理指標受本地端 PIN 碼嚴格保護。請輸入您設定的安全碼以解鎖健康管家（不可略過）。
          </p>

          {effectiveDemoMode && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between">
              <span className="text-xs font-medium text-amber-900 dark:text-amber-200">
                演示模式 (Demo) 預設解鎖密碼：
              </span>
              <span className="text-sm font-mono font-bold tracking-widest text-amber-900 dark:text-amber-100 tabular-nums">
                {activePinCode}
              </span>
            </div>
          )}

          <form onSubmit={handleUnlockPin} className="space-y-3">
            <div>
              <label htmlFor="input-unlock-pin" className="block text-xs font-medium mb-1">
                輸入 PIN 安全碼
              </label>
              <input
                id="input-unlock-pin"
                type="password"
                autoFocus
                placeholder={
                  effectiveDemoMode
                    ? `請輸入演示密碼 (${activePinCode})`
                    : '請輸入 4~6 位數安全碼'
                }
                value={unlockInput}
                onChange={(e) => setUnlockInput(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            {unlockError && (
              <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {unlockError}
              </p>
            )}
            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              驗證 PIN 碼並解鎖健康管家
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Bar Contract: Strictly 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('overview');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
          >
            VitaPulse 健康管家
          </a>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            aria-label="主要健康功能導覽"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(item.id);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'border-teal-600 text-slate-900 dark:text-slate-100 font-semibold'
                      : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleSaveSnapshot('頂部導覽快速紀錄快照')}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              快速紀錄今日數據
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Mobile Navigation Strip */}
        <div
          role="tablist"
          aria-label="行動版功能切換"
          className="flex md:hidden overflow-x-auto gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-lg"
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                activeTab === item.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {quickSaveToast && (
          <div
            role="status"
            className="bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 text-xs font-medium text-emerald-900 dark:text-emerald-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{quickSaveToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setQuickSaveToast(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
            >
              關閉
            </button>
          </div>
        )}

        {/* Workspace Telemetry Strip + Secondary Privacy/Anti-Close/Guide Utility Toolbar */}
        <section
          aria-label="全方位生理核心指標摘要"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                個人全方位健康監控與身體組成管家
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                <span>
                  使用者：{effectiveDemoMode ? profile.name : profile.name.replace(/\s*\(示範\)/, '')}
                </span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>
                  環境：{isGithubLocked ? 'GitHub 公開演示 (防關閉鎖定)' : effectiveDemoMode ? '自架部署 (演示開啟)' : '自架部署 (個人自用)'}
                </span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>身高 {formatMaskedNumber(profile.heightCm, masked, 'cm')}</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>體重 {formatMaskedNumber(profile.weightKg, masked, 'kg')}</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>歷史紀錄 {history.length} 筆</span>
              </p>
            </div>

            {/* Secondary Workspace Utility Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Deployment Environment Indicator / Lock Button (Disabled when locked in GitHub mode; unlock requires PIN in Settings) */}
              <button
                type="button"
                disabled={isGithubLocked}
                onClick={() => {
                  if (isGithubLocked) return;
                  handleUpdatePrivacy({
                    deploymentTarget: 'github-pages',
                    demoModeEnabled: true,
                    preventAccidentalClose: true,
                  });
                  setQuickSaveToast('已切換為「GitHub 部署模式」，演示模式與防止關閉保護已強制鎖定開啟（欲切換回自架請至使用說明驗證 PIN 碼）');
                  setTimeout(() => setQuickSaveToast(null), 4000);
                }}
                title={
                  isGithubLocked
                    ? 'GitHub 部署演示模式已鎖定防關（不可直接點擊關閉；自架管理員可於「使用說明與設定」驗證 PIN 碼切換）'
                    : '目前為自己部署模式，點擊可鎖定為 GitHub 公開演示模式'
                }
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  isGithubLocked
                    ? 'bg-slate-100 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer'
                }`}
              >
                {isGithubLocked ? <Globe className="w-3.5 h-3.5" /> : <Server className="w-3.5 h-3.5" />}
                <span>{isGithubLocked ? 'GitHub 部署 (鎖定防關)' : '自己部署模式'}</span>
              </button>

              {/* Demo Mode Toggle (Locked ON when deployed to GitHub; freely toggleable when self-hosted) */}
              <button
                type="button"
                disabled={isGithubLocked}
                onClick={() => {
                  if (isGithubLocked) return;
                  const nextDemo = !privacy.demoModeEnabled;
                  handleUpdatePrivacy({
                    demoModeEnabled: nextDemo,
                    ...(nextDemo ? { preventAccidentalClose: true } : {}),
                  });
                }}
                title={
                  isGithubLocked
                    ? '部署到 GitHub 的演示模式已防止關閉'
                    : '自己部署環境下可自由開啟或關閉演示模式（開啟演示時將自動鎖定防誤關保護）'
                }
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  isGithubLocked
                    ? 'bg-slate-100 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : effectiveDemoMode
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 cursor-pointer'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 cursor-pointer'
                }`}
              >
                <span>
                  {isGithubLocked
                    ? '演示模式 (防關閉鎖定)'
                    : effectiveDemoMode
                      ? '演示模式開啟 (點擊可關閉)'
                      : '演示已關閉 (個人自用)'}
                </span>
              </button>

              {/* Prevent Accidental Close Guard Toggle (Locked ON whenever GitHub mode OR Demo Mode is ON; only toggleable when Demo Mode is OFF in self-hosted) */}
              <button
                type="button"
                disabled={preventCloseLocked}
                onClick={() => {
                  if (preventCloseLocked) return;
                  handleUpdatePrivacy({ preventAccidentalClose: !privacy.preventAccidentalClose });
                }}
                title={
                  preventCloseLocked
                    ? '演示模式或 GitHub 部署下強制鎖定防止關閉保護；請先於自己部署模式下關閉演示模式才可解除防關'
                    : '點擊切換防止誤關視窗保護 (beforeunload)'
                }
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  preventCloseLocked
                    ? 'bg-slate-100 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : effectivePreventClose
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 cursor-pointer'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 cursor-pointer'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>
                  {preventCloseLocked
                    ? '防誤關 (鎖定防關)'
                    : effectivePreventClose
                      ? '防誤關保護中'
                      : '防誤關已關閉'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdatePrivacy({ maskSensitiveNumbers: !masked })}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  masked
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {masked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{masked ? '已開啟隱私遮罩' : '防窺隱私遮罩'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPinLocked(true)}
                title={
                  effectiveDemoMode
                    ? `點擊鎖定畫面（演示模式預設解鎖密碼：${privacy.pinCode || '2580'}）`
                    : '點擊立即以 PIN 碼鎖定健康儀表板'
                }
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {effectiveDemoMode
                    ? `PIN 鎖定 (Demo 密碼: ${privacy.pinCode || '2580'})`
                    : 'PIN 鎖定'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('guide')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'guide'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>使用說明與設定</span>
              </button>

              <button
                type="button"
                aria-label={darkMode ? '切換至淺色模式' : '切換至深色模式'}
                onClick={() => setDarkMode(!darkMode)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span>{darkMode ? '淺色主題' : '深色主題'}</span>
              </button>
            </div>
          </div>

          {/* 4-Column Summary KPI Strip */}
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
            <div className="pt-2 sm:pt-0 sm:pr-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                BMI 身體質量指數 ({profile.bmiStandard === 'tw' ? '國健署' : 'WHO'})
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {formatMaskedNumber(bmi, masked)}
                </span>
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                  {bmiInfo.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                TDEE 消耗 {formatMaskedNumber(tdee, masked, 'kcal')} · 建議攝取 {formatMaskedNumber(nutritionPlan.dailyCalories, masked, 'kcal')}
              </p>
            </div>

            <div className="pt-3 sm:pt-0 sm:px-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                健康問卷評分與處方等級
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {qEval.totalScore} 分
                </span>
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                  {qEval.grade} 級 ({qEval.recommendations[0]?.degree})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                目標蛋白 {nutritionPlan.macros.proteinGrams}g · 碳水 {nutritionPlan.macros.carbsGrams}g · 脂肪 {nutritionPlan.macros.fatGrams}g
              </p>
            </div>

            <div className="pt-3 lg:pt-0 sm:pr-4 lg:px-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                今日飲水達成率與昨晚睡眠品質
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400">
                  {totalWaterMl} ml
                </span>
                <span className="text-xs font-mono text-slate-500">
                  / {nutritionPlan.dailyWaterMl} ml
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                睡眠 {latestSleep ? `${latestSleep.actualHours}h (${latestSleep.qualityScore}分)` : '尚未記錄'} · 效率 {latestSleep ? `${latestSleep.efficiencyPct}%` : '-'}
              </p>
            </div>

            <div className="pt-3 lg:pt-0 sm:pl-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                靜息心率與身心壓力負荷指數
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                  {restingHr} bpm
                </span>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  壓力 {stressEval.stressIndex} ({stressEval.level})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                血壓 {masked ? '•••/••' : `${profile.systolicBp}/${profile.diastolicBp}`} mmHg · 腰圍 {formatMaskedNumber(profile.waistCm, masked, 'cm')}
              </p>
            </div>
          </div>
        </section>

        {/* Active Module Viewport */}
        {activeTab === 'overview' && (
          <BmiOverviewTab
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            history={history}
            onSaveSnapshot={handleSaveSnapshot}
            masked={masked}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'questionnaire' && (
          <QuestionnaireAndGoalsTab
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            questionnaire={questionnaire}
            onUpdateQuestionnaire={handleUpdateQuestionnaire}
            exerciseCompletedMinsThisWeek={state.exerciseCompletedMinsThisWeek}
            strengthCompletedSessionsThisWeek={state.strengthCompletedSessionsThisWeek}
            stepsToday={state.stepsToday}
            onUpdateExerciseProgress={(mins, sessions, steps) =>
              setState((prev) => ({
                ...prev,
                exerciseCompletedMinsThisWeek: mins,
                strengthCompletedSessionsThisWeek: sessions,
                stepsToday: steps,
              }))
            }
            masked={masked}
          />
        )}

        {activeTab === 'sleep-water' && (
          <SleepAndWaterTab
            profile={profile}
            waterLogsToday={waterLogsToday}
            onAddWater={handleAddWater}
            onRemoveWater={handleRemoveWater}
            waterReminderEnabled={state.waterReminderEnabled}
            waterReminderIntervalMins={state.waterReminderIntervalMins}
            onUpdateWaterReminder={handleUpdateWaterReminder}
            sleepLogs={sleepLogs}
            onAddSleepLog={handleAddSleepLog}
            onRemoveSleepLog={handleRemoveSleepLog}
          />
        )}

        {activeTab === 'vitals-stress' && (
          <HeartRateAndStressTab
            profile={profile}
            restingHr={restingHr}
            onUpdateRestingHr={setRestingHr}
            stressParams={stressParams}
            onUpdateStressParams={(partial) =>
              setStressParams((prev) => ({ ...prev, ...partial }))
            }
          />
        )}

        {activeTab === 'history-privacy' && (
          <HistoryAndPrivacyTab
            fullState={state}
            onDeleteHistoryRecord={handleDeleteHistoryRecord}
            onClearHistory={handleClearHistory}
            onRestoreDemoData={handleRestoreDemoData}
            onSaveSnapshot={handleSaveSnapshot}
            onUpdatePrivacy={handleUpdatePrivacy}
            onTriggerPinLockNow={() => setIsPinLocked(true)}
            onImportFullState={(newState) => setState(newState)}
          />
        )}

        {activeTab === 'guide' && (
          <UserGuideTab
            privacy={privacy}
            onUpdatePrivacy={handleUpdatePrivacy}
            onTriggerPinLockNow={() => setIsPinLocked(true)}
            onNavigateTab={setActiveTab}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6 mt-12">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            VitaPulse 全方位個人健康管家 · 本地端離線隱私優先架構 (Local-First Storage)
          </span>
          <span>
            臨床公式參考：衛福部國健署成人體位標準 · Mifflin-St Jeor BMR · Karvonen 儲備心率公式
          </span>
        </div>
      </footer>
    </div>
  );
}
