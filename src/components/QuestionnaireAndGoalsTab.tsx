import React from 'react';
import {
  HealthGoal,
  QuestionnaireAnswers,
  calculateBMI,
  calculateBMR,
  calculateNutritionAndExercisePlan,
  calculateTDEE,
  evaluateHealthQuestionnaire,
} from '../utils/healthCalculations';
import { UserProfile, formatMaskedNumber } from '../utils/storage';
import { CheckCircle2, AlertCircle, ArrowUpRight, Flame, Utensils, Dumbbell, Footprints } from 'lucide-react';

interface QuestionnaireAndGoalsTabProps {
  profile: UserProfile;
  onUpdateProfile: (partial: Partial<UserProfile>) => void;
  questionnaire: QuestionnaireAnswers;
  onUpdateQuestionnaire: (partial: Partial<QuestionnaireAnswers>) => void;
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

export const QuestionnaireAndGoalsTab: React.FC<QuestionnaireAndGoalsTabProps> = ({
  profile,
  onUpdateProfile,
  questionnaire,
  onUpdateQuestionnaire,
  exerciseCompletedMinsThisWeek,
  strengthCompletedSessionsThisWeek,
  stepsToday,
  onUpdateExerciseProgress,
  masked,
}) => {
  const bmi = calculateBMI(profile.heightCm, profile.weightKg);
  const bmr = calculateBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activityLevel);

  const evaluation = evaluateHealthQuestionnaire(questionnaire, bmi);
  const plan = calculateNutritionAndExercisePlan(tdee, profile.weightKg, bmi, profile.goal);

  const cardioPct = Math.min(100, Math.round((exerciseCompletedMinsThisWeek / plan.exerciseGoals.weeklyCardioMins) * 100));
  const strengthPct = Math.min(100, Math.round((strengthCompletedSessionsThisWeek / plan.exerciseGoals.weeklyStrengthSessions) * 100));
  const stepsPct = Math.min(100, Math.round((stepsToday / plan.exerciseGoals.dailySteps) * 100));

  return (
    <div className="space-y-6">
      {/* Section 1: Questionnaire Input & Diagnostic Evaluation Split */}
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

      {/* Section 2: Personalized Daily Nutrition Macro Targets & Weekly Exercise Goal Setting */}
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
