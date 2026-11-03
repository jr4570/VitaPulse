import React from 'react';
import { PrivacySettings, isGitHubDemoLocked } from '../utils/storage';
import {
  BookOpen,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Scale,
  ClipboardCheck,
  Moon,
  HeartPulse,
  Database,
  ArrowRight,
  Server,
  Globe,
} from 'lucide-react';

interface UserGuideTabProps {
  privacy: PrivacySettings;
  onUpdatePrivacy: (partial: Partial<PrivacySettings>) => void;
  onTriggerPinLockNow: () => void;
  onNavigateTab: (tab: 'overview' | 'questionnaire' | 'sleep-water' | 'vitals-stress' | 'history-privacy' | 'guide') => void;
}

export const UserGuideTab: React.FC<UserGuideTabProps> = ({
  privacy,
  onUpdatePrivacy,
  onTriggerPinLockNow,
  onNavigateTab,
}) => {
  const githubLocked = isGitHubDemoLocked(privacy);

  return (
    <div className="space-y-6">
      {/* Section 1: Deployment Mode (GitHub Public Demo Lock vs Self-Hosted Full Control) */}
      <section
        aria-labelledby="protection-settings-heading"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2
              id="protection-settings-heading"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2"
            >
              <ShieldAlert className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>部署環境權限、演示模式與防止關閉設定中心</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              GitHub 公開部署環境強制鎖定「演示模式」與「防止關閉保護」；個人自架部署環境則可自由關閉演示模式與防關閉設定
            </p>
          </div>

          {/* Deployment Mode Switcher (Allows testing GitHub Pages Lock vs Self-Hosted Unlock) */}
          <div
            role="group"
            aria-label="部署環境模式切換"
            className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0"
          >
            <button
              type="button"
              onClick={() =>
                onUpdatePrivacy({
                  deploymentTarget: 'github-pages',
                  demoModeEnabled: true,
                  preventAccidentalClose: true,
                })
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                githubLocked
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-teal-600" />
              <span>GitHub 部署模式 (鎖定防關)</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdatePrivacy({
                  deploymentTarget: 'self-hosted',
                })
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                !githubLocked
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-indigo-600" />
              <span>個人自架部署 (可自由關閉)</span>
            </button>
          </div>
        </div>

        {/* 3 Control Cards */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Demo Mode Control */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  01. 系統演示模式 (Demo Mode)
                </span>
                <span className="text-xs font-mono font-semibold text-teal-700 dark:text-teal-400">
                  {githubLocked
                    ? 'GitHub 強制鎖定中'
                    : privacy.demoModeEnabled
                      ? '演示模式開啟中'
                      : '已關閉 (純個人模式)'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                {githubLocked
                  ? '目前處於 GitHub 公開部署環境 (*.github.io / VITE_GITHUB_DEMO=true)，系統強制維持演示模式並禁止訪客關閉，確保公開展示體驗穩定。'
                  : '目前處於個人自架部署環境，您可隨時關閉演示模式，改用您個人的真實健康檔案與設定。'}
              </p>
            </div>
            <button
              type="button"
              disabled={githubLocked}
              onClick={() => {
                if (!githubLocked) {
                  onUpdatePrivacy({ demoModeEnabled: !privacy.demoModeEnabled });
                }
              }}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${
                githubLocked
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  : privacy.demoModeEnabled
                    ? 'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer'
                    : 'bg-teal-600 text-white hover:bg-teal-700 cursor-pointer'
              }`}
            >
              {githubLocked
                ? 'GitHub 部署環境禁止關閉演示模式'
                : privacy.demoModeEnabled
                  ? '關閉演示模式 (切換為個人正式模式)'
                  : '重新開啟演示模式'}
            </button>
          </div>

          {/* Card 2: Prevent Accidental Close Control */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  02. 防止誤關視窗保護 (BeforeUnload)
                </span>
                <span className="text-xs font-mono font-semibold text-teal-700 dark:text-teal-400">
                  {githubLocked
                    ? '強制防關閉'
                    : privacy.preventAccidentalClose
                      ? '防關閉已啟用'
                      : '已關閉防關保護'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                {githubLocked
                  ? '在 GitHub 演示模式下，防止關閉視窗保護為強制鎖定狀態，無法被關閉。'
                  : '自架部署模式下，您可以自由開啟或關閉瀏覽器分頁防誤關攔截提示。'}
              </p>
            </div>
            <button
              type="button"
              disabled={githubLocked}
              onClick={() => {
                if (!githubLocked) {
                  onUpdatePrivacy({ preventAccidentalClose: !privacy.preventAccidentalClose });
                }
              }}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${
                githubLocked
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  : privacy.preventAccidentalClose
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 cursor-pointer'
                    : 'bg-teal-600 text-white hover:bg-teal-700 cursor-pointer'
              }`}
            >
              {githubLocked
                ? 'GitHub 演示模式禁止關閉防關保護'
                : privacy.preventAccidentalClose
                  ? '關閉「防止誤關視窗保護」'
                  : '啟用「防止誤關視窗保護」'}
            </button>
          </div>

          {/* Card 3: Strict PIN Lock & Privacy Masking */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  03. 嚴格 PIN 碼鎖定與防窺遮罩
                </span>
                <span className="text-xs font-mono font-semibold text-indigo-700 dark:text-indigo-400">
                  {githubLocked || privacy.demoModeEnabled
                    ? `Demo 密碼: ${privacy.pinCode || '2580'}`
                    : '無略過按鈕'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                鎖定畫面已移除「快速略過 (示範)」按鈕，必須輸入正確的 PIN 安全碼（演示模式預設密碼為{' '}
                <strong className="font-mono text-indigo-700 dark:text-indigo-300">
                  {privacy.pinCode || '2580'}
                </strong>
                ）方可解鎖；若關閉演示模式則會自動隱藏密碼提示。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onTriggerPinLockNow}
                className="py-2 px-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {githubLocked || privacy.demoModeEnabled
                    ? `鎖定 (${privacy.pinCode || '2580'})`
                    : '立即鎖定畫面'}
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdatePrivacy({ maskSensitiveNumbers: !privacy.maskSensitiveNumbers })
                }
                className="py-2 px-2.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
              >
                {privacy.maskSensitiveNumbers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{privacy.maskSensitiveNumbers ? '解除遮罩' : '開啟遮罩'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Step-by-Step Interactive Module Guide */}
      <section
        aria-labelledby="guide-manual-heading"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
      >
        <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="guide-manual-heading"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2"
          >
            <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>VitaPulse 全方位個人健康管家 · 完整使用說明書</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            本系統全面汰除需昂貴儀器才能測量的不準確估算值，僅保留居家使用體重計、皮尺、血壓計與碼錶即可 100% 精準量測的臨床指標
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Guide Item 1 */}
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-teal-600" />
                  <span>01. 身體組成、腰身高比 (WHtR) 與居家血壓量測</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">核心總覽頁</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                · <strong>操作步驟</strong>：輸入身高 (cm)、晨起空腹體重 (kg)、年齡、腰圍與臀圍。系統自動計算 BMI、理想體重區間、基礎代謝率 (BMR) 與總熱量消耗 (TDEE)。
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                · <strong>精準內臟脂肪指標</strong>：採用醫學界公認最準確的皮尺指標「<strong>腰身高比 (WHtR = 腰圍 ÷ 身高)</strong>」與「<strong>腰臀比 (WHR)</strong>」，將腰圍控制在身高的一半以下（WHtR &lt; 0.50），即可有效預防內臟脂肪堆積。
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
              <button
                type="button"
                onClick={() => onNavigateTab('overview')}
                className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>前往身體組成與總覽</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Guide Item 2 */}
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                  <span>02. 健康問卷評分、改善程度與每日營養運動處方</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">問卷與處方頁</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                · <strong>操作步驟</strong>：依序點選 8 道日常習慣題目（蔬果比例、含糖飲控制、運動頻率、久坐步數、睡眠規律、飲水、抗壓與菸酒控制）。
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                · <strong>處方解讀與打卡</strong>：右側即時算出 `0–100` 健康總分，並依急迫度標示「<strong>亟需改善</strong>」、「<strong>建議強化</strong>」或「<strong>維持良好</strong>」。下方可切換減脂、增肌減脂重組、維持或增肌目標，取得精確的蛋白質/碳水/脂肪克數與每週運動進度打卡條。
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
              <button
                type="button"
                onClick={() => onNavigateTab('questionnaire')}
                className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>前往健康問卷與處方</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Guide Item 3 */}
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-sky-600" />
                  <span>03. 實用睡眠效率監測與定時飲水管家</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">睡眠與飲水頁</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                · <strong>飲水管家操作</strong>：系統自動依「體重 × 35 ml」計算每日飲水目標。點擊 `+150ml`、`+250ml`、`+350ml` 或 `+500ml` 即可一鍵累加，並可設定每 45~120 分鐘倒數提醒。
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                · <strong>可觀察睡眠效率法</strong>：無需猜測深層睡眠或 REM 百分比，只需輸入真實的「就寢時間、起床時間、入睡耗時、半夜醒來次數」與「晨起精神恢復感 (1~5分)」，即可精準算出臨床睡眠效率（標準 ≥ 85%）。
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
              <button
                type="button"
                onClick={() => onNavigateTab('sleep-water')}
                className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>前往睡眠與飲水管家</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Guide Item 4 */}
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  <span>04. 15 秒標準脈搏法、心率區間與 4-7-8 減壓呼吸</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">心率與壓力頁</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                · <strong>15 秒標準脈搏量測</strong>：將食指與中指輕按手腕內側橈動脈，點擊「<strong>15秒計時</strong>」並默數 15 秒內的脈搏跳動次數，輸入格中自動乘以 4 換算為標準每分鐘心率 (BPM)，一鍵套用並更新 Karvonen 五級運動心率區間。
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                · <strong>4-7-8 減壓呼吸計時器</strong>：當壓力負荷指數偏高時，點擊「啟動 4-7-8 減壓呼吸引導」，跟隨畫面讀秒（鼻吸氣 4 秒 → 屏息 7 秒 → 嘴吐氣 8 秒）活化副交感神經。
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
              <button
                type="button"
                onClick={() => onNavigateTab('vitals-stress')}
                className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>前往心率與壓力分析</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Guide Item 5: Full-Width Backup & Privacy Guide */}
        <div className="mt-6 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" />
              <span>05. 歷史趨勢檢索與跨裝置 JSON / CSV 備份移轉</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              所有資料皆儲存在您的瀏覽器 `localStorage` 中。欲更換電腦或手機時，請於「歷史趨勢與隱私」點擊「<strong>匯出 JSON 備份</strong>」下載備份檔，並於新裝置點擊「<strong>匯入還原 JSON 備份檔</strong>」即可完整無損移轉所有歷史趨勢、睡眠與飲水紀錄。
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('history-privacy')}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            前往歷史與備份中心
          </button>
        </div>
      </section>

      {/* Section 3: Clinical Standards Reference Table */}
      <section
        aria-labelledby="clinical-ref-heading"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
      >
        <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 id="clinical-ref-heading" className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>臨床健康指標判定標準速查表</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              整理衛福部國民健康署、WHO 世界衛生組織與台灣高血壓學會 722 居家量測標準
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                <th className="py-2.5 px-3 font-medium whitespace-nowrap">評估項目</th>
                <th className="py-2.5 px-3 font-medium whitespace-nowrap">理想健康標準</th>
                <th className="py-2.5 px-3 font-medium whitespace-nowrap">注意 / 臨界區間</th>
                <th className="py-2.5 px-3 font-medium whitespace-nowrap">高風險 / 異常區間</th>
                <th className="py-2.5 px-3 font-medium">正確居家量測要領</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 tabular-nums">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  BMI (台灣國健署)
                </td>
                <td className="py-2.5 px-3 font-mono text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  18.5 ≤ BMI &lt; 24.0
                </td>
                <td className="py-2.5 px-3 font-mono text-amber-700 dark:text-amber-400 whitespace-nowrap">
                  過輕 &lt;18.5 / 過重 24.0-26.9
                </td>
                <td className="py-2.5 px-3 font-mono text-rose-700 dark:text-rose-400 whitespace-nowrap">
                  肥胖 ≥ 27.0
                </td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                  早晨起床排空膀胱後、未進食前穿輕便衣物量測體重
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  腰圍與腰身高比 (WHtR)
                </td>
                <td className="py-2.5 px-3 font-mono text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  男 &lt;90cm · 女 &lt;80cm · WHtR &lt;0.50
                </td>
                <td className="py-2.5 px-3 font-mono text-amber-700 dark:text-amber-400 whitespace-nowrap">
                  WHtR 0.49 - 0.52
                </td>
                <td className="py-2.5 px-3 font-mono text-rose-700 dark:text-rose-400 whitespace-nowrap">
                  男 ≥90cm · 女 ≥80cm · WHtR ≥0.53
                </td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                  自然站立吐氣結束時，以皮尺水平繞過肋骨下緣與腸骨上緣中點
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  722 居家血壓 (mmHg)
                </td>
                <td className="py-2.5 px-3 font-mono text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  &lt; 120 / 80
                </td>
                <td className="py-2.5 px-3 font-mono text-amber-700 dark:text-amber-400 whitespace-nowrap">
                  120-129 / &lt;80 (血壓偏高)
                </td>
                <td className="py-2.5 px-3 font-mono text-rose-700 dark:text-rose-400 whitespace-nowrap">
                  ≥ 130 / 80 (高血壓標準)
                </td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                  連續量 7 天、早晚各 2 時段、每次間隔 1 分鐘量 2 遍取平均
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  睡眠效率與時數
                </td>
                <td className="py-2.5 px-3 font-mono text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  7.0-8.5 小時 · 效率 ≥ 85%
                </td>
                <td className="py-2.5 px-3 font-mono text-amber-700 dark:text-amber-400 whitespace-nowrap">
                  6.0-6.9 小時 · 效率 75%-84%
                </td>
                <td className="py-2.5 px-3 font-mono text-rose-700 dark:text-rose-400 whitespace-nowrap">
                  &lt; 6.0 小時 · 效率 &lt; 75%
                </td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                  睡眠效率 = 實際熟睡時數 ÷ 總躺床時數 × 100%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
