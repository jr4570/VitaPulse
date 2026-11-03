import React, { useState } from 'react';
import {
  HealthGoal,
  MentalHealthScalesState,
  QuestionnaireAnswers,
  calculateBMI,
  calculateBMR,
  calculateNutritionAndExercisePlan,
  calculateTDEE,
  evaluateHealthQuestionnaire,
  evaluateMentalHealthScales,
} from '../utils/healthCalculations';
import { UserProfile, formatMaskedNumber } from '../utils/storage';
import {
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Flame,
  Utensils,
  Dumbbell,
  Footprints,
  Brain,
  HeartHandshake,
  RotateCcw,
} from 'lucide-react';

interface QuestionnaireAndGoalsTabProps {
  profile: UserProfile;
  onUpdateProfile: (partial: Partial<UserProfile>) => void;
  questionnaire: QuestionnaireAnswers;
  onUpdateQuestionnaire: (partial: Partial<QuestionnaireAnswers>) => void;
  mentalHealthScales: MentalHealthScalesState;
  onUpdateMentalHealthScales: (partial: Partial<MentalHealthScalesState>) => void;
  onSyncStressToVitals?: (perceivedStress1To10: number) => void;
  exerciseCompletedMinsThisWeek: number;
  strengthCompletedSessionsThisWeek: number;
  stepsToday: number;
  onUpdateExerciseProgress: (mins: number, sessions: number, steps: number) => void;
  masked: boolean;
}

interface QuestionFieldConfig {
  key: keyof QuestionnaireAnswers;
  title: string;
  maxPoints: number;
  options: { label: string; score: number }[];
}

const QUESTION_FIELDS: QuestionFieldConfig[] = [
  {
    key: 'dietQuality',
    title: '01. 每日蔬果、全穀與原型食物攝取比例',
    maxPoints: 15,
    options: [
      { label: '外食精緻澱粉為主，極少蔬果 (4分)', score: 4 },
      { label: '每日約 1-2 份蔬果，偶有全穀 (8分)', score: 8 },
      { label: '多數餐次符合 211 餐盤原則 (12分)', score: 12 },
      { label: '嚴格執行每日 3 蔬 2 果與優質蛋白 (15分)', score: 15 },
    ],
  },
  {
    key: 'sugarAndProcessed',
    title: '02. 含糖手搖飲、甜點與超加工食品控制',
    maxPoints: 10,
    options: [
      { label: '幾乎每天飲用含糖飲或宵夜炸物 (2分)', score: 2 },
      { label: '每週 3-4 次微糖飲或加工點心 (5分)', score: 5 },
      { label: '每週 ≤ 1 次，平時以無糖茶為主 (8分)', score: 8 },
      { label: '完全戒除精製糖飲與反式脂肪 (10分)', score: 10 },
    ],
  },
  {
    key: 'exerciseFreq',
    title: '03. 每週中高強度有氧與肌力訓練頻率',
    maxPoints: 15,
    options: [
      { label: '幾乎不運動 (每週 < 30 分鐘) (3分)', score: 3 },
      { label: '偶爾運動 (每週 1-2 次，約 60 分鐘) (7分)', score: 7 },
      { label: '規律運動 (每週 3 次，達 120 分鐘) (11分)', score: 11 },
      { label: '達標國健署建議 (每週 ≥ 150 分鐘 + 肌力) (15分)', score: 15 },
    ],
  },
  {
    key: 'sedentaryControl',
    title: '04. 久坐時間中斷與日常步數 (NEAT)',
    maxPoints: 10,
    options: [
      { label: '連續久坐 > 8 小時，日行 < 3,500 步 (2分)', score: 2 },
      { label: '偶爾起身走動，日行約 5,000 步 (6分)', score: 6 },
      { label: '每小時起身活動，日行 7,500 步以上 (8分)', score: 8 },
      { label: '番茄鐘動態辦公，日行 ≥ 10,000 步 (10分)', score: 10 },
    ],
  },
  {
    key: 'sleepRegularity',
    title: '05. 睡眠時數充足度與就寢起床規律性',
    maxPoints: 15,
    options: [
      { label: '常熬夜且睡眠 < 6 小時，作息混亂 (4分)', score: 4 },
      { label: '平日睡眠 6-6.5 小時，週末補眠 (8分)', score: 8 },
      { label: '多數日子睡滿 7 小時，作息大致固定 (11分)', score: 11 },
      { label: '每晚睡滿 7.5-8 小時且定時起床 (15分)', score: 15 },
    ],
  },
  {
    key: 'hydrationHabit',
    title: '06. 每日純水攝取量與分次補充習慣',
    maxPoints: 10,
    options: [
      { label: '口渴才喝水，每日 < 1,200 ml (3分)', score: 3 },
      { label: '每日約 1,500 - 1,800 ml (6分)', score: 6 },
      { label: '每日穩定達 2,000 - 2,400 ml (8分)', score: 8 },
      { label: '達體重 × 35 ml 且全天定時均勻飲用 (10分)', score: 10 },
    ],
  },
  {
    key: 'stressResilience',
    title: '07. 日常心理壓力感受與正念情緒調適',
    maxPoints: 15,
    options: [
      { label: '長期高度緊繃焦慮，缺乏紓壓管道 (4分)', score: 4 },
      { label: '工作壓力偏高，偶爾透過娛樂放鬆 (7分)', score: 7 },
      { label: '壓力可控，具備固定運動或休閒紓壓 (10分)', score: 10 },
      { label: '身心平衡，每日執行呼吸或冥想練習 (15分)', score: 15 },
    ],
  },
  {
    key: 'substanceControl',
    title: '08. 菸酒控制與午後咖啡因管理',
    maxPoints: 10,
    options: [
      { label: '有吸菸習慣或每週飲酒 ≥ 3 次 (2分)', score: 2 },
      { label: '不吸菸，偶爾社交飲酒或晚間喝咖啡 (6分)', score: 6 },
      { label: '極少飲酒，下午 3 點後不碰咖啡因 (9分)', score: 9 },
      { label: '完全無菸酒且嚴格管理刺激性飲品 (10分)', score: 10 },
    ],
  },
];

const PHQ9_QUESTIONS: string[] = [
  '01. 做事時提不起勁或沒有樂趣',
  '02. 感到心情低落、沮喪或絕望',
  '03. 入睡困難、睡不安穩或睡眠過多',
  '04. 感覺疲倦或沒有活力',
  '05. 食慾不振或吃太多',
  '06. 覺得自己很糟、覺得自己很失敗，或讓自己與家人失望',
  '07. 對事物專注有困難（例如閱讀文件、處理工作或看電視時）',
  '08. 動作或說話速度緩慢到別人已經察覺，或正好相反——煩躁或坐立不安',
  '09. 有不如死掉或用某種方式傷害自己的念頭',
];

const GAD7_QUESTIONS: string[] = [
  '01. 感覺緊張、焦慮或坐立不安',
  '02. 無法停止或控制憂慮',
  '03. 對各種不同的事情過度擔憂',
  '04. 很難放鬆下來',
  '05. 由於不安而無法靜坐',
  '06. 變得容易煩躁或急躁易怒',
  '07. 感到好像將有可怕的事情發生而害怕',
];

const BSRS5_QUESTIONS: string[] = [
  '01. 睡眠困難，譬如難以入睡、易醒或早醒',
  '02. 感覺緊張不安',
  '03. 覺得容易苦惱或動怒',
  '04. 感覺憂鬱、心情低落',
  '05. 覺得比不上別人',
];

const PSS6_QUESTIONS: string[] = [
  '01. 因為發生意料之外的事而感到心煩意亂',
  '02. 感覺無法控制自己生活中重要的事情',
  '03. 感到緊張、神經緊繃與壓力沉重',
  '04. 發現自己無法應付所有必須完成的事情',
  '05. 因為事情超出自己的控制範圍而感到生氣或煩躁',
  '06. 覺得困難的事情堆積如山，多到無法克服',
];

const FREQ_OPTIONS_0_TO_3 = [
  { value: 0, label: '0分 · 完全沒有' },
  { value: 1, label: '1分 · 幾天' },
  { value: 2, label: '2分 · 一半以上天數' },
  { value: 3, label: '3分 · 幾乎每天' },
];

const SEVERITY_OPTIONS_0_TO_4 = [
  { value: 0, label: '0分 · 完全沒有' },
  { value: 1, label: '1分 · 輕微' },
  { value: 2, label: '2分 · 中等程度' },
  { value: 3, label: '3分 · 厲害' },
  { value: 4, label: '4分 · 非常厲害' },
];

const PSS_OPTIONS_0_TO_4 = [
  { value: 0, label: '0分 · 從不' },
  { value: 1, label: '1分 · 偶爾' },
  { value: 2, label: '2分 · 有時' },
  { value: 3, label: '3分 · 常如此' },
  { value: 4, label: '4分 · 總是如此' },
];

export const QuestionnaireAndGoalsTab: React.FC<QuestionnaireAndGoalsTabProps> = ({
  profile,
  onUpdateProfile,
  questionnaire,
  onUpdateQuestionnaire,
  mentalHealthScales,
  onUpdateMentalHealthScales,
  onSyncStressToVitals,
  exerciseCompletedMinsThisWeek,
  strengthCompletedSessionsThisWeek,
  stepsToday,
  onUpdateExerciseProgress,
  masked,
}) => {
  const [activeMentalScale, setActiveMentalScale] = useState<'phq9' | 'gad7' | 'bsrs5' | 'pss6'>('phq9');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const bmi = calculateBMI(profile.heightCm, profile.weightKg);
  const bmr = calculateBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activityLevel);

  const evaluation = evaluateHealthQuestionnaire(questionnaire, bmi);
  const mentalEval = evaluateMentalHealthScales(mentalHealthScales);
  const plan = calculateNutritionAndExercisePlan(tdee, profile.weightKg, bmi, profile.goal);

  const cardioPct = Math.min(100, Math.round((exerciseCompletedMinsThisWeek / plan.exerciseGoals.weeklyCardioMins) * 100));
  const strengthPct = Math.min(100, Math.round((strengthCompletedSessionsThisWeek / plan.exerciseGoals.weeklyStrengthSessions) * 100));
  const stepsPct = Math.min(100, Math.round((stepsToday / plan.exerciseGoals.dailySteps) * 100));

  const handleScaleItemChange = (
    scaleKey: keyof MentalHealthScalesState,
    index: number,
    value: number
  ) => {
    const nextArr = [...(mentalHealthScales[scaleKey] || [])];
    nextArr[index] = value;
    onUpdateMentalHealthScales({ [scaleKey]: nextArr });
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Lifestyle Questionnaire Input & Diagnostic Evaluation Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: 8-Dimension Clinical Lifestyle Questionnaire (6 cols) */}
        <section
          aria-labelledby="questionnaire-form-heading"
          className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
        >
          <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              <h2 id="questionnaire-form-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                全方位健康生活型態問卷評量
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                涵蓋飲食、運動、睡眠、飲水與壓力 8 大臨床維度，點選選項即時更新評分與處方
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateQuestionnaire({
                  dietQuality: 15,
                  sugarAndProcessed: 10,
                  exerciseFreq: 15,
                  sedentaryControl: 10,
                  sleepRegularity: 15,
                  hydrationHabit: 10,
                  stressResilience: 15,
                  substanceControl: 10,
                })
              }
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              模擬最佳模範狀態
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {QUESTION_FIELDS.map((q) => {
              const currentVal = questionnaire[q.key];
              return (
                <div
                  key={q.key}
                  className="pb-3.5 border-b border-slate-100 dark:border-slate-800/70 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label
                      htmlFor={`select-q-${q.key}`}
                      className="text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      {q.title}
                    </label>
                    <span className="text-xs font-mono tabular-nums text-teal-700 dark:text-teal-400">
                      {currentVal} / {q.maxPoints} 分
                    </span>
                  </div>
                  <select
                    id={`select-q-${q.key}`}
                    value={currentVal}
                    onChange={(e) =>
                      onUpdateQuestionnaire({ [q.key]: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    {q.options.map((opt) => (
                      <option key={opt.score} value={opt.score}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right: Health Score Readout + Prioritized Improvement Recommendations (6 cols) */}
        <section
          aria-labelledby="questionnaire-score-heading"
          className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 id="questionnaire-score-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  健康問卷綜合評分與分級改善建議
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  結合問卷作答與目前 BMI ({formatMaskedNumber(bmi, masked)}) 進行加權風險核算
                </p>
              </div>
              <div className="flex items-baseline gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">綜合健康總分</span>
                  <span
                    data-testid="questionnaire-total-score"
                    className="text-3xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400"
                  >
                    {evaluation.totalScore}
                  </span>
                  <span className="text-xs font-mono text-slate-400 ml-0.5">/ 100</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono font-bold text-lg tabular-nums">
                  {evaluation.grade} 級
                </div>
              </div>
            </div>

            {/* Summary diagnosis */}
            <div className="mt-4 py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {evaluation.summaryTitle}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {evaluation.summaryDescription}
              </p>
            </div>

            {/* 4 Dimension Progress Bars */}
            <div className="mt-4 grid grid-cols-2 gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              {[
                { label: '膳食結構與控糖', pct: evaluation.dimensionPercentages.nutrition },
                { label: '體能活動與抗久坐', pct: evaluation.dimensionPercentages.activity },
                { label: '睡眠修復與水分', pct: evaluation.dimensionPercentages.sleepAndWater },
                { label: '情緒韌性與自律', pct: evaluation.dimensionPercentages.mentalAndHabits },
              ].map((dim) => (
                <div key={dim.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{dim.label}</span>
                    <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100 font-semibold">
                      {dim.pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${dim.pct}%` }}
                      className={`h-full transition-all duration-200 ${
                        dim.pct >= 80
                          ? 'bg-emerald-500'
                          : dim.pct >= 60
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Actionable Recommendations sorted by priority */}
            <div className="mt-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                個人化改善優先順序與執行程度建議（依急迫度排序）
              </h3>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {evaluation.recommendations.map((rec) => (
                  <div key={rec.id} className="py-3 first:pt-1 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {rec.degree === '維持良好' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle
                            className={`w-4 h-4 shrink-0 ${
                              rec.degree === '亟需改善'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          />
                        )}
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {rec.dimension}
                        </span>
                      </div>
                      <div className="text-xs font-medium tabular-nums">
                        <span
                          className={
                            rec.degree === '亟需改善'
                              ? 'text-rose-700 dark:text-rose-400 font-semibold'
                              : rec.degree === '建議強化'
                                ? 'text-amber-700 dark:text-amber-400 font-semibold'
                                : 'text-emerald-700 dark:text-emerald-400 font-semibold'
                          }
                        >
                          改善程度：{rec.degree}
                        </span>
                        <span aria-hidden="true" className="mx-1.5 text-slate-400">·</span>
                        <span className="text-slate-500 dark:text-slate-400">{rec.targetMetric}</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <strong className="text-slate-800 dark:text-slate-200">具體行動方案：</strong>
                      {rec.actionPlan}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Section 2: Clinical Depression (PHQ-9), Anxiety (GAD-7), Mood Thermometer (BSRS-5) & Perceived Stress (PSS) Questionnaires */}
      <section
        aria-labelledby="mental-scales-heading"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2
              id="mental-scales-heading"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2"
            >
              <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>臨床憂鬱、焦慮、心情溫度計與感知壓力量表中心</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              整合國際標準 PHQ-9 憂鬱症檢核、GAD-7 廣泛性焦慮量表、衛福部 BSRS-5 心情溫度計與 PSS 感知壓力量表
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Scale Selector Tabs */}
            <div
              role="tablist"
              aria-label="選擇心理與壓力量表"
              className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
            >
              {(
                [
                  { id: 'phq9', label: `PHQ-9 憂鬱量表 (${mentalEval.phq9Score}/27)` },
                  { id: 'gad7', label: `GAD-7 焦慮量表 (${mentalEval.gad7Score}/21)` },
                  { id: 'bsrs5', label: `BSRS-5 心情溫度計 (${mentalEval.bsrs5Score}/20)` },
                  { id: 'pss6', label: `PSS 壓力量表 (${mentalEval.pssScore}/24)` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeMentalScale === tab.id}
                  onClick={() => setActiveMentalScale(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeMentalScale === tab.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                onUpdateMentalHealthScales({
                  phq9: [0, 0, 0, 0, 0, 0, 0, 0, 0],
                  gad7: [0, 0, 0, 0, 0, 0, 0],
                  bsrs5: [0, 0, 0, 0, 0],
                  pss6: [0, 0, 0, 0, 0, 0],
                })
              }
              title="將所有心理與壓力量表歸零重置"
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>全部歸零</span>
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 7 cols: Active Psychological / Stress Scale Questions */}
          <div className="lg:col-span-7 space-y-4">
            {activeMentalScale === 'phq9' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      PHQ-9 憂鬱症自我檢核量表（過去兩週內出現頻率）
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      0–4分：無憂鬱傾向 · 5–9分：輕度 · 10–14分：中度 · 15–19分：中重度 · 20–27分：重度
                    </p>
                  </div>
                  <span className="text-sm font-mono font-bold tabular-nums text-indigo-600 dark:text-indigo-400 shrink-0">
                    {mentalEval.phq9Score} / 27 分
                  </span>
                </div>
                <div className="space-y-3">
                  {PHQ9_QUESTIONS.map((qText, idx) => {
                    const val = mentalHealthScales.phq9?.[idx] ?? 0;
                    return (
                      <div
                        key={qText}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {qText}
                          </span>
                          <span className="text-xs font-mono tabular-nums text-indigo-600 dark:text-indigo-400 shrink-0">
                            {val} 分
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {FREQ_OPTIONS_0_TO_3.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleScaleItemChange('phq9', idx, opt.value)}
                              className={`py-1.5 px-2 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                                val === opt.value
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeMentalScale === 'gad7' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      GAD-7 廣泛性焦慮量表（過去兩週內出現頻率）
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      0–4分：情緒平穩 · 5–9分：輕度焦慮 · 10–14分：中度焦慮 · 15–21分：重度焦慮
                    </p>
                  </div>
                  <span className="text-sm font-mono font-bold tabular-nums text-teal-600 dark:text-teal-400 shrink-0">
                    {mentalEval.gad7Score} / 21 分
                  </span>
                </div>
                <div className="space-y-3">
                  {GAD7_QUESTIONS.map((qText, idx) => {
                    const val = mentalHealthScales.gad7?.[idx] ?? 0;
                    return (
                      <div
                        key={qText}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {qText}
                          </span>
                          <span className="text-xs font-mono tabular-nums text-teal-600 dark:text-teal-400 shrink-0">
                            {val} 分
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {FREQ_OPTIONS_0_TO_3.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleScaleItemChange('gad7', idx, opt.value)}
                              className={`py-1.5 px-2 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                                val === opt.value
                                  ? 'bg-teal-600 border-teal-600 text-white'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeMentalScale === 'bsrs5' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      BSRS-5 台灣衛福部簡式健康量表（心情溫度計 · 過去一週困擾程度）
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      0–5分：身心適應良好 · 6–9分：輕度情緒困擾 · 10–14分：中度情緒困擾 · 15–20分：重度情緒困擾
                    </p>
                  </div>
                  <span className="text-sm font-mono font-bold tabular-nums text-amber-600 dark:text-amber-400 shrink-0">
                    {mentalEval.bsrs5Score} / 20 分
                  </span>
                </div>
                <div className="space-y-3">
                  {BSRS5_QUESTIONS.map((qText, idx) => {
                    const val = mentalHealthScales.bsrs5?.[idx] ?? 0;
                    return (
                      <div
                        key={qText}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {qText}
                          </span>
                          <span className="text-xs font-mono tabular-nums text-amber-600 dark:text-amber-400 shrink-0">
                            {val} 分
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                          {SEVERITY_OPTIONS_0_TO_4.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleScaleItemChange('bsrs5', idx, opt.value)}
                              className={`py-1.5 px-2 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                                val === opt.value
                                  ? 'bg-amber-600 border-amber-600 text-white'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeMentalScale === 'pss6' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      PSS 感知壓力量表（過去一個月生活壓力與失控感頻率）
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      0–8分：低度感知壓力 · 9–15分：中度可控壓力 · 16–24分：高度感知壓力
                    </p>
                  </div>
                  <span className="text-sm font-mono font-bold tabular-nums text-rose-600 dark:text-rose-400 shrink-0">
                    {mentalEval.pssScore} / 24 分
                  </span>
                </div>
                <div className="space-y-3">
                  {PSS6_QUESTIONS.map((qText, idx) => {
                    const val = mentalHealthScales.pss6?.[idx] ?? 0;
                    return (
                      <div
                        key={qText}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {qText}
                          </span>
                          <span className="text-xs font-mono tabular-nums text-rose-600 dark:text-rose-400 shrink-0">
                            {val} 分
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                          {PSS_OPTIONS_0_TO_4.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleScaleItemChange('pss6', idx, opt.value)}
                              className={`py-1.5 px-2 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                                val === opt.value
                                  ? 'bg-rose-600 border-rose-600 text-white'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right 5 cols: 4-Scale Diagnostic Summary, Helpline Alert & Stress Sync */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Top Mental Wellness KPI Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    綜合心理健康韌性指數
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span
                      data-testid="mental-wellness-score"
                      className="text-3xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400"
                    >
                      {mentalEval.mentalWellnessScore}
                    </span>
                    <span className="text-xs font-mono text-slate-500">/ 100 分</span>
                  </div>
                </div>

                {onSyncStressToVitals && (
                  <button
                    type="button"
                    onClick={() => {
                      onSyncStressToVitals(mentalEval.recommendedPerceivedStress1To10);
                      setSyncNotice(
                        `已將主觀壓力等級 (${mentalEval.recommendedPerceivedStress1To10}/10) 同步至「心率與壓力分析」模組`
                      );
                      setTimeout(() => setSyncNotice(null), 3500);
                    }}
                    className="px-3 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    同步壓力至生理分析 ({mentalEval.recommendedPerceivedStress1To10}/10)
                  </button>
                )}
              </div>

              {syncNotice && (
                <p role="status" className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {syncNotice}
                </p>
              )}

              {/* Caring Helpline Banner if Item 9 > 0 or severe distress */}
              {(mentalEval.hasItem9Alert ||
                mentalEval.phq9Score >= 15 ||
                mentalEval.gad7Score >= 15 ||
                mentalEval.bsrs5Score >= 15) && (
                <div
                  role="alert"
                  className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-1.5"
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>心理健康支持與專業關懷提醒</span>
                  </div>
                  <p className="leading-relaxed">
                    量表顯示您近期承受較高的情緒困擾或心理負荷，請不要獨自承受。建議諮詢身心醫學科醫師、臨床心理師，或隨時撥打台灣 24 小時免付費心理支持專線：
                  </p>
                  <p className="font-mono font-semibold">
                    衛福部安心專線：1925（依舊愛我） · 生命線：1995 · 張老師：1980
                  </p>
                </div>
              )}

              {/* 4 Scale Breakdown Cards */}
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {mentalEval.scaleBreakdown.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveMentalScale(item.id)}
                    className={`p-3.5 transition-colors cursor-pointer ${
                      activeMentalScale === item.id
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/30'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </span>
                      <span className="text-xs font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {item.score} / {item.maxScore} 分
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span
                        className={`text-xs font-semibold ${
                          item.degree === '亟需改善'
                            ? 'text-rose-600 dark:text-rose-400'
                            : item.degree === '建議強化'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        判定：{item.level}（{item.degree}）
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {item.actionAdvice}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Personalized Daily Nutrition Macro Targets & Weekly Exercise Goal Setting */}
      <section
        aria-labelledby="nutrition-exercise-heading"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 id="nutrition-exercise-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              每日建議攝取營養素與每週運動目標設定
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              <span>目前 TDEE 基準：{formatMaskedNumber(tdee, masked, 'kcal/日')}</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>
                目標每日熱量：{formatMaskedNumber(plan.dailyCalories, masked, 'kcal')} (
                {plan.calorieDelta >= 0 ? `+${plan.calorieDelta}` : plan.calorieDelta} kcal)
              </span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>建議每日飲水量：{plan.dailyWaterMl} ml</span>
            </p>
          </div>

          {/* Goal Switcher */}
          <div
            role="group"
            aria-label="選擇個人健康目標"
            className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
          >
            {(
              [
                { id: 'lose', label: '減脂減重 (-450 kcal)' },
                { id: 'recomp', label: '增肌減脂體態重組 (-150 kcal)' },
                { id: 'maintain', label: '維持理想體態 (±0 kcal)' },
                { id: 'gain', label: '精實增肌 (+350 kcal)' },
              ] as { id: HealthGoal; label: string }[]
            ).map((g) => {
              const active = profile.goal === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onUpdateProfile({ goal: g.id })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 6 cols: Daily Macro & Micronutrient Prescription */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>三大營養素與微量營養每日攝取目標</span>
              </h3>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                總目標 {formatMaskedNumber(plan.dailyCalories, masked, 'kcal')}
              </span>
            </div>

            {/* Stacked Macro Ratio Bar */}
            <div>
              <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                <div
                  style={{ width: `${plan.macros.proteinPct}%` }}
                  className="bg-teal-600"
                  title={`蛋白質 ${plan.macros.proteinPct}%`}
                />
                <div
                  style={{ width: `${plan.macros.carbsPct}%` }}
                  className="bg-sky-500"
                  title={`碳水化合物 ${plan.macros.carbsPct}%`}
                />
                <div
                  style={{ width: `${plan.macros.fatPct}%` }}
                  className="bg-amber-500"
                  title={`健康脂肪 ${plan.macros.fatPct}%`}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mt-2 font-mono tabular-nums">
                <span>蛋白質 {plan.macros.proteinPct}% ({plan.macros.proteinGrams}g)</span>
                <span>複合碳水 {plan.macros.carbsPct}% ({plan.macros.carbsGrams}g)</span>
                <span>優質脂肪 {plan.macros.fatPct}% ({plan.macros.fatGrams}g)</span>
              </div>
            </div>

            {/* Clean Nutrient Data Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-3 font-medium">營養素項目</th>
                    <th className="py-2.5 px-3 font-medium text-right">每日目標克數</th>
                    <th className="py-2.5 px-3 font-medium text-right">熱量佔比</th>
                    <th className="py-2.5 px-3 font-medium">建議食物來源</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 tabular-nums">
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">優質蛋白質</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-teal-700 dark:text-teal-400">
                      {plan.macros.proteinGrams} g
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {plan.macros.proteinKcal} kcal ({plan.macros.proteinPct}%)
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">雞胸肉、鮭魚、無糖豆漿、雞蛋、希臘優格</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">低 GI 複合碳水</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-sky-700 dark:text-sky-400">
                      {plan.macros.carbsGrams} g
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {plan.macros.carbsKcal} kcal ({plan.macros.carbsPct}%)
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">糙米、地瓜、燕麥、藜麥、全麥雜糧</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">不飽和健康脂肪</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-700 dark:text-amber-400">
                      {plan.macros.fatGrams} g
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {plan.macros.fatKcal} kcal ({plan.macros.fatPct}%)
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">初榨橄欖油、酪梨、無調味堅果、深海魚油</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">膳食纖維 / 控糖控鈉</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                      ≥ {plan.macros.fiberGrams} g
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      精製糖 &lt; {plan.macros.maxSugarGrams}g
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      十字花科蔬菜、菇類；每日鈉 &lt; {plan.macros.maxSodiumMg} mg
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right 6 cols: Weekly Exercise Goal & Interactive Progress Tracker */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>每週運動處方與目標達成率追蹤</span>
              </h3>
              <button
                type="button"
                onClick={() => onUpdateExerciseProgress(0, 0, 0)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                重置本週進度
              </button>
            </div>

            <div className="space-y-4 pt-1">
              {/* 1. Weekly Cardio Mins */}
              <div className="pb-3.5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                    <Flame className="w-3.5 h-3.5 text-teal-600" />
                    <span>每週有氧心肺運動時數</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {exerciseCompletedMinsThisWeek} / {plan.exerciseGoals.weeklyCardioMins} 分鐘 ({cardioPct}%)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateExerciseProgress(
                          exerciseCompletedMinsThisWeek + 30,
                          strengthCompletedSessionsThisWeek,
                          stepsToday
                        )
                      }
                      className="px-2.5 py-1 text-xs font-medium bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 hover:bg-teal-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      + 紀錄 30 分鐘有氧
                    </button>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div style={{ width: `${cardioPct}%` }} className="h-full bg-teal-600 transition-all duration-200" />
                </div>
              </div>

              {/* 2. Weekly Strength Sessions */}
              <div className="pb-3.5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                    <Dumbbell className="w-3.5 h-3.5 text-indigo-600" />
                    <span>每週全身阻力肌力訓練次數</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {strengthCompletedSessionsThisWeek} / {plan.exerciseGoals.weeklyStrengthSessions} 次 ({strengthPct}%)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateExerciseProgress(
                          exerciseCompletedMinsThisWeek,
                          strengthCompletedSessionsThisWeek + 1,
                          stepsToday
                        )
                      }
                      className="px-2.5 py-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      + 完成 1 次肌力訓練
                    </button>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div style={{ width: `${strengthPct}%` }} className="h-full bg-indigo-600 transition-all duration-200" />
                </div>
              </div>

              {/* 3. Daily Steps Goal */}
              <div className="pb-3.5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                    <Footprints className="w-3.5 h-3.5 text-sky-600" />
                    <span>今日日常步行目標 (NEAT)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {stepsToday.toLocaleString()} / {plan.exerciseGoals.dailySteps.toLocaleString()} 步 ({stepsPct}%)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateExerciseProgress(
                          exerciseCompletedMinsThisWeek,
                          strengthCompletedSessionsThisWeek,
                          stepsToday + 1500
                        )
                      }
                      className="px-2.5 py-1 text-xs font-medium bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 hover:bg-sky-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      + 增加 1,500 步
                    </button>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div style={{ width: `${stepsPct}%` }} className="h-full bg-sky-600 transition-all duration-200" />
                </div>
              </div>
            </div>

            {/* Exercise Prescription Guide */}
            <div className="py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-teal-600" />
                <span>推薦運動組合：{plan.exerciseGoals.recommendedTypes.join(' · ')}</span>
              </div>
              <p className="leading-relaxed">
                <strong>運動強度指導：</strong>
                {plan.exerciseGoals.intensityGuide}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
