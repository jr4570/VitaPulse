import React, { useState } from 'react';
import {
  PrivacySettings,
  VitaPulseState,
  formatMaskedNumber,
  isEnvForcedGitHubDemo,
  isGitHubDemoLocked,
  isPreventCloseLocked,
} from '../utils/storage';
import { ChartMetricKey, TrendChartSvg } from './TrendChartSvg';
import {
  ShieldCheck,
  Download,
  Upload,
  Lock,
  EyeOff,
  Eye,
  Trash2,
  Search,
  RotateCcw,
  FileSpreadsheet,
  PlusCircle,
  ShieldAlert,
} from 'lucide-react';

interface HistoryAndPrivacyTabProps {
  fullState: VitaPulseState;
  onDeleteHistoryRecord: (id: string) => void;
  onClearHistory: () => void;
  onRestoreDemoData: () => void;
  onSaveSnapshot: (note: string) => void;
  onUpdatePrivacy: (partial: Partial<PrivacySettings>) => void;
  onTriggerPinLockNow: () => void;
  onImportFullState: (newState: VitaPulseState) => void;
}

export const HistoryAndPrivacyTab: React.FC<HistoryAndPrivacyTabProps> = ({
  fullState,
  onDeleteHistoryRecord,
  onClearHistory,
  onRestoreDemoData,
  onSaveSnapshot,
  onUpdatePrivacy,
  onTriggerPinLockNow,
  onImportFullState,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<ChartMetricKey>('bmi');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bmiFilter, setBmiFilter] = useState<'all' | 'normal' | 'attention'>('all');
  const [pinInput, setPinInput] = useState<string>(fullState.privacy.pinCode || '2580');
  const [verifyPinForDisable, setVerifyPinForDisable] = useState<string>('');
  const [showDisableVerifyBox, setShowDisableVerifyBox] = useState<boolean>(false);
  const [showUnlockDeployBox, setShowUnlockDeployBox] = useState<boolean>(false);
  const [unlockDeployPin, setUnlockDeployPin] = useState<string>('');
  const [vaultFeedback, setVaultFeedback] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const { history, privacy, profile } = fullState;
  const masked = privacy.maskSensitiveNumbers;
  const envForcedGithub = isEnvForcedGitHubDemo();
  const isGithubLocked = isGitHubDemoLocked(privacy);
  const effectiveDemoMode = isGithubLocked ? true : privacy.demoModeEnabled;
  const preventCloseLocked = isPreventCloseLocked(privacy);
  const effectivePreventClose = preventCloseLocked ? true : privacy.preventAccidentalClose;

  const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));

  const filteredHistory = sortedHistory.filter((rec) => {
    const matchesQuery =
      !searchQuery.trim() ||
      rec.date.includes(searchQuery.trim()) ||
      rec.note.toLowerCase().includes(searchQuery.trim().toLowerCase());
    if (!matchesQuery) return false;
    if (bmiFilter === 'normal') return rec.bmi >= 18.5 && rec.bmi < 24.0;
    if (bmiFilter === 'attention') return rec.bmi < 18.5 || rec.bmi >= 24.0;
    return true;
  });

  const handleExportJson = () => {
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const updatedState: VitaPulseState = {
      ...fullState,
      privacy: {
        ...fullState.privacy,
        lastBackupAt: nowStr,
      },
    };
    onUpdatePrivacy({ lastBackupAt: nowStr });

    const blob = new Blob([JSON.stringify(updatedState, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vitapulse-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setVaultFeedback(`已成功匯出完整 JSON 備份檔案 (${nowStr})`);
  };

  const handleExportCsv = () => {
    const headers = [
      'Date',
      'Weight(kg)',
      'BMI',
      'Waist(cm)',
      'WHtR',
      'Sleep(h)',
      'SleepScore',
      'Water(ml)',
      'RestingHR(bpm)',
      'StressIndex',
      'SystolicBP',
      'DiastolicBP',
      'Note',
    ];
    const rows = sortedHistory.map((r) => [
      r.date,
      r.weightKg,
      r.bmi,
      r.waistCm,
      profile.heightCm > 50 ? Math.round((r.waistCm / profile.heightCm) * 100) / 100 : '-',
      r.sleepHours,
      r.sleepQualityScore,
      r.waterMl,
      r.restingHr,
      r.stressIndex,
      r.systolicBp,
      r.diastolicBp,
      `"${(r.note || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vitapulse-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setVaultFeedback('已匯出 CSV 試算表格式健康紀錄，可使用 Excel 或 Numbers 開啟');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || ''));
        if (!parsed || typeof parsed !== 'object' || !parsed.profile || !Array.isArray(parsed.history)) {
          setImportError('備份檔案格式不符，請確認為 VitaPulse 匯出的 JSON 備份檔。');
          return;
        }
        setImportError(null);
        onImportFullState(parsed as VitaPulseState);
        setVaultFeedback(`已成功還原備份檔案（共載入 ${parsed.history.length} 筆歷史健康紀錄）`);
      } catch {
        setImportError('無法解析 JSON 檔案，請檢查檔案完整性。');
      }
    };
    reader.readAsText(file);
  };

  const handleDisablePinWithVerification = () => {
    if (verifyPinForDisable === (privacy.pinCode || '2580')) {
      onUpdatePrivacy({ pinEnabled: false });
      setShowDisableVerifyBox(false);
      setVerifyPinForDisable('');
      setImportError(null);
      setVaultFeedback('已驗證安全碼並停用自動 PIN 鎖定');
    } else {
      setImportError('安全碼驗證失敗，已攔截關閉安全鎖操作（防止未授權關閉）');
    }
  };

  return (
    <div className="space-y-6">
      <TrendChartSvg
        records={history}
        selectedMetric={selectedMetric}
        onSelectMetric={setSelectedMetric}
        masked={masked}
      />

      {/* Historical Health Records Ledger */}
      <section
        aria-labelledby="history-ledger-heading"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 id="history-ledger-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              歷史健康趨勢明細總表
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              共收錄 {history.length} 筆跨維度生理快照 · 篩選顯示 {filteredHistory.length} 筆
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <label htmlFor="input-history-search" className="sr-only">
                搜尋日期或備註
              </label>
              <input
                id="input-history-search"
                type="text"
                placeholder="搜尋日期或備註關鍵字..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div
              role="group"
              aria-label="篩選歷史紀錄體位狀態"
              className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
            >
              {(
                [
                  { id: 'all', label: '全部紀錄' },
                  { id: 'normal', label: '正常體位' },
                  { id: 'attention', label: '需注意體位' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setBmiFilter(f.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    bmiFilter === f.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onSaveSnapshot('手動於歷史中心新增快照')}
              className="px-3 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>新增今日快照</span>
            </button>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              目前沒有符合條件的歷史健康紀錄
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              您可以點擊下方按鈕新增今日的第一筆身體組成與心率快照，或載入 10 筆範例趨勢數據以體驗完整圖表分析。
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setBmiFilter('all');
                  onSaveSnapshot('首筆健康紀錄');
                }}
                className="px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors cursor-pointer"
              >
                立即新增今日第一筆紀錄
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setBmiFilter('all');
                  onRestoreDemoData();
                }}
                className="px-4 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                載入範例健康趨勢數據
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">日期</th>
                  <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">體重 (kg)</th>
                  <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">BMI</th>
                  <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">腰圍 (cm)</th>
                  <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">腰身高比</th>
                  <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">睡眠</th>
                  <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">飲水 (ml)</th>
                  <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">心率 / 壓力</th>
                  <th className="py-2.5 px-3 font-medium text-right whitespace-nowrap">血壓 (mmHg)</th>
                  <th className="py-2.5 px-3 font-medium">生活型態備註</th>
                  <th className="py-2.5 px-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 tabular-nums">
                {filteredHistory.map((rec) => {
                  const recWhtr =
                    profile.heightCm > 50
                      ? Math.round((rec.waistCm / profile.heightCm) * 100) / 100
                      : 0.45;
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {rec.date}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800 dark:text-slate-200">
                        {formatMaskedNumber(rec.weightKg, masked)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-700 dark:text-teal-400">
                        {formatMaskedNumber(rec.bmi, masked)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatMaskedNumber(rec.waistCm, masked)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatMaskedNumber(recWhtr, masked)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {rec.sleepHours}h ({rec.sleepQualityScore}分)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sky-600 dark:text-sky-400">
                        {rec.waterMl}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {rec.restingHr} bpm / 壓 {rec.stressIndex}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {masked ? '•••/••' : `${rec.systolicBp}/${rec.diastolicBp}`}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-[220px] truncate">
                        {rec.note}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          aria-label={`刪除 ${rec.date} 歷史紀錄`}
                          onClick={() => onDeleteHistoryRecord(rec.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Personal Data Privacy Protection, Anti-Close Guard & Backup Vault */}
      <section
        aria-labelledby="privacy-vault-heading"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 id="privacy-vault-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>個人化數據隱私保護、防關閉保護與本地備份中心</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              零雲端追蹤架構：支援防止誤關分頁保護 (beforeunload)、防窺遮罩、嚴格 PIN 碼鎖定（防止未授權關閉）與 JSON/CSV 備份
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
            上次備份時間：{privacy.lastBackupAt || '尚未匯出備份'}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Deployment Mode, Demo Mode & Prevent Accidental Close */}
          <div className="space-y-3 pb-4 lg:pb-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 lg:pr-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-teal-600" />
                <span>演示模式與防關閉控制</span>
              </span>
              {envForcedGithub ? (
                <span className="text-xs font-mono font-semibold text-slate-500">
                  GitHub 網域鎖定
                </span>
              ) : isGithubLocked ? (
                <button
                  type="button"
                  onClick={() => setShowUnlockDeployBox(!showUnlockDeployBox)}
                  className="text-xs font-mono font-semibold text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  申請切換自架 (需 PIN)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onUpdatePrivacy({
                      deploymentTarget: 'github-pages',
                      demoModeEnabled: true,
                      preventAccidentalClose: true,
                    });
                    setVaultFeedback('已切換為「GitHub 公開演示模式」，演示模式與防關閉保護已鎖定開啟');
                  }}
                  className="text-xs font-mono font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  自己部署 (鎖定為 GitHub)
                </button>
              )}
            </div>

            {showUnlockDeployBox && isGithubLocked && !envForcedGithub && (
              <div className="p-2.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center gap-2">
                <input
                  type="password"
                  placeholder={`輸入 PIN 解鎖自架 (${privacy.pinCode || '2580'})`}
                  value={unlockDeployPin}
                  onChange={(e) => setUnlockDeployPin(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (unlockDeployPin === (privacy.pinCode || '2580')) {
                      onUpdatePrivacy({ deploymentTarget: 'self-hosted' });
                      setShowUnlockDeployBox(false);
                      setUnlockDeployPin('');
                      setImportError(null);
                      setVaultFeedback('已驗證 PIN 碼並切換為「自己部署模式 (Self-Hosted)」，現在可關閉演示模式與防關閉保護');
                    } else {
                      setImportError('管理員 PIN 碼錯誤，無法解除 GitHub 部署鎖定');
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white rounded hover:bg-indigo-700 whitespace-nowrap cursor-pointer"
                >
                  驗證解鎖
                </button>
              </div>
            )}

            {/* Demo Mode Switch */}
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="text-xs">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  演示模式 (Demo Mode)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isGithubLocked
                    ? 'GitHub 部署下強制開啟防止關閉'
                    : '自己部署可關閉演示以解鎖防關按鈕'}
                </p>
              </div>
              <button
                type="button"
                disabled={isGithubLocked}
                onClick={() => {
                  if (isGithubLocked) return;
                  const nextDemo = !privacy.demoModeEnabled;
                  onUpdatePrivacy({
                    demoModeEnabled: nextDemo,
                    ...(nextDemo ? { preventAccidentalClose: true } : {}),
                  });
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  isGithubLocked
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : effectiveDemoMode
                      ? 'bg-teal-600 text-white hover:bg-teal-700 cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer'
                }`}
              >
                {isGithubLocked
                  ? '鎖定開啟 (防關閉)'
                  : effectiveDemoMode
                    ? '開啟中 (點擊關閉)'
                    : '已關閉演示'}
              </button>
            </div>

            {/* Prevent Accidental Close Switch */}
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="text-xs">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  防止誤關視窗保護 (BeforeUnload)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {preventCloseLocked
                    ? '演示模式或 GitHub 部署下強制鎖定防關閉'
                    : '演示已關閉，可自由切換防誤關保護'}
                </p>
              </div>
              <button
                type="button"
                disabled={preventCloseLocked}
                onClick={() => {
                  if (preventCloseLocked) return;
                  onUpdatePrivacy({ preventAccidentalClose: !privacy.preventAccidentalClose });
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  preventCloseLocked
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : effectivePreventClose
                      ? 'bg-teal-600 text-white hover:bg-teal-700 cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer'
                }`}
              >
                {preventCloseLocked
                  ? '鎖定開啟 (防關閉)'
                  : effectivePreventClose
                    ? '已啟用 (點擊關閉)'
                    : '已關閉防關'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => onUpdatePrivacy({ maskSensitiveNumbers: !masked })}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                masked
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {masked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{masked ? '解除敏感數值遮罩 (••.•)' : '開啟防窺隱私數值遮罩'}</span>
            </button>
          </div>

          {/* Column 2: Strict Local PIN Lock Security (No Bypass) */}
          <div className="space-y-3 pb-4 lg:pb-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 lg:pr-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>嚴格 PIN 碼安全鎖 (防關閉驗證)</span>
              </span>
              <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                {effectiveDemoMode
                  ? `Demo 密碼: ${privacy.pinCode || '2580'}`
                  : privacy.pinEnabled
                    ? '強制保護中'
                    : '手動鎖定模式'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="input-pin-code" className="text-xs text-slate-600 dark:text-slate-400 shrink-0">
                設定安全碼：
              </label>
              <input
                id="input-pin-code"
                type={effectiveDemoMode ? 'text' : 'password'}
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-28 px-2.5 py-1 text-xs font-mono tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => {
                  if (pinInput.length >= 4) {
                    onUpdatePrivacy({ pinEnabled: true, pinCode: pinInput });
                    setVaultFeedback('已儲存安全碼並啟用強制防關閉保護（需驗證 PIN 才可解除）');
                  } else {
                    setImportError('請輸入至少 4 位數數字作為 PIN 安全碼');
                  }
                }}
                className="px-2.5 py-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-100 whitespace-nowrap shrink-0 cursor-pointer"
              >
                啟用保護
              </button>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (pinInput.length >= 4) {
                    onUpdatePrivacy({ pinCode: pinInput });
                  }
                  onTriggerPinLockNow();
                }}
                className="flex-1 py-2 px-3 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {effectiveDemoMode
                  ? `立即鎖定儀表板 (Demo 密碼: ${privacy.pinCode || '2580'})`
                  : '立即鎖定健康儀表板'}
              </button>
              {privacy.pinEnabled && !showDisableVerifyBox && (
                <button
                  type="button"
                  onClick={() => setShowDisableVerifyBox(true)}
                  className="py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
                >
                  申請關閉鎖定
                </button>
              )}
            </div>

            {showDisableVerifyBox && (
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <input
                  type="password"
                  placeholder={
                    effectiveDemoMode
                      ? `輸入原 PIN 驗證關閉 (${privacy.pinCode || '2580'})`
                      : '輸入原 PIN 驗證關閉'
                  }
                  value={verifyPinForDisable}
                  onChange={(e) => setVerifyPinForDisable(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                />
                <button
                  type="button"
                  onClick={handleDisablePinWithVerification}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-600 text-white rounded hover:bg-rose-700 whitespace-nowrap cursor-pointer"
                >
                  驗證關閉
                </button>
              </div>
            )}
          </div>

          {/* Column 3: Data Backup Export / Import / Reset */}
          <div className="space-y-3">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
              跨裝置資料備份匯出與還原
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="py-2 px-3 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>匯出 JSON 備份</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="py-2 px-3 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>匯出 CSV 報表</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <label className="flex-1 py-1.5 px-3 text-xs font-medium text-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>匯入還原 JSON 備份檔</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={onRestoreDemoData}
                title="還原預設範例數據"
                className="py-1.5 px-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置範例</span>
              </button>

              <button
                type="button"
                disabled={isGithubLocked}
                onClick={() => {
                  if (isGithubLocked) return;
                  onClearHistory();
                }}
                title={isGithubLocked ? 'GitHub 演示模式下禁止清空展示歷史' : '清空所有歷史紀錄'}
                className={`py-1.5 px-2.5 text-xs whitespace-nowrap shrink-0 ${
                  isGithubLocked
                    ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    : 'text-rose-600 dark:text-rose-400 hover:underline cursor-pointer'
                }`}
              >
                清空歷史
              </button>
            </div>
          </div>
        </div>

        {vaultFeedback && (
          <p role="status" className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            {vaultFeedback}
          </p>
        )}
        {importError && (
          <p role="alert" className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {importError}
          </p>
        )}
      </section>
    </div>
  );
};
