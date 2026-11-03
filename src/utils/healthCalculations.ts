export type Gender = 'male' | 'female';
export type BmiStandard = 'tw' | 'who';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
export type HealthGoal = 'lose' | 'maintain' | 'gain' | 'recomp';

export interface BmiClassification {
  category: 'underweight' | 'normal' | 'overweight' | 'obese1' | 'obese2' | 'obese3';
  label: string;
  rangeText: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  advice: string;
}

export interface IdealWeightRange {
  minKg: number;
  maxKg: number;
  targetKg: number;
  diffFromTargetKg: number;
}

export interface WhrAnalysis {
  whr: number;
  whtr: number; // Waist-to-Height Ratio (腰圍身高比, 標準 < 0.5)
  waistStatus: 'optimal' | 'borderline' | 'central_obesity';
  label: string;
  advice: string;
}

export interface BloodPressureAnalysis {
  category: 'normal' | 'elevated' | 'stage1' | 'stage2' | 'low';
  label: string;
  pulsePressure: number;
  map: number; // Mean Arterial Pressure
  advice: string;
}

export interface QuestionnaireAnswers {
  dietQuality: number;       // 0-15: 蔬果、全穀與原型食物比例
  sugarAndProcessed: number; // 0-10: 含糖飲料與超加工食品控制
  exerciseFreq: number;      // 0-15: 每週中高強度運動頻率
  sedentaryControl: number;  // 0-10: 久坐中斷與日常步數
  sleepRegularity: number;   // 0-15: 睡眠時數與作息規律度
  hydrationHabit: number;    // 0-10: 每日白開水攝取習慣
  stressResilience: number;  // 0-15: 壓力感受與情緒調適
  substanceControl: number;  // 0-10: 菸酒與夜間咖啡因控制
}

export interface ImprovementRecommendation {
  id: string;
  dimension: string;
  degree: '亟需改善' | '建議強化' | '維持良好';
  priorityScore: number;
  currentStatus: string;
  actionPlan: string;
  targetMetric: string;
}

export interface QuestionnaireEvaluation {
  totalScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  summaryTitle: string;
  summaryDescription: string;
  dimensionPercentages: {
    nutrition: number;
    activity: number;
    sleepAndWater: number;
    mentalAndHabits: number;
  };
  recommendations: ImprovementRecommendation[];
}

export interface NutritionAndExercisePlan {
  dailyCalories: number;
  calorieDelta: number;
  macros: {
    proteinGrams: number;
    proteinKcal: number;
    proteinPct: number;
    carbsGrams: number;
    carbsKcal: number;
    carbsPct: number;
    fatGrams: number;
    fatKcal: number;
    fatPct: number;
    fiberGrams: number;
    maxSugarGrams: number;
    maxSodiumMg: number;
  };
  dailyWaterMl: number;
  exerciseGoals: {
    weeklyCardioMins: number;
    weeklyStrengthSessions: number;
    dailySteps: number;
    sessionDurationMins: number;
    recommendedTypes: string[];
    intensityGuide: string;
  };
}

export interface SleepAnalysisResult {
  timeInBedHours: number;
  actualSleepHours: number;
  awakeLossMins: number;
  efficiencyPct: number;
  qualityScore: number;
  statusLabel: '優質修復' | '良好睡眠' | '輕度欠債' | '睡眠不足';
  advice: string;
}

export interface HeartRateZone {
  zone: number;
  name: string;
  intensityPct: string;
  minBpm: number;
  maxBpm: number;
  benefit: string;
}

export interface HeartRateAnalysis {
  maxHr: number;
  restingHr: number;
  heartRateReserve: number;
  fitnessLevel: '運動員級' | '極佳' | '良好' | '一般標準' | '需強化心肺';
  zones: HeartRateZone[];
}

export interface StressAnalysisResult {
  stressIndex: number; // 0-100
  level: '放鬆平衡' | '輕度負荷' | '中度緊繃' | '高度壓力';
  autonomicBalance: '副交感主導' | '交感與副交感平衡' | '交感神經偏亢' | '交感神經過度激活';
  recoveryAdvice: string[];
}

/**
 * Calculate BMI rounded to 1 decimal place.
 */
export function calculateBMI(heightCm: number, weightKg: number): number {
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg) || heightCm <= 30 || weightKg <= 5) {
    return 0;
  }
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

/**
 * Classify BMI according to Taiwan HPA (衛福部國健署) or WHO standard.
 */
export function classifyBMI(bmi: number, standard: BmiStandard = 'tw'): BmiClassification {
  if (bmi <= 0) {
    return {
      category: 'normal',
      label: '待輸入數據',
      rangeText: '-',
      riskLevel: 'low',
      advice: '請輸入有效的身高與體重以計算健康指標。',
    };
  }

  if (standard === 'tw') {
    if (bmi < 18.5) {
      return {
        category: 'underweight',
        label: '體重過輕',
        rangeText: 'BMI < 18.5',
        riskLevel: 'moderate',
        advice: '建議漸進增加每日熱量攝取（+300~400 kcal），提高優質蛋白質比例並配合肌力訓練以增加骨骼肌量。',
      };
    }
    if (bmi < 24.0) {
      return {
        category: 'normal',
        label: '正常範圍',
        rangeText: '18.5 ≤ BMI < 24.0',
        riskLevel: 'low',
        advice: '目前體位處於理想健康區間，請持續維持均衡飲食、規律作息與每週 150 分鐘以上中等強度運動。',
      };
    }
    if (bmi < 27.0) {
      return {
        category: 'overweight',
        label: '體重過重',
        rangeText: '24.0 ≤ BMI < 27.0',
        riskLevel: 'moderate',
        advice: '屬於代謝風險上升初期，建議每日創造 300~500 kcal 熱量赤字，減少精製糖並增加有氧與間歇訓練。',
      };
    }
    if (bmi < 30.0) {
      return {
        category: 'obese1',
        label: '輕度肥胖',
        rangeText: '27.0 ≤ BMI < 30.0',
        riskLevel: 'high',
        advice: '心血管與三高風險顯著提高，建議設定每週減重 0.5 kg 的階段目標，優先以原型食物取代加工食品。',
      };
    }
    if (bmi < 35.0) {
      return {
        category: 'obese2',
        label: '中度肥胖',
        rangeText: '30.0 ≤ BMI < 35.0',
        riskLevel: 'high',
        advice: '建議進行系統性飲食控制與低衝擊有氧運動（如快走、游泳、飛輪），保護下肢關節並定期監測血壓。',
      };
    }
    return {
      category: 'obese3',
      label: '重度肥胖',
      rangeText: 'BMI ≥ 35.0',
      riskLevel: 'critical',
      advice: '代謝症候群風險極高，建議結合專業醫療或營養師門診指導，採循序漸進的熱量控制與低負荷活動。',
    };
  } else {
    if (bmi < 18.5) {
      return {
        category: 'underweight',
        label: '體重過輕 (WHO)',
        rangeText: 'BMI < 18.5',
        riskLevel: 'moderate',
        advice: '低於 WHO 標準範圍，建議增加營養密度高的原型食物與阻力訓練。',
      };
    }
    if (bmi < 25.0) {
      return {
        category: 'normal',
        label: '標準體位 (WHO)',
        rangeText: '18.5 ≤ BMI < 25.0',
        riskLevel: 'low',
        advice: '符合 WHO 國際標準體位，建議持續追蹤腰臀比與腰身高比以確保內臟脂肪健康。',
      };
    }
    if (bmi < 30.0) {
      return {
        category: 'overweight',
        label: '體重過重 (WHO)',
        rangeText: '25.0 ≤ BMI < 30.0',
        riskLevel: 'moderate',
        advice: '高於 WHO 正常上限，建議控制每日總熱量並提升日常非運動性熱量消耗 (NEAT)。',
      };
    }
    if (bmi < 35.0) {
      return {
        category: 'obese1',
        label: '第一級肥胖 (WHO)',
        rangeText: '30.0 ≤ BMI < 35.0',
        riskLevel: 'high',
        advice: '建議執行結構化減脂計畫，結合高蛋白飲食與規律心肺訓練。',
      };
    }
    if (bmi < 40.0) {
      return {
        category: 'obese2',
        label: '第二級肥胖 (WHO)',
        rangeText: '35.0 ≤ BMI < 40.0',
        riskLevel: 'high',
        advice: '建議採低衝擊運動與嚴格飲食紀錄，並追蹤血壓與腰圍指標。',
      };
    }
    return {
      category: 'obese3',
      label: '第三級肥胖 (WHO)',
      rangeText: 'BMI ≥ 40.0',
      riskLevel: 'critical',
      advice: '建議尋求專科醫師與臨床營養師制定個人化醫療級減重計畫。',
    };
  }
}

/**
 * Calculate ideal weight range and target weight (BMI 22.0).
 */
export function calculateIdealWeightRange(
  heightCm: number,
  currentWeightKg: number,
  standard: BmiStandard = 'tw'
): IdealWeightRange {
  if (heightCm <= 30) {
    return { minKg: 0, maxKg: 0, targetKg: 0, diffFromTargetKg: 0 };
  }
  const heightM = heightCm / 100;
  const maxBmi = standard === 'tw' ? 23.9 : 24.9;
  const minKg = Math.round(18.5 * heightM * heightM * 10) / 10;
  const maxKg = Math.round(maxBmi * heightM * heightM * 10) / 10;
  const targetKg = Math.round(22.0 * heightM * heightM * 10) / 10;
  const diffFromTargetKg = Math.round((currentWeightKg - targetKg) * 10) / 10;
  return { minKg, maxKg, targetKg, diffFromTargetKg };
}

/**
 * Calculate BMR using the Mifflin-St Jeor Equation.
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender
): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 0;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === 'male' ? base + 5 : base - 161;
  return Math.max(800, Math.round(bmr));
}

/**
 * Calculate TDEE from BMR and activity level.
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    athlete: 1.9,
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.2));
}

/**
 * Calculate Waist-to-Hip Ratio (WHR) & Waist-to-Height Ratio (WHtR) for central obesity status.
 * Uses direct tape-measure anthropometric ratios instead of error-prone impedance guesses.
 */
export function calculateWHR(
  waistCm: number,
  hipCm: number,
  gender: Gender,
  heightCm = 170
): WhrAnalysis {
  if (waistCm <= 30 || hipCm <= 30) {
    return {
      whr: 0,
      whtr: 0,
      waistStatus: 'optimal',
      label: '待輸入腰臀圍',
      advice: '使用皮尺量測腰圍与臀圍即可精準計算腰臀比與腰身高比。',
    };
  }
  const whr = Math.round((waistCm / hipCm) * 100) / 100;
  const whtr = heightCm > 50 ? Math.round((waistCm / heightCm) * 100) / 100 : 0.45;
  const maxWaist = gender === 'male' ? 90 : 80;
  const maxWhr = gender === 'male' ? 0.9 : 0.85;

  if (waistCm >= maxWaist || whr >= maxWhr || whtr >= 0.53) {
    return {
      whr,
      whtr,
      waistStatus: 'central_obesity',
      label: '腹部肥胖風險偏高',
      advice: `腰圍 (${waistCm}cm)、腰臀比 (${whr}) 或腰身高比 (${whtr}) 超過國健署建議上限（男腰圍 <90cm/WHR <0.90、女 <80cm/WHR <0.85、腰身高比 <0.50），建議減少精製澱粉並增加有氧運動。`,
    };
  }
  if (waistCm >= maxWaist - 5 || whr >= maxWhr - 0.04 || whtr >= 0.49) {
    return {
      whr,
      whtr,
      waistStatus: 'borderline',
      label: '臨界注意區間',
      advice: `腰臀比 ${whr}、腰身高比 ${whtr} 接近 0.50 警戒值。建議維持規律飯後散步 15 分鐘並控制宵夜與含糖飲。`,
    };
  }
  return {
    whr,
    whtr,
    waistStatus: 'optimal',
    label: '理想腰臀比例',
    advice: `腰臀比 ${whr}、腰身高比 ${whtr} (<0.50) 與腰圍 ${waistCm}cm 皆處於健康理想範圍，內臟脂肪代謝風險低。`,
  };
}

/**
 * Evaluate Blood Pressure (Systolic / Diastolic mmHg).
 */
export function calculateBloodPressureStatus(systolic: number, diastolic: number): BloodPressureAnalysis {
  const pulsePressure = Math.max(0, systolic - diastolic);
  const map = Math.round(diastolic + pulsePressure / 3);

  if (systolic < 90 || diastolic < 60) {
    return {
      category: 'low',
      label: '血壓偏低',
      pulsePressure,
      map,
      advice: '血壓低於 90/60 mmHg，起身時請放慢速度避免姿勢性低血壓，並確保充足水分與電解質攝取。',
    };
  }
  if (systolic < 120 && diastolic < 80) {
    return {
      category: 'normal',
      label: '正常血壓 (<120/80)',
      pulsePressure,
      map,
      advice: '血管彈性與血壓控制良好，請持續維持低鈉飲食與規律運動。',
    };
  }
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
    return {
      category: 'elevated',
      label: '血壓偏高 (120-129/<80)',
      pulsePressure,
      map,
      advice: '處於高血壓前期，建議採行得舒飲食 (DASH Diet)，每日鈉攝取控制在 2000mg 以下。',
    };
  }
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return {
      category: 'stage1',
      label: '第一期高血壓 (≥130/80)',
      pulsePressure,
      map,
      advice: '符合 722 居家血壓標準之第一期高血壓範圍，建議連續早晚量測一週並與家庭醫師討論生活型態介入。',
    };
  }
  return {
    category: 'stage2',
    label: '第二期高血壓 (≥140/90)',
    pulsePressure,
    map,
    advice: '血壓明顯偏高，請避免高鹽飲食與熬夜，並建議儘速攜帶居家血壓紀錄諮詢專科醫師。',
  };
}

/**
 * Evaluate the comprehensive Health Questionnaire and produce actionable recommendations.
 */
export function evaluateHealthQuestionnaire(
  answers: QuestionnaireAnswers,
  bmi: number
): QuestionnaireEvaluation {
  const rawScore =
    answers.dietQuality +
    answers.sugarAndProcessed +
    answers.exerciseFreq +
    answers.sedentaryControl +
    answers.sleepRegularity +
    answers.hydrationHabit +
    answers.stressResilience +
    answers.substanceControl;

  let bmiModifier = 0;
  if (bmi >= 18.5 && bmi < 24.0) bmiModifier = 2;
  else if (bmi >= 27.0 || (bmi > 0 && bmi < 17.5)) bmiModifier = -4;
  else if (bmi >= 24.0) bmiModifier = -2;

  const totalScore = Math.max(0, Math.min(100, Math.round(rawScore + bmiModifier)));

  let grade: QuestionnaireEvaluation['grade'] = 'C';
  let summaryTitle = '亞健康警示狀態，需系統性調整';
  let summaryDescription = '多項生活型態指標存在代謝或慢性疲勞風險，請優先針對下方標示「亟需改善」的項目執行微習慣調整。';

  if (totalScore >= 90) {
    grade = 'A+';
    summaryTitle = '卓越健康典範，自律機能極佳';
    summaryDescription = '您的飲食、運動、睡眠與壓力管理皆處於高水準狀態，身體代謝與抗壓韌性極佳。';
  } else if (totalScore >= 80) {
    grade = 'A';
    summaryTitle = '健康狀況良好，生活型態穩健';
    summaryDescription = '核心健康習慣已建立良好基礎，僅需針對少數次要指標微調即可達到最佳生理狀態。';
  } else if (totalScore >= 68) {
    grade = 'B';
    summaryTitle = '中等健康水準，具提升潛力';
    summaryDescription = '基本生理機能穩定，但部分生活習慣（如久坐、飲水或作息）仍有優化空間。';
  } else if (totalScore < 55) {
    grade = 'D';
    summaryTitle = '高風險生活型態，建議立即介入改善';
    summaryDescription = '目前作息、運動或飲食結構長期處於透支狀態，建議從最容易達成的飲水與睡眠規律開始逐步重建。';
  }

  const nutritionPct = Math.round(((answers.dietQuality + answers.sugarAndProcessed) / 25) * 100);
  const activityPct = Math.round(((answers.exerciseFreq + answers.sedentaryControl) / 25) * 100);
  const sleepAndWaterPct = Math.round(((answers.sleepRegularity + answers.hydrationHabit) / 25) * 100);
  const mentalAndHabitsPct = Math.round(((answers.stressResilience + answers.substanceControl) / 25) * 100);

  const recommendations: ImprovementRecommendation[] = [];

  if (nutritionPct < 60) {
    recommendations.push({
      id: 'rec-nutrition',
      dimension: '膳食結構與控糖',
      degree: '亟需改善',
      priorityScore: 100 - nutritionPct,
      currentStatus: `營養維度得分率僅 ${nutritionPct}%，外食精緻澱粉或含糖飲比例偏高`,
      actionPlan: '採用「211 餐盤法」（每餐 2 份蔬菜、1 份優質蛋白質、1 份全穀雜糧），並將手搖含糖飲改為無糖茶或氣泡水。',
      targetMetric: '每日蔬菜 ≥ 3 拳頭、精製糖 < 總熱量 5%',
    });
  } else if (nutritionPct < 85) {
    recommendations.push({
      id: 'rec-nutrition',
      dimension: '膳食結構與控糖',
      degree: '建議強化',
      priorityScore: 100 - nutritionPct,
      currentStatus: `營養維度得分率 ${nutritionPct}%，基礎飲食尚可但微量營養素可再提升`,
      actionPlan: '增加深色蔬菜、堅果種子與 Omega-3 脂肪酸（如深海魚、亞麻仁籽）攝取頻率。',
      targetMetric: '每週攝取深海魚或植物性 Omega-3 達 3 次以上',
    });
  } else {
    recommendations.push({
      id: 'rec-nutrition',
      dimension: '膳食結構與控糖',
      degree: '維持良好',
      priorityScore: 100 - nutritionPct,
      currentStatus: `營養維度得分率達 ${nutritionPct}%，原型食物與控糖習慣優異`,
      actionPlan: '持續保持多樣化彩虹蔬果與足量蛋白質攝取，依運動量靈活調整碳水化合物比例。',
      targetMetric: '維持每日膳食纖維 25~30g',
    });
  }

  if (activityPct < 60) {
    recommendations.push({
      id: 'rec-activity',
      dimension: '體能活動與抗久坐',
      degree: '亟需改善',
      priorityScore: 100 - activityPct,
      currentStatus: `活動維度得分率僅 ${activityPct}%，運動量不足且久坐時間過長`,
      actionPlan: '設定每久坐 50 分鐘起身活動 5 分鐘；每週安排 3 次每次 30 分鐘的 Zone 2 快走或超慢跑。',
      targetMetric: '每週中高強度運動 ≥ 150 分鐘、日行 ≥ 7,500 步',
    });
  } else if (activityPct < 85) {
    recommendations.push({
      id: 'rec-activity',
      dimension: '體能活動與抗久坐',
      degree: '建議強化',
      priorityScore: 100 - activityPct,
      currentStatus: `活動維度得分率 ${activityPct}%，具基礎活動量但肌力或心肺刺激可加強`,
      actionPlan: '在有氧運動外，每週加入 2 次大肌群阻力訓練（深蹲、推舉、划船），提升基礎代謝率與胰島素敏感度。',
      targetMetric: '每週 150 分鐘有氧 + 2 次全身肌力訓練',
    });
  } else {
    recommendations.push({
      id: 'rec-activity',
      dimension: '體能活動與抗久坐',
      degree: '維持良好',
      priorityScore: 100 - activityPct,
      currentStatus: `活動維度得分率達 ${activityPct}%，運動習慣與日常活動量極佳`,
      actionPlan: '注意訓練週期化與運動後筋膜放鬆、伸展恢復，避免過度訓練造成皮質醇升高。',
      targetMetric: '維持每週心肺與肌力平衡訓練並安排主動恢復日',
    });
  }

  if (sleepAndWaterPct < 60) {
    recommendations.push({
      id: 'rec-sleep-water',
      dimension: '睡眠修復與水分代謝',
      degree: '亟需改善',
      priorityScore: 100 - sleepAndWaterPct,
      currentStatus: `修復與水分得分率僅 ${sleepAndWaterPct}%，睡眠債或慢性輕微脫水影響代謝`,
      actionPlan: '固定每日起床時間（週末誤差不超過 1 小時），睡前 60 分鐘停用藍光螢幕；使用定時飲水提醒分次補充白開水。',
      targetMetric: '每晚睡滿 7~8 小時、每日飲水達體重 × 35 ml',
    });
  } else if (sleepAndWaterPct < 85) {
    recommendations.push({
      id: 'rec-sleep-water',
      dimension: '睡眠修復與水分代謝',
      degree: '建議強化',
      priorityScore: 100 - sleepAndWaterPct,
      currentStatus: `修復與水分得分率 ${sleepAndWaterPct}%，作息大致穩定但入睡效率或飲水均勻度可優化`,
      actionPlan: '下午 2 點後避免攝取咖啡因，睡前可進行溫水泡腳，並於晨起空腹先喝 300ml 溫開水。',
      targetMetric: '睡眠效率 ≥ 85%、日間每 2 小時補水 250~300 ml',
    });
  } else {
    recommendations.push({
      id: 'rec-sleep-water',
      dimension: '睡眠修復與水分代謝',
      degree: '維持良好',
      priorityScore: 100 - sleepAndWaterPct,
      currentStatus: `修復與水分得分率達 ${sleepAndWaterPct}%，晝夜節律與水合狀態理想`,
      actionPlan: '持續保持規律睡眠與分段補水習慣，運動流汗時適度補充電解質。',
      targetMetric: '維持睡眠效率 ≥ 90% 與全天充足水合',
    });
  }

  if (mentalAndHabitsPct < 60) {
    recommendations.push({
      id: 'rec-mental',
      dimension: '自律神經與壓力調適',
      degree: '亟需改善',
      priorityScore: 100 - mentalAndHabitsPct,
      currentStatus: `身心平衡得分率僅 ${mentalAndHabitsPct}%，壓力荷爾蒙偏高易導致內臟脂肪囤積`,
      actionPlan: '每日早晚執行 5 分鐘「4-7-8 腹式呼吸訓練」刺激迷走神經，減少酒精或尼古丁依賴。',
      targetMetric: '每日正念呼吸 10 分鐘、壓力指數降至 45 以下',
    });
  } else if (mentalAndHabitsPct < 85) {
    recommendations.push({
      id: 'rec-mental',
      dimension: '自律神經與壓力調適',
      degree: '建議強化',
      priorityScore: 100 - mentalAndHabitsPct,
      currentStatus: `身心平衡得分率 ${mentalAndHabitsPct}%，偶有工作緊繃或晚間刺激物攝取`,
      actionPlan: '建立下班後的情緒轉換儀式（如散步、冥想、閱讀），幫助交感神經平緩切換至副交感修復模式。',
      targetMetric: '靜息心率維持穩定、睡前完全脫離工作訊息',
    });
  } else {
    recommendations.push({
      id: 'rec-mental',
      dimension: '自律神經與壓力調適',
      degree: '維持良好',
      priorityScore: 100 - mentalAndHabitsPct,
      currentStatus: `身心平衡得分率達 ${mentalAndHabitsPct}%，情緒韌性與自律習慣極佳`,
      actionPlan: '持續透過呼吸練習、大自然接觸與正向社交維持自律神經平衡。',
      targetMetric: '維持壓力指數 < 35 之平衡區間',
    });
  }

  recommendations.sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    totalScore,
    grade,
    summaryTitle,
    summaryDescription,
    dimensionPercentages: {
      nutrition: nutritionPct,
      activity: activityPct,
      sleepAndWater: sleepAndWaterPct,
      mentalAndHabits: mentalAndHabitsPct,
    },
    recommendations,
  };
}

/**
 * Calculate personalized daily nutrition macros and weekly exercise plan.
 */
export function calculateNutritionAndExercisePlan(
  tdee: number,
  weightKg: number,
  bmi: number,
  goal: HealthGoal
): NutritionAndExercisePlan {
  const safeTdee = Math.max(1200, tdee || 2000);
  const safeWeight = Math.max(35, weightKg || 65);

  let calorieDelta = 0;
  let proteinRatio = 0.25;
  let carbsRatio = 0.45;
  let fatRatio = 0.30;

  if (goal === 'lose') {
    calorieDelta = -450;
    proteinRatio = 0.32;
    carbsRatio = 0.40;
    fatRatio = 0.28;
  } else if (goal === 'gain') {
    calorieDelta = 350;
    proteinRatio = 0.25;
    carbsRatio = 0.50;
    fatRatio = 0.25;
  } else if (goal === 'recomp') {
    calorieDelta = -150;
    proteinRatio = 0.35;
    carbsRatio = 0.40;
    fatRatio = 0.25;
  }

  const dailyCalories = Math.max(1200, Math.round(safeTdee + calorieDelta));
  const proteinKcal = Math.round(dailyCalories * proteinRatio);
  const carbsKcal = Math.round(dailyCalories * carbsRatio);
  const fatKcal = Math.round(dailyCalories * fatRatio);

  const proteinGrams = Math.round(proteinKcal / 4);
  const carbsGrams = Math.round(carbsKcal / 4);
  const fatGrams = Math.round(fatKcal / 9);
  const fiberGrams = Math.max(25, Math.round((dailyCalories / 1000) * 14));
  const maxSugarGrams = Math.round((dailyCalories * 0.05) / 4);
  const maxSodiumMg = 2000;

  const dailyWaterMl = Math.round((safeWeight * 35 + (goal === 'lose' || goal === 'recomp' ? 300 : 150)) / 50) * 50;

  let weeklyCardioMins = 150;
  let weeklyStrengthSessions = 2;
  let dailySteps = 8000;
  let recommendedTypes = ['Zone 2 快走 / 慢跑', '全身大肌群阻力訓練', '核心穩定與活動度伸展'];
  let intensityGuide = '中等強度（運動時微喘但仍可完整對話，心率維持於最大心率 60%~75%）';

  if (goal === 'lose') {
    weeklyCardioMins = 210;
    weeklyStrengthSessions = 3;
    dailySteps = 10000;
    recommendedTypes = ['Zone 2 燃脂有氧 (快走/飛輪/游泳)', '複合動作肌力訓練 (保留肌肉量)', '間歇性高強度代謝訓練 (HIIT)'];
    intensityGuide = '以 Zone 2 燃脂區間為主（每次 40~45 分鐘），搭配每週 3 次肌力訓練防止基礎代謝下降。';
  } else if (goal === 'gain') {
    weeklyCardioMins = 90;
    weeklyStrengthSessions = 4;
    dailySteps = 7500;
    recommendedTypes = ['漸進式超負荷阻力訓練 (上下肢分化)', '短時間心肺耐力維持', '訓練後筋膜放鬆與動態伸展'];
    intensityGuide = '以肌肥大與力量訓練為主（每組 8~12 下，RPE 7.5~8.5），有氧控制在每次 20~30 分鐘內。';
  } else if (goal === 'recomp') {
    weeklyCardioMins = 160;
    weeklyStrengthSessions = 4;
    dailySteps = 9000;
    recommendedTypes = ['全身複合肌力訓練 (深蹲/硬舉/推拉)', '重訓後 20 分鐘坡度健走', '核心抗旋轉訓練'];
    intensityGuide = '結合高蛋白攝取與高頻率阻力訓練，於重訓後銜接 20 分鐘低衝擊有氧以最大化體態重組。';
  }

  if (bmi >= 30) {
    recommendedTypes = ['水中健走 / 游泳 (零關節衝擊)', '坐姿飛輪 / 橢圓機有氧', '彈力帶與徒手坐姿肌力訓練'];
    intensityGuide = '優先保護膝踝關節，採用低衝擊器械與水中運動，將心率控制在 Zone 1~2 舒適燃脂區間。';
  }

  return {
    dailyCalories,
    calorieDelta,
    macros: {
      proteinGrams,
      proteinKcal,
      proteinPct: Math.round(proteinRatio * 100),
      carbsGrams,
      carbsKcal,
      carbsPct: Math.round(carbsRatio * 100),
      fatGrams,
      fatKcal,
      fatPct: Math.round(fatRatio * 100),
      fiberGrams,
      maxSugarGrams,
      maxSodiumMg,
    },
    dailyWaterMl,
    exerciseGoals: {
      weeklyCardioMins,
      weeklyStrengthSessions,
      dailySteps,
      sessionDurationMins: Math.round(weeklyCardioMins / 4),
      recommendedTypes,
      intensityGuide,
    },
  };
}

/**
 * Analyze sleep efficiency using observable metrics (bedtime, wakeTime, latencyMins, awakeningsCount, refreshmentRating 1-5).
 * Removes inaccurate manual guessing of Deep/REM sleep percentages.
 */
export function calculateSleepEfficiency(
  bedtime: string,
  wakeTime: string,
  sleepLatencyMins: number,
  awakeningsCount: number,
  refreshmentRating = 4 // 1 to 5 subjective morning refreshment
): SleepAnalysisResult {
  const parseTime = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return 0;
    return h * 60 + m;
  };

  const bedMins = parseTime(bedtime);
  let wakeMins = parseTime(wakeTime);
  if (wakeMins <= bedMins) {
    wakeMins += 24 * 60;
  }

  const totalBedMins = Math.max(60, wakeMins - bedMins);
  const awakeLossMins = Math.max(0, sleepLatencyMins) + Math.max(0, awakeningsCount) * 12;
  const actualSleepMins = Math.max(30, totalBedMins - awakeLossMins);

  const timeInBedHours = Math.round((totalBedMins / 60) * 10) / 10;
  const actualSleepHours = Math.round((actualSleepMins / 60) * 10) / 10;
  const efficiencyPct = Math.min(100, Math.round((actualSleepMins / totalBedMins) * 100));

  // Duration score (ideal 7.0 - 8.5 hrs -> 40 pts)
  let durationScore = 40;
  if (actualSleepHours < 7.0) {
    durationScore = Math.max(10, Math.round(40 - (7.0 - actualSleepHours) * 12));
  } else if (actualSleepHours > 9.0) {
    durationScore = Math.max(25, Math.round(40 - (actualSleepHours - 9.0) * 6));
  }

  // Efficiency score (ideal >= 85% -> 35 pts)
  const effScore = Math.min(35, Math.max(5, Math.round(((efficiencyPct - 60) / 35) * 35)));

  // Morning refreshment score (1-5 -> 5 to 25 pts)
  const clampedRefreshment = Math.max(1, Math.min(5, refreshmentRating));
  const refreshScore = clampedRefreshment * 5;

  const qualityScore = Math.min(100, Math.max(15, durationScore + effScore + refreshScore));

  let statusLabel: SleepAnalysisResult['statusLabel'] = '良好睡眠';
  let advice = '睡眠效率與時數穩定，請持續保持固定起床時間以鞏固生理時鐘。';

  if (qualityScore >= 86) {
    statusLabel = '優質修復';
    advice = '睡眠連續性與晨起恢復感極佳，身體代謝與認知機能處於理想狀態。';
  } else if (qualityScore < 60 || actualSleepHours < 6.0) {
    statusLabel = '睡眠不足';
    advice = '實際睡眠時數或效率偏低，易導致瘦體素下降、飢餓素上升，建議今晚提早 45 分鐘進行睡前減光儀式。';
  } else if (qualityScore < 74) {
    statusLabel = '輕度欠債';
    advice = '入睡耗時或夜醒次數略影響睡眠連續性，建議睡前 2 小時減少液體攝取並調降臥室溫度至 20~22°C。';
  }

  return {
    timeInBedHours,
    actualSleepHours,
    awakeLossMins,
    efficiencyPct,
    qualityScore,
    statusLabel,
    advice,
  };
}

/**
 * Standard clinical 15-second pulse multiplier (15秒脈搏數 × 4 = 每分鐘心率 bpm).
 */
export function calculateBpmFrom15SecCount(pulseCount15Sec: number): number {
  if (!Number.isFinite(pulseCount15Sec) || pulseCount15Sec <= 5) return 0;
  return Math.min(220, Math.max(35, Math.round(pulseCount15Sec * 4)));
}

/**
 * Calculate Karvonen Heart Rate Zones and Cardiovascular Fitness Level.
 */
export function calculateHeartRateZones(age: number, restingHr: number): HeartRateAnalysis {
  const safeAge = Math.max(10, Math.min(100, age || 30));
  const safeRhr = Math.max(38, Math.min(120, restingHr || 68));
  const maxHr = Math.round(208 - 0.7 * safeAge);
  const hrr = Math.max(40, maxHr - safeRhr);

  const calcBpm = (pct: number) => Math.round(safeRhr + hrr * pct);

  let fitnessLevel: HeartRateAnalysis['fitnessLevel'] = '一般標準';
  if (safeRhr <= 52) fitnessLevel = '運動員級';
  else if (safeRhr <= 60) fitnessLevel = '極佳';
  else if (safeRhr <= 68) fitnessLevel = '良好';
  else if (safeRhr > 78) fitnessLevel = '需強化心肺';

  const zones: HeartRateZone[] = [
    {
      zone: 1,
      name: 'Zone 1 動態恢復區',
      intensityPct: '50% - 60%',
      minBpm: calcBpm(0.50),
      maxBpm: calcBpm(0.60),
      benefit: '促進血液循環、加速乳酸代謝與運動後主動恢復',
    },
    {
      zone: 2,
      name: 'Zone 2 有氧燃脂區',
      intensityPct: '60% - 70%',
      minBpm: calcBpm(0.60),
      maxBpm: calcBpm(0.70),
      benefit: '強化粒線體密度與脂肪氧化效率，建立基礎耐力',
    },
    {
      zone: 3,
      name: 'Zone 3 心肺耐力區',
      intensityPct: '70% - 80%',
      minBpm: calcBpm(0.70),
      maxBpm: calcBpm(0.80),
      benefit: '提升心搏輸出量、肺活量與有氧耐力表現',
    },
    {
      zone: 4,
      name: 'Zone 4 無氧閾值區',
      intensityPct: '80% - 90%',
      minBpm: calcBpm(0.80),
      maxBpm: calcBpm(0.90),
      benefit: '提高乳酸耐受閾值與高強度持續運動能力',
    },
    {
      zone: 5,
      name: 'Zone 5 最大攝氧極限區',
      intensityPct: '90% - 100%',
      minBpm: calcBpm(0.90),
      maxBpm: maxHr,
      benefit: '刺激最大攝氧量 (VO2 Max) 與爆發力，僅適合短間歇衝刺',
    },
  ];

  return {
    maxHr,
    restingHr: safeRhr,
    heartRateReserve: hrr,
    fitnessLevel,
    zones,
  };
}

/**
 * Analyze autonomic stress index from concrete physiological & lifestyle inputs.
 */
export function calculateStressIndex(params: {
  restingHr: number;
  baselineHr: number;
  sleepHours: number;
  perceivedStress: number; // 1 - 10
  caffeineCups: number;
  workHours: number;
}): StressAnalysisResult {
  const hrDelta = Math.max(-10, params.restingHr - params.baselineHr);
  const hrStress = Math.max(0, hrDelta * 2.5);
  const sleepDeficitStress = Math.max(0, (7.5 - params.sleepHours) * 7);
  const subjectiveStress = Math.max(1, Math.min(10, params.perceivedStress)) * 5.2;
  const caffeineStress = Math.max(0, (params.caffeineCups - 1) * 4);
  const workStress = Math.max(0, (params.workHours - 8) * 2.5);

  const rawStress = 12 + hrStress + sleepDeficitStress + subjectiveStress + caffeineStress + workStress;
  const stressIndex = Math.max(8, Math.min(98, Math.round(rawStress)));

  if (stressIndex <= 35) {
    return {
      stressIndex,
      level: '放鬆平衡',
      autonomicBalance: '交感與副交感平衡',
      recoveryAdvice: [
        '身心負荷處於理想平衡狀態，適合安排中高強度訓練或專注度高的工作。',
        '持續保持規律水合與睡眠節律以維持穩定靜息心率。',
      ],
    };
  }
  if (stressIndex <= 58) {
    return {
      stressIndex,
      level: '輕度負荷',
      autonomicBalance: '交感與副交感平衡',
      recoveryAdvice: [
        '生理與心理承受正常日常負荷，建議工作每 90 分鐘進行 3 分鐘遠眺與肩頸放鬆。',
        '今日運動建議以 Zone 2 有氧或中等強度重訓為主，避免過度力竭。',
      ],
    };
  }
  if (stressIndex <= 76) {
    return {
      stressIndex,
      level: '中度緊繃',
      autonomicBalance: '交感神經偏亢',
      recoveryAdvice: [
        '交感神經張力偏高，靜息心率較基準上升或睡眠修復不足。',
        '建議立即執行下方「4-7-8 呼吸減壓訓練」3~4 個循環，並減少午後咖啡因攝取。',
      ],
    };
  }
  return {
    stressIndex,
    level: '高度壓力',
    autonomicBalance: '交感神經過度激活',
    recoveryAdvice: [
      '身體處於高度壓力與疲勞累積狀態，今日應避免高強度間歇訓練 (HIIT)，改以散步或伸展取代。',
      '請優先補充水分與富含鎂的食物（深綠色蔬菜、堅果），並提早 1 小時就寢幫助副交感神經修復。',
    ],
  };
}
