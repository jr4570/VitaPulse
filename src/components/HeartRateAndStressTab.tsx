import React, { useState, useEffect } from 'react';
import {
  calculateBpmFrom15SecCount,
  calculateHeartRateZones,
  calculateStressIndex,
} from '../utils/healthCalculations';
import { UserProfile } from '../utils/storage';
import { Heart, Activity, Wind, Play, Square, RotateCcw, Timer } from 'lucide-react';

interface HeartRateAndStressTabProps {
  profile: UserProfile;
  restingHr: number;
  onUpdateRestingHr: (bpm: number) => void;
  stressParams: {
    baselineHr: number;
    sleepHours: number;
    perceivedStress: number;
    caffeineCups: number;
    workHours: number;
  };
  onUpdateStressParams: (partial: Partial<HeartRateAndStressTabProps['stressParams']>) => void;
}

export const HeartRateAndStressTab: React.FC<HeartRateAndStressTabProps> = ({
  profile,
  restingHr,
  onUpdateRestingHr,
  stressParams,
  onUpdateStressParams,
}) => {
  // Standard 15-second clinical pulse timer & count converter
  const [pulseTimerRunning, setPulseTimerRunning] = useState<boolean>(false);
  const [pulseTimerSecondsLeft, setPulseTimerSecondsLeft] = useState<number>(15);
  const [count15Sec, setCount15Sec] = useState<number>(15);

  // 4-7-8 Breathing trainer state
  const [breathingActive, setBreathingActive] = useState<boolean>(false);
  const [breathingTick, setBreathingTick] = useState<number>(0);
  const [completedCycles, setCompletedCycles] = useState<number>(0);

  useEffect(() => {
    if (!pulseTimerRunning) return;
    const timer = setInterval(() => {
      setPulseTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          setPulseTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pulseTimerRunning]);

  useEffect(() => {
    if (!breathingActive) return;
    const timer = setInterval(() => {
      setBreathingTick((prev) => {
        if (prev >= 18) {
          setCompletedCycles((c) => c + 1);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [breathingActive]);

  const convertedBpm = calculateBpmFrom15SecCount(count15Sec);
  const hrAnalysis = calculateHeartRateZones(profile.age, restingHr);
  const stressAnalysis = calculateStressIndex({
    restingHr,
    ...stressParams,
  });

  let phaseTitle = '準備開始 4-7-8 迷走神經減壓呼吸';
  let phaseSub = '透過延長吐氣時間刺激副交感神經，即時降低心率與壓力荷爾蒙';
  let phaseSecondsLeft = 0;

  if (breathingActive) {
    if (breathingTick < 4) {
      phaseTitle = '鼻吸氣 (Inhale)';
      phaseSub = '舌尖頂住上顎，用鼻子緩慢深吸氣 4 秒';
      phaseSecondsLeft = 4 - breathingTick;
    } else if (breathingTick < 11) {
      phaseTitle = '屏息維持 (Hold)';
      phaseSub = '保持胸腹放鬆，屏住呼吸 7 秒讓氧氣充分交換';
      phaseSecondsLeft = 11 - breathingTick;
    } else {
      phaseTitle = '嘴吐氣 (Exhale)';
      phaseSub = '雙唇微張緩慢均勻吐氣 8 秒，釋放交感神經張力';
      phaseSecondsLeft = 19 - breathingTick;
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Heart Rate Zone Integration & 15s Standard Pulse Converter (6 cols) */}
        <section
          aria-labelledby="hr-tracking-heading"
          className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 id="hr-tracking-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <span>心率追蹤整合與儲備心率區間 (Karvonen)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  預估最大心率 {hrAnalysis.maxHr} bpm · 儲備心率 (HRR) {hrAnalysis.heartRateReserve} bpm
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">靜息心率評級</span>
                <span
                  data-testid="resting-hr-readout"
                  className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400"
                >
                  {restingHr}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {' '}bpm · {hrAnalysis.fitnessLevel}
                </span>
              </div>
            </div>

            {/* Resting HR Input + Standard 15-Second Clinical Pulse Multiplier */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <label
                  htmlFor="input-resting-hr"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  晨間靜息心率 (Resting HR, bpm)
                </label>
                <input
                  id="input-resting-hr"
                  type="number"
                  min="38"
                  max="130"
                  value={restingHr}
                  onChange={(e) => onUpdateRestingHr(parseInt(e.target.value, 10) || 60)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  可直接輸入智慧手錶讀數，或使用右側 15 秒標準脈搏法換算
                </p>
              </div>

              <div className="flex flex-col justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-rose-600" />
                    <span>15 秒標準脈搏換算器</span>
                  </span>
                  <span className="font-mono font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                    {pulseTimerRunning
                      ? `計時中 ${pulseTimerSecondsLeft}s`
                      : pulseTimerSecondsLeft === 0
                        ? '計時結束！請輸入次數'
                        : `${count15Sec} 下 × 4 = ${convertedBpm} bpm`}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPulseTimerSecondsLeft(15);
                      setPulseTimerRunning(true);
                    }}
                    className="py-1.5 px-2.5 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {pulseTimerRunning ? `${pulseTimerSecondsLeft}s` : '15秒計時'}
                  </button>
                  <label htmlFor="input-15s-pulse" className="sr-only">
                    15秒脈搏跳動次數
                  </label>
                  <input
                    id="input-15s-pulse"
                    type="number"
                    min="8"
                    max="50"
                    value={count15Sec || ''}
                    onChange={(e) => setCount15Sec(parseInt(e.target.value, 10) || 0)}
                    title="輸入 15 秒內默數的脈搏跳動次數"
                    className="w-16 px-2 py-1 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (convertedBpm > 0) {
                        onUpdateRestingHr(convertedBpm);
                      }
                    }}
                    className="flex-1 py-1.5 px-2.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    套用 {convertedBpm} bpm
                  </button>
                </div>
              </div>
            </div>

            {/* 5 Heart Rate Training Zones Table */}
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                個人化五級運動心率區間表 (依年齡 {profile.age} 歲與靜息心率 {restingHr} bpm 動態計算)
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                      <th className="py-2 px-3 font-medium whitespace-nowrap">心率區間</th>
                      <th className="py-2 px-3 font-medium text-right whitespace-nowrap">儲備強度</th>
                      <th className="py-2 px-3 font-medium text-right whitespace-nowrap">目標心率 (bpm)</th>
                      <th className="py-2 px-3 font-medium">主要生理效益</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 tabular-nums">
                    {hrAnalysis.zones.map((z) => (
                      <tr key={z.zone} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {z.name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500 whitespace-nowrap">
                          {z.intensityPct}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {z.minBpm} - {z.maxBpm}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          {z.benefit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Stress Index Analysis + Guided 4-7-8 Breathing (6 cols) */}
        <section
          aria-labelledby="stress-heading"
          className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 id="stress-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>身心壓力負荷指數與自律神經分析</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  自律神經狀態：{stressAnalysis.autonomicBalance} · 靜息心率偏移 {restingHr - stressParams.baselineHr >= 0 ? `+${restingHr - stressParams.baselineHr}` : restingHr - stressParams.baselineHr} bpm
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">壓力負荷指數</span>
                <span
                  data-testid="stress-index-readout"
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    stressAnalysis.stressIndex <= 35
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : stressAnalysis.stressIndex <= 58
                        ? 'text-sky-600 dark:text-sky-400'
                        : stressAnalysis.stressIndex <= 76
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {stressAnalysis.stressIndex}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {' '}/ 100 · {stressAnalysis.level}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="input-baseline-hr"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  平時基準心率 (bpm)
                </label>
                <input
                  id="input-baseline-hr"
                  type="number"
                  min="40"
                  max="100"
                  value={stressParams.baselineHr}
                  onChange={(e) =>
                    onUpdateStressParams({ baselineHr: parseInt(e.target.value, 10) || 60 })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="input-stress-sleep"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  昨晚睡眠時數 (小時)
                </label>
                <input
                  id="input-stress-sleep"
                  type="number"
                  step="0.5"
                  min="2"
                  max="12"
                  value={stressParams.sleepHours}
                  onChange={(e) =>
                    onUpdateStressParams({ sleepHours: parseFloat(e.target.value) || 7 })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="input-perceived-stress"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  主觀壓力感受 (1-10)
                </label>
                <input
                  id="input-perceived-stress"
                  type="number"
                  min="1"
                  max="10"
                  value={stressParams.perceivedStress}
                  onChange={(e) =>
                    onUpdateStressParams({ perceivedStress: parseInt(e.target.value, 10) || 3 })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="input-caffeine"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  今日咖啡因飲品 (杯)
                </label>
                <input
                  id="input-caffeine"
                  type="number"
                  min="0"
                  max="10"
                  value={stressParams.caffeineCups}
                  onChange={(e) =>
                    onUpdateStressParams({ caffeineCups: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="col-span-2">
                <label
                  htmlFor="input-work-hours"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  今日高專注工作 / 螢幕時數 (小時)
                </label>
                <input
                  id="input-work-hours"
                  type="number"
                  step="0.5"
                  min="0"
                  max="18"
                  value={stressParams.workHours}
                  onChange={(e) =>
                    onUpdateStressParams({ workHours: parseFloat(e.target.value) || 8 })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="mt-4 py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                自律神經平衡與減壓處方：
              </p>
              {stressAnalysis.recoveryAdvice.map((line, i) => (
                <p key={i} className="leading-relaxed">
                  · {line}
                </p>
              ))}
            </div>

            {/* Interactive 4-7-8 Breathing De-Stress Module */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {phaseTitle}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {phaseSub}
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono tabular-nums shrink-0">
                  {breathingActive ? (
                    <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                      {phaseSecondsLeft}s
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">
                      已完成 {completedCycles} 循環
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                {!breathingActive ? (
                  <button
                    type="button"
                    onClick={() => {
                      setBreathingTick(0);
                      setBreathingActive(true);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>啟動 4-7-8 減壓呼吸引導</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBreathingActive(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>結束呼吸訓練</span>
                  </button>
                )}

                {completedCycles > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateStressParams({
                        perceivedStress: Math.max(1, stressParams.perceivedStress - 1),
                      });
                      onUpdateRestingHr(Math.max(48, restingHr - 2));
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>呼吸完成，更新放鬆後心率與壓力</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
