import React, { useState } from 'react';
import {
  ActivityLevel,
  BmiStandard,
  Gender,
  calculateBMI,
  calculateBMR,
  calculateBloodPressureStatus,
  calculateIdealWeightRange,
  calculateTDEE,
  calculateWHR,
  classifyBMI,
} from '../utils/healthCalculations';
import {
  HealthHistoryRecord,
  UserProfile,
  formatMaskedNumber,
} from '../utils/storage';
import { ChartMetricKey, TrendChartSvg } from './TrendChartSvg';
import { CheckCircle2, AlertTriangle, Scale, Activity, HeartPulse, Ruler, PlusCircle } from 'lucide-react';

interface BmiOverviewTabProps {
  profile: UserProfile;
  onUpdateProfile: (partial: Partial<UserProfile>) => void;
  history: HealthHistoryRecord[];
  onSaveSnapshot: (note: string) => void;
  masked: boolean;
  onNavigateTab: (tab: 'overview' | 'questionnaire' | 'sleep-water' | 'vitals-stress' | 'history-privacy' | 'guide') => void;
}

export const BmiOverviewTab: React.FC<BmiOverviewTabProps> = ({
  profile,
  onUpdateProfile,
  history,
  onSaveSnapshot,
  masked,
  onNavigateTab,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<ChartMetricKey>('bmi');
  const [snapshotNote, setSnapshotNote] = useState<string>('');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const bmi = calculateBMI(profile.heightCm, profile.weightKg);
  const bmiInfo = classifyBMI(bmi, profile.bmiStandard);
  const idealRange = calculateIdealWeightRange(profile.heightCm, profile.weightKg, profile.bmiStandard);
  const bmr = calculateBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const whrInfo = calculateWHR(profile.waistCm, profile.hipCm, profile.gender, profile.heightCm);
  const bpInfo = calculateBloodPressureStatus(profile.systolicBp, profile.diastolicBp);

  const gaugeMarkerPct = Math.max(2, Math.min(98, ((bmi - 14) / (38 - 14)) * 100));

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.heightCm || profile.heightCm < 80 || profile.heightCm > 250) {
      setValidationError('請輸入有效的身高數值（80 ~ 250 cm）後再儲存紀錄。');
      return;
    }
    if (!profile.weightKg || profile.weightKg < 20 || profile.weightKg > 300) {
      setValidationError('請輸入有效的體重數值（20 ~ 300 kg）後再儲存紀錄。');
      return;
    }
    setValidationError(null);
    onSaveSnapshot(snapshotNote);
    setSnapshotNote('');
    setSaveFeedback(`已儲存今日健康快照（BMI ${bmi} / 體重 ${profile.weightKg} kg）至歷史趨勢庫`);
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Anthropometric Input Console (5 cols) */}
        <section
          aria-labelledby="bmi-calc-heading"
          className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 id="bmi-calc-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  身體組成與生理量測輸入
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  調整數值即時計算 BMI、BMR、TDEE、腰身高比與腰臀比
                </p>
              </div>

              <div
                role="group"
                aria-label="BMI 判定標準切換"
                className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0"
              >
                <button
                  type="button"
                  onClick={() => onUpdateProfile({ bmiStandard: 'tw' })}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    profile.bmiStandard === 'tw'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  台灣國健署
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateProfile({ bmiStandard: 'who' })}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    profile.bmiStandard === 'who'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  WHO 國際
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="input-height-cm"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  身高 (cm)
                </label>
                <input
                  id="input-height-cm"
                  type="number"
                  step="0.5"
                  min="80"
                  max="250"
                  value={profile.heightCm || ''}
                  onChange={(e) => onUpdateProfile({ heightCm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label
                  htmlFor="input-weight-kg"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  體重 (kg)
                </label>
                <input
                  id="input-weight-kg"
                  type="number"
                  step="0.1"
                  min="20"
                  max="250"
                  value={profile.weightKg || ''}
                  onChange={(e) => onUpdateProfile({ weightKg: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label
                  htmlFor="input-age"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  年齡 (歲)
                </label>
                <input
                  id="input-age"
                  type="number"
                  min="10"
                  max="110"
                  value={profile.age || ''}
                  onChange={(e) => onUpdateProfile({ age: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label
                  htmlFor="select-gender"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  生理性別
                </label>
                <select
                  id="select-gender"
                  value={profile.gender}
                  onChange={(e) => onUpdateProfile({ gender: e.target.value as Gender })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="male">生理男 (Male)</option>
                  <option value="female">生理女 (Female)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="input-waist-cm"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  腰圍 (cm)
                </label>
                <input
                  id="input-waist-cm"
                  type="number"
                  step="0.5"
                  min="40"
                  max="180"
                  value={profile.waistCm || ''}
                  onChange={(e) => onUpdateProfile({ waistCm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label
                  htmlFor="input-hip-cm"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  臀圍 (cm)
                </label>
                <input
                  id="input-hip-cm"
                  type="number"
                  step="0.5"
                  min="40"
                  max="180"
                  value={profile.hipCm || ''}
                  onChange={(e) => onUpdateProfile({ hipCm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="col-span-2">
                <label
                  htmlFor="select-activity"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  日常活動量係數 (用於計算 TDEE 每日總熱量消耗)
                </label>
                <select
                  id="select-activity"
                  value={profile.activityLevel}
                  onChange={(e) => onUpdateProfile({ activityLevel: e.target.value as ActivityLevel })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="sedentary">久坐辦公 (幾乎無運動, BMR × 1.2)</option>
                  <option value="light">輕度活動 (每週運動 1-3 天, BMR × 1.375)</option>
                  <option value="moderate">中度活動 (每週運動 3-5 天, BMR × 1.55)</option>
                  <option value="active">高度活動 (每週高強度運動 6-7 天, BMR × 1.725)</option>
                  <option value="athlete">專業運動員 / 重度體力勞動 (BMR × 1.9)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="input-systolic"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  收縮壓 (mmHg)
                </label>
                <input
                  id="input-systolic"
                  type="number"
                  min="70"
                  max="220"
                  value={profile.systolicBp || ''}
                  onChange={(e) => onUpdateProfile({ systolicBp: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label
                  htmlFor="input-diastolic"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  舒張壓 (mmHg)
                </label>
                <input
                  id="input-diastolic"
                  type="number"
                  min="40"
                  max="140"
                  value={profile.diastolicBp || ''}
                  onChange={(e) => onUpdateProfile({ diastolicBp: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveRecord} className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <label
              htmlFor="input-snapshot-note"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              今日量測備註 (選填，將連同上方指標寫入歷史趨勢庫)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="input-snapshot-note"
                type="text"
                placeholder="例如：晨起空腹量測、完成 40 分鐘重訓..."
                value={snapshotNote}
                onChange={(e) => setSnapshotNote(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>儲存至今日紀錄</span>
              </button>
            </div>
            {validationError && (
              <p role="alert" className="mt-2 text-xs text-rose-600 dark:text-rose-400">
                {validationError}
              </p>
            )}
            {saveFeedback && (
              <p role="status" className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                {saveFeedback}
              </p>
            )}
          </form>
        </section>

        {/* Right Column: Real-Time BMI Spectrum & Comprehensive Body Composition Analysis (7 cols) */}
        <section
          aria-labelledby="bmi-result-heading"
          className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 id="bmi-result-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  即時健康體位判定與身體組成報告
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span>依據：{profile.bmiStandard === 'tw' ? '衛福部國健署成人體位標準' : 'WHO 世界衛生組織標準'}</span>
                  <span aria-hidden="true" className="mx-1.5">·</span>
                  <span>判定區間：{bmiInfo.rangeText}</span>
                </p>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">目前 BMI</span>
                <span
                  data-testid="bmi-value-readout"
                  className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100"
                >
                  {formatMaskedNumber(bmi, masked)}
                </span>
                <span
                  data-testid="bmi-category-label"
                  className={`text-sm font-semibold flex items-center gap-1 ${
                    bmiInfo.riskLevel === 'low'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : bmiInfo.riskLevel === 'moderate'
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {bmiInfo.riskLevel === 'low' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  {bmiInfo.label}
                </span>
              </div>
            </div>

            {/* BMI Spectrum Bar */}
            <div className="mt-5">
              <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mb-1.5">
                <span>過輕 (&lt;18.5)</span>
                <span>正常 ({profile.bmiStandard === 'tw' ? '18.5-23.9' : '18.5-24.9'})</span>
                <span>過重 ({profile.bmiStandard === 'tw' ? '24-26.9' : '25-29.9'})</span>
                <span>輕度肥胖 ({profile.bmiStandard === 'tw' ? '27-29.9' : '30-34.9'})</span>
                <span>中重度肥胖 (≥{profile.bmiStandard === 'tw' ? '30' : '35'})</span>
              </div>
              <div className="relative h-3.5 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                <div className="w-[18.75%] bg-sky-400" title="體重過輕" />
                <div className="w-[22.9%] bg-emerald-500" title="正常範圍" />
                <div className="w-[12.5%] bg-amber-400" title="體重過重" />
                <div className="w-[12.5%] bg-orange-500" title="輕度肥胖" />
                <div className="flex-1 bg-rose-600" title="中重度肥胖" />
              </div>
              <div className="relative h-5 w-full">
                <div
                  style={{ left: `${gaugeMarkerPct}%` }}
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-150"
                >
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-slate-900 dark:border-b-white" />
                  <span className="text-[10px] font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {masked ? '••' : bmi}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong className="font-semibold text-slate-900 dark:text-slate-100">臨床體位評估建議：</strong>
              {bmiInfo.advice}
            </div>

            {/* 4-Metric Body Composition Matrix (Using accurate tape-measure WHtR & WHR) */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 border-t border-b border-slate-200 dark:border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
              <div className="py-3.5 pr-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Scale className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>理想體重區間</span>
                </div>
                <p className="mt-1 text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {masked ? '•• - •• kg' : `${idealRange.minKg} - ${idealRange.maxKg} kg`}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                  黃金目標 {formatMaskedNumber(idealRange.targetKg, masked, 'kg')} (
                  {idealRange.diffFromTargetKg > 0 ? `+${idealRange.diffFromTargetKg}` : idealRange.diffFromTargetKg} kg)
                </p>
              </div>

              <div className="py-3.5 sm:px-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Activity className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>基礎代謝 / 總消耗</span>
                </div>
                <p className="mt-1 text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {formatMaskedNumber(tdee, masked, 'kcal')}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                  BMR 基礎代謝 {formatMaskedNumber(bmr, masked, 'kcal')}
                </p>
              </div>

              <div className="py-3.5 sm:px-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Ruler className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>腰身高比 / 腰臀比</span>
                </div>
                <p className="mt-1 text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  WHtR {formatMaskedNumber(whrInfo.whtr, masked)}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                  腰臀比 WHR {formatMaskedNumber(whrInfo.whr, masked)}
                </p>
              </div>

              <div className="py-3.5 sm:pl-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>血壓與脈壓差</span>
                </div>
                <p className="mt-1 text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {masked ? '•••/••' : `${profile.systolicBp}/${profile.diastolicBp}`} mmHg
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                  脈壓差 {bpInfo.pulsePressure} · MAP {bpInfo.map}
                </p>
              </div>
            </div>

            {/* Extended Practical Health Diagnostics Row */}
            <div className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span>
                  <strong className="text-slate-900 dark:text-slate-200">腹部肥胖與腰身高比評估 ({whrInfo.label})：</strong>
                  {whrInfo.advice}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 border-t border-slate-100 dark:border-slate-800/70">
                <span>
                  <strong className="text-slate-900 dark:text-slate-200">
                    居家血壓血流動力學 ({bpInfo.label} · 脈壓差 {bpInfo.pulsePressure} mmHg · 平均動脈壓 {bpInfo.map} mmHg)：
                  </strong>
                  {bpInfo.advice}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              下一步健康管理行動：填寫生活問卷取得營養處方，或檢視完整使用說明
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('questionnaire')}
                className="px-3 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                前往健康問卷與營養處方
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('guide')}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                查看完整使用說明
              </button>
            </div>
          </div>
        </section>
      </div>

      <TrendChartSvg
        records={history}
        selectedMetric={selectedMetric}
        onSelectMetric={setSelectedMetric}
        masked={masked}
      />
    </div>
  );
};
