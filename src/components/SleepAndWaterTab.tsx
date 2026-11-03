import React, { useState, useEffect } from 'react';
import {
  calculateBMI,
  calculateBMR,
  calculateNutritionAndExercisePlan,
  calculateSleepEfficiency,
  calculateTDEE,
} from '../utils/healthCalculations';
import {
  SleepLogEntry,
  UserProfile,
  WaterIntakeEntry,
} from '../utils/storage';
import { Droplets, Moon, Bell, Plus, Trash2, Clock, Sparkles } from 'lucide-react';

interface SleepAndWaterTabProps {
  profile: UserProfile;
  waterLogsToday: WaterIntakeEntry[];
  onAddWater: (amountMl: number, beverageType: WaterIntakeEntry['beverageType']) => void;
  onRemoveWater: (id: string) => void;
  waterReminderEnabled: boolean;
  waterReminderIntervalMins: number;
  onUpdateWaterReminder: (enabled: boolean, intervalMins: number) => void;
  sleepLogs: SleepLogEntry[];
  onAddSleepLog: (entry: Omit<SleepLogEntry, 'id'>) => void;
  onRemoveSleepLog: (id: string) => void;
}

export const SleepAndWaterTab: React.FC<SleepAndWaterTabProps> = ({
  profile,
  waterLogsToday,
  onAddWater,
  onRemoveWater,
  waterReminderEnabled,
  waterReminderIntervalMins,
  onUpdateWaterReminder,
  sleepLogs,
  onAddSleepLog,
  onRemoveSleepLog,
}) => {
  const [customWaterMl, setCustomWaterMl] = useState<number>(300);
  const [beverageType, setBeverageType] = useState<WaterIntakeEntry['beverageType']>('白開水');
  const [reminderAlertBanner, setReminderAlertBanner] = useState<string | null>(null);
  const [secondsToNextReminder, setSecondsToNextReminder] = useState<number>(waterReminderIntervalMins * 60);

  // Practical observable sleep logger state
  const [bedtime, setBedtime] = useState<string>('23:15');
  const [wakeTime, setWakeTime] = useState<string>('07:10');
  const [latencyMins, setLatencyMins] = useState<number>(15);
  const [awakenings, setAwakenings] = useState<number>(0);
  const [refreshmentRating, setRefreshmentRating] = useState<number>(4);
  const [sleepNote, setSleepNote] = useState<string>('');
  const [sleepSavedMsg, setSleepSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    setSecondsToNextReminder(waterReminderIntervalMins * 60);
  }, [waterReminderIntervalMins, waterLogsToday.length]);

  useEffect(() => {
    if (!waterReminderEnabled) return;
    const timer = setInterval(() => {
      setSecondsToNextReminder((prev) => {
        if (prev <= 1) {
          setReminderAlertBanner('飲水管家提醒：距離上次補水已達設定間隔，建議立即飲用 250ml 溫開水維持細胞水合！');
          return waterReminderIntervalMins * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [waterReminderEnabled, waterReminderIntervalMins]);

  const bmi = calculateBMI(profile.heightCm, profile.weightKg);
  const bmr = calculateBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const plan = calculateNutritionAndExercisePlan(tdee, profile.weightKg, bmi, profile.goal);

  const targetWaterMl = plan.dailyWaterMl;
  const currentWaterMl = waterLogsToday.reduce((sum, item) => sum + item.amountMl, 0);
  const waterPct = Math.min(100, Math.round((currentWaterMl / targetWaterMl) * 100));
  const remainingWaterMl = Math.max(0, targetWaterMl - currentWaterMl);

  const sleepEval = calculateSleepEfficiency(
    bedtime,
    wakeTime,
    latencyMins,
    awakenings,
    refreshmentRating
  );
  const awakeLossPct = Math.max(0, 100 - sleepEval.efficiencyPct);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  const handleSaveSleep = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().slice(0, 10);
    onAddSleepLog({
      date: todayStr,
      bedtime,
      wakeTime,
      latencyMins,
      awakenings,
      refreshmentRating,
      actualHours: sleepEval.actualSleepHours,
      efficiencyPct: sleepEval.efficiencyPct,
      qualityScore: sleepEval.qualityScore,
      note: sleepNote.trim() || `${sleepEval.statusLabel} (效率 ${sleepEval.efficiencyPct}%)`,
    });
    setSleepNote('');
    setSleepSavedMsg(`已記錄今日睡眠品質（睡眠分數 ${sleepEval.qualityScore} 分 / 實際睡眠 ${sleepEval.actualSleepHours} 小時）`);
    setTimeout(() => setSleepSavedMsg(null), 4000);
  };

  const REFRESHMENT_LABELS: Record<number, string> = {
    5: '5分 - 精神飽滿充沛',
    4: '4分 - 精神良好清醒',
    3: '3分 - 普通尚可',
    2: '2分 - 略感疲倦嗜睡',
    1: '1分 - 嚴重疲憊未恢復',
  };

  return (
    <div className="space-y-6">
      {reminderAlertBanner && (
        <div
          role="status"
          className="bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 rounded-xl p-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2.5 text-xs text-sky-900 dark:text-sky-100 font-medium">
            <Bell className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>{reminderAlertBanner}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onAddWater(250, '白開水');
                setReminderAlertBanner(null);
              }}
              className="px-3 py-1 text-xs font-semibold bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors cursor-pointer"
            >
              立即喝 250ml 並關閉
            </button>
            <button
              type="button"
              onClick={() => setReminderAlertBanner(null)}
              className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
            >
              稍後
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Hydration Tracker & Smart Reminder Steward (6 cols) */}
        <section
          aria-labelledby="hydration-heading"
          className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 id="hydration-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  <span>水分攝取監測與定時補水提醒</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  依體重 ({profile.weightKg} kg) 與代謝目標計算，今日建議總飲水量為 {targetWaterMl} ml
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">今日累積飲水</span>
                <span
                  data-testid="water-total-ml"
                  className="text-2xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400"
                >
                  {currentWaterMl}
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {' '}/ {targetWaterMl} ml ({waterPct}%)
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5 tabular-nums">
                <span>
                  水合狀態：
                  <strong className="text-slate-900 dark:text-slate-100">
                    {waterPct >= 100
                      ? '今日水分目標已達成'
                      : waterPct >= 65
                        ? '水合進度良好'
                        : '尚需補充水分'}
                  </strong>
                </span>
                <span>剩餘目標：{remainingWaterMl} ml</span>
              </div>
              <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  style={{ width: `${waterPct}%` }}
                  className="h-full bg-sky-500 transition-all duration-200"
                />
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                快速一鍵補水容器：
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '+150ml 小水杯', ml: 150, type: '白開水' as const },
                  { label: '+250ml 馬克杯', ml: 250, type: '白開水' as const },
                  { label: '+350ml 無糖綠茶', ml: 350, type: '無糖綠茶' as const },
                  { label: '+500ml 運動水壺', ml: 500, type: '白開水' as const },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() => onAddWater(btn.ml, btn.type)}
                    className="px-3 py-2 text-xs font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200/70 dark:border-sky-800/70 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[130px]">
                <label
                  htmlFor="select-beverage-type"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  飲品種類
                </label>
                <select
                  id="select-beverage-type"
                  value={beverageType}
                  onChange={(e) => setBeverageType(e.target.value as WaterIntakeEntry['beverageType'])}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="白開水">白開水 (100% 水合)</option>
                  <option value="氣泡水">無糖氣泡水</option>
                  <option value="無糖綠茶">無糖綠茶 / 花草茶</option>
                  <option value="運動電解質飲">低滲透壓電解質飲</option>
                  <option value="黑咖啡">美式黑咖啡</option>
                </select>
              </div>
              <div className="w-28">
                <label
                  htmlFor="input-custom-water-ml"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  容量 (ml)
                </label>
                <input
                  id="input-custom-water-ml"
                  type="number"
                  step="50"
                  min="50"
                  max="2000"
                  value={customWaterMl || ''}
                  onChange={(e) => setCustomWaterMl(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (customWaterMl > 0) {
                    onAddWater(customWaterMl, beverageType);
                  }
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增飲水紀錄</span>
              </button>
            </div>

            <div className="mt-4 py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    智慧定時飲水提醒：
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 font-mono tabular-nums ml-1">
                    {waterReminderEnabled
                      ? `下次提醒倒數 ${formatCountdown(secondsToNextReminder)}`
                      : '已暫停提醒'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="select-reminder-interval" className="sr-only">
                  飲水提醒間隔
                </label>
                <select
                  id="select-reminder-interval"
                  aria-label="飲水提醒間隔"
                  value={waterReminderIntervalMins}
                  onChange={(e) =>
                    onUpdateWaterReminder(waterReminderEnabled, parseInt(e.target.value, 10))
                  }
                  className="px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200"
                >
                  <option value={45}>每 45 分鐘</option>
                  <option value={60}>每 60 分鐘</option>
                  <option value={90}>每 90 分鐘</option>
                  <option value={120}>每 120 分鐘</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateWaterReminder(!waterReminderEnabled, waterReminderIntervalMins)
                  }
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    waterReminderEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {waterReminderEnabled ? '提醒開啟中' : '已關閉'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setReminderAlertBanner('飲水管家提醒：現在請起身喝一杯 250ml 溫開水，幫助促進血液循環與新陳代謝！')
                  }
                  className="px-2.5 py-1 text-xs font-medium text-sky-700 dark:text-sky-300 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  測試提醒
                </button>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                今日補水時間軸紀錄 ({waterLogsToday.length} 筆)
              </h3>
              {waterLogsToday.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  今日尚無飲水紀錄，點擊上方容器按鈕開始第一杯水！
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800">
                  {waterLogsToday.map((item) => (
                    <div
                      key={item.id}
                      className="px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-2 tabular-nums">
                        <span className="font-mono text-slate-500 dark:text-slate-400">{item.time}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {item.beverageType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold text-sky-700 dark:text-sky-400 tabular-nums">
                          +{item.amountMl} ml
                        </span>
                        <button
                          type="button"
                          aria-label={`刪除 ${item.time} ${item.beverageType} ${item.amountMl}ml 紀錄`}
                          onClick={() => onRemoveWater(item.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Practical Sleep Efficiency & Morning Refreshment Monitor (6 cols) */}
        <section
          aria-labelledby="sleep-heading"
          className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 id="sleep-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>睡眠品質監測與睡眠效率分析</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  依據實際就寢起床時間、入睡耗時、夜醒次數與晨間清醒度精確核算睡眠效率
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">睡眠品質評分</span>
                <span
                  data-testid="sleep-quality-score"
                  className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400"
                >
                  {sleepEval.qualityScore}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {' '}分 · {sleepEval.statusLabel}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveSleep} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="input-bedtime"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    就寢時間
                  </label>
                  <input
                    id="input-bedtime"
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="input-waketime"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    起床時間
                  </label>
                  <input
                    id="input-waketime"
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="input-latency"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    入睡耗時 (分鐘)
                  </label>
                  <input
                    id="input-latency"
                    type="number"
                    min="0"
                    max="180"
                    value={latencyMins}
                    onChange={(e) => setLatencyMins(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="input-awakenings"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    半夜醒來次數
                  </label>
                  <input
                    id="input-awakenings"
                    type="number"
                    min="0"
                    max="15"
                    value={awakenings}
                    onChange={(e) => setAwakenings(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="col-span-2">
                  <label
                    htmlFor="select-refreshment"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    晨起精神恢復感 (可真實觀察之指標)
                  </label>
                  <select
                    id="select-refreshment"
                    value={refreshmentRating}
                    onChange={(e) => setRefreshmentRating(parseInt(e.target.value, 10) || 4)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {REFRESHMENT_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sleep Efficiency Visual Bar */}
              <div className="pt-1">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-mono tabular-nums">
                  <span>總躺床 {sleepEval.timeInBedHours}h · 實際睡眠 {sleepEval.actualSleepHours}h</span>
                  <span>睡眠效率 {sleepEval.efficiencyPct}% (臨床標準 ≥ 85%)</span>
                </div>
                <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                  <div
                    style={{ width: `${sleepEval.efficiencyPct}%` }}
                    className="bg-indigo-600"
                    title={`實際有效睡眠 ${sleepEval.efficiencyPct}%`}
                  />
                  <div
                    style={{ width: `${awakeLossPct}%` }}
                    className="bg-amber-400"
                    title={`入睡與夜醒耗損 ${awakeLossPct}%`}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-mono tabular-nums">
                  <span>有效熟睡時間佔比 {sleepEval.efficiencyPct}%</span>
                  <span>入睡與夜醒耗損約 {sleepEval.awakeLossMins} 分鐘 ({awakeLossPct}%)</span>
                </div>
              </div>

              <div className="py-2.5 px-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span>{sleepEval.advice}</span>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="input-sleep-note" className="sr-only">
                  睡眠日誌備註
                </label>
                <input
                  id="input-sleep-note"
                  type="text"
                  placeholder="睡眠感受備註（例如：睡前泡澡、無夜醒）..."
                  value={sleepNote}
                  onChange={(e) => setSleepNote(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  儲存睡眠日誌
                </button>
              </div>
              {sleepSavedMsg && (
                <p role="status" className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  {sleepSavedMsg}
                </p>
              )}
            </form>

            <div className="mt-4">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                近期睡眠品質監測紀錄 ({sleepLogs.length} 筆)
              </h3>
              <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800">
                {sleepLogs.map((log) => (
                  <div
                    key={log.id}
                    className="px-3 py-2 flex items-center justify-between gap-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        <span className="font-semibold">{log.date}</span>
                        <span aria-hidden="true" className="text-slate-400">·</span>
                        <span>{log.bedtime} - {log.wakeTime}</span>
                        <span aria-hidden="true" className="text-slate-400">·</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          {log.actualHours}h ({log.qualityScore}分)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        睡眠效率 {log.efficiencyPct}% · 精神恢復 {log.refreshmentRating || 4}/5 · {log.note}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`刪除 ${log.date} 睡眠紀錄`}
                      onClick={() => onRemoveSleepLog(log.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
