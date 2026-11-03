import {
  ActivityLevel,
  BmiStandard,
  Gender,
  HealthGoal,
  QuestionnaireAnswers,
  calculateBMI,
} from './healthCalculations';

export type DeploymentTarget = 'self-hosted' | 'github-pages';

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  waistCm: number;
  hipCm: number;
  systolicBp: number;
  diastolicBp: number;
  activityLevel: ActivityLevel;
  goal: HealthGoal;
  bmiStandard: BmiStandard;
}

export interface HealthHistoryRecord {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  bmi: number;
  waistCm: number;
  sleepHours: number;
  sleepQualityScore: number;
  waterMl: number;
  restingHr: number;
  stressIndex: number;
  systolicBp: number;
  diastolicBp: number;
  note: string;
}

export interface WaterIntakeEntry {
  id: string;
  time: string; // HH:mm
  amountMl: number;
  beverageType: '白開水' | '無糖綠茶' | '氣泡水' | '運動電解質飲' | '黑咖啡';
}

export interface SleepLogEntry {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  latencyMins: number;
  awakenings: number;
  refreshmentRating: number; // 1 to 5 subjective morning refreshment
  actualHours: number;
  efficiencyPct: number;
  qualityScore: number;
  note: string;
}

export interface PrivacySettings {
  deploymentTarget: DeploymentTarget; // 'github-pages' (鎖定演示與防關閉) | 'self-hosted' (可自由關閉演示與防關閉)
  demoModeEnabled: boolean;           // 演示模式開關 (GitHub 部署時強制開啟不可關閉；自架部署可關閉)
  maskSensitiveNumbers: boolean;
  pinEnabled: boolean;
  pinCode: string;
  preventAccidentalClose: boolean;    // 防止誤關分頁/視窗保護 (GitHub 部署時強制開啟；自架部署可自由關閉)
  requirePinToDisable: boolean;       // 防止未授權關閉安全鎖
  autoBackupReminder: boolean;
  lastBackupAt: string | null;
}

export interface VitaPulseState {
  profile: UserProfile;
  questionnaire: QuestionnaireAnswers;
  history: HealthHistoryRecord[];
  waterLogsToday: WaterIntakeEntry[];
  waterReminderIntervalMins: number;
  waterReminderEnabled: boolean;
  sleepLogs: SleepLogEntry[];
  privacy: PrivacySettings;
  exerciseCompletedMinsThisWeek: number;
  strengthCompletedSessionsThisWeek: number;
  stepsToday: number;
}

export const STORAGE_KEY = 'vitapulse_health_steward_v2';

/**
 * Returns true if the build/domain environment strictly forces GitHub Demo mode
 * (*.github.io domain or VITE_GITHUB_DEMO="true").
 */
export function isEnvForcedGitHubDemo(): boolean {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GITHUB_DEMO === 'true') {
      return true;
    }
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io')) {
      return true;
    }
  } catch {
    // Ignore env read errors
  }
  return false;
}

/**
 * Detect initial deployment target. Defaults to 'github-pages' (Demo Lock ON) unless
 * VITE_GITHUB_DEMO="false" is explicitly set for self-hosted builds.
 */
export function detectInitialDeploymentTarget(): DeploymentTarget {
  try {
    if (isEnvForcedGitHubDemo()) {
      return 'github-pages';
    }
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GITHUB_DEMO === 'false') {
      return 'self-hosted';
    }
  } catch {
    // Ignore env read errors
  }
  return 'github-pages';
}

/**
 * Returns true if the app is running in GitHub Demo Lock mode (where Demo Mode cannot be disabled).
 */
export function isGitHubDemoLocked(privacy: PrivacySettings): boolean {
  return isEnvForcedGitHubDemo() || privacy.deploymentTarget === 'github-pages';
}

/**
 * Returns true if the Prevent-Close (beforeunload) button is locked ON and cannot be turned off.
 * Whenever GitHub Demo Lock is active OR Demo Mode (演示模式) is ON, Prevent-Close is locked ON.
 * Only when in Self-Hosted mode AND Demo Mode is turned OFF (or unlocked in Self-Hosted mode) can Prevent-Close be turned off.
 */
export function isPreventCloseLocked(privacy: PrivacySettings): boolean {
  return isGitHubDemoLocked(privacy) || privacy.demoModeEnabled;
}

export const DEFAULT_SEED_STATE: VitaPulseState = {
  profile: {
    name: '林宥辰 (個人健康檔案)',
    age: 31,
    gender: 'male',
    heightCm: 175,
    weightKg: 68.4,
    waistCm: 79,
    hipCm: 96,
    systolicBp: 118,
    diastolicBp: 75,
    activityLevel: 'moderate',
    goal: 'recomp',
    bmiStandard: 'tw',
  },
  questionnaire: {
    dietQuality: 12,
    sugarAndProcessed: 8,
    exerciseFreq: 11,
    sedentaryControl: 6,
    sleepRegularity: 11,
    hydrationHabit: 8,
    stressResilience: 10,
    substanceControl: 9,
  },
  history: [
    {
      id: 'h-10',
      date: '2026-10-06',
      weightKg: 70.8,
      bmi: 23.1,
      waistCm: 82.0,
      sleepHours: 6.5,
      sleepQualityScore: 72,
      waterMl: 1950,
      restingHr: 67,
      stressIndex: 56,
      systolicBp: 124,
      diastolicBp: 80,
      note: '專案初期熬夜，外食比例高',
    },
    {
      id: 'h-9',
      date: '2026-10-09',
      weightKg: 70.4,
      bmi: 23.0,
      waistCm: 81.5,
      sleepHours: 6.8,
      sleepQualityScore: 75,
      waterMl: 2100,
      restingHr: 66,
      stressIndex: 52,
      systolicBp: 122,
      diastolicBp: 79,
      note: '開始實施 211 餐盤與戒含糖飲',
    },
    {
      id: 'h-8',
      date: '2026-10-12',
      weightKg: 70.1,
      bmi: 22.9,
      waistCm: 81.0,
      sleepHours: 7.2,
      sleepQualityScore: 80,
      waterMl: 2350,
      restingHr: 65,
      stressIndex: 47,
      systolicBp: 121,
      diastolicBp: 78,
      note: '完成 40 分鐘 Zone 2 慢跑',
    },
    {
      id: 'h-7',
      date: '2026-10-15',
      weightKg: 69.8,
      bmi: 22.8,
      waistCm: 80.5,
      sleepHours: 7.4,
      sleepQualityScore: 82,
      waterMl: 2400,
      restingHr: 64,
      stressIndex: 44,
      systolicBp: 120,
      diastolicBp: 77,
      note: '全身阻力訓練 + 充足飲水',
    },
    {
      id: 'h-6',
      date: '2026-10-18',
      weightKg: 69.5,
      bmi: 22.7,
      waistCm: 80.2,
      sleepHours: 7.1,
      sleepQualityScore: 79,
      waterMl: 2250,
      restingHr: 64,
      stressIndex: 46,
      systolicBp: 119,
      diastolicBp: 76,
      note: '週末登山健行 8 公里',
    },
    {
      id: 'h-5',
      date: '2026-10-21',
      weightKg: 69.2,
      bmi: 22.6,
      waistCm: 79.8,
      sleepHours: 7.6,
      sleepQualityScore: 85,
      waterMl: 2550,
      restingHr: 63,
      stressIndex: 39,
      systolicBp: 119,
      diastolicBp: 76,
      note: '睡眠連續性提升，晨間精神佳',
    },
    {
      id: 'h-4',
      date: '2026-10-24',
      weightKg: 69.0,
      bmi: 22.5,
      waistCm: 79.5,
      sleepHours: 7.5,
      sleepQualityScore: 84,
      waterMl: 2500,
      restingHr: 62,
      stressIndex: 38,
      systolicBp: 118,
      diastolicBp: 75,
      note: '上肢肌力訓練 + 核心穩定',
    },
    {
      id: 'h-3',
      date: '2026-10-27',
      weightKg: 68.7,
      bmi: 22.4,
      waistCm: 79.3,
      sleepHours: 7.8,
      sleepQualityScore: 88,
      waterMl: 2650,
      restingHr: 61,
      stressIndex: 34,
      systolicBp: 117,
      diastolicBp: 75,
      note: '規律執行 4-7-8 睡前呼吸',
    },
    {
      id: 'h-2',
      date: '2026-10-30',
      weightKg: 68.6,
      bmi: 22.4,
      waistCm: 79.1,
      sleepHours: 7.6,
      sleepQualityScore: 86,
      waterMl: 2600,
      restingHr: 61,
      stressIndex: 35,
      systolicBp: 118,
      diastolicBp: 74,
      note: '下肢深蹲訓練 + 20 分鐘飛輪',
    },
    {
      id: 'h-1',
      date: '2026-11-02',
      weightKg: 68.4,
      bmi: 22.3,
      waistCm: 79.0,
      sleepHours: 7.7,
      sleepQualityScore: 87,
      waterMl: 1850,
      restingHr: 60,
      stressIndex: 32,
      systolicBp: 118,
      diastolicBp: 75,
      note: '今日晨間量測，體態持續穩定優化',
    },
  ],
  waterLogsToday: [
    { id: 'w-1', time: '07:30', amountMl: 350, beverageType: '白開水' },
    { id: 'w-2', time: '09:45', amountMl: 300, beverageType: '黑咖啡' },
    { id: 'w-3', time: '11:30', amountMl: 400, beverageType: '白開水' },
    { id: 'w-4', time: '14:15', amountMl: 350, beverageType: '無糖綠茶' },
    { id: 'w-5', time: '16:40', amountMl: 450, beverageType: '白開水' },
  ],
  waterReminderIntervalMins: 90,
  waterReminderEnabled: true,
  sleepLogs: [
    {
      id: 's-1',
      date: '2026-11-02',
      bedtime: '23:15',
      wakeTime: '07:10',
      latencyMins: 12,
      awakenings: 0,
      refreshmentRating: 5,
      actualHours: 7.7,
      efficiencyPct: 97,
      qualityScore: 95,
      note: '睡前停用手機 45 分鐘，一覺到天亮',
    },
    {
      id: 's-2',
      date: '2026-11-01',
      bedtime: '23:30',
      wakeTime: '07:15',
      latencyMins: 15,
      awakenings: 1,
      refreshmentRating: 4,
      actualHours: 7.3,
      efficiencyPct: 94,
      qualityScore: 88,
      note: '傍晚有氧運動後較好入睡',
    },
    {
      id: 's-3',
      date: '2026-10-31',
      bedtime: '00:10',
      wakeTime: '07:20',
      latencyMins: 22,
      awakenings: 1,
      refreshmentRating: 3,
      actualHours: 6.6,
      efficiencyPct: 92,
      qualityScore: 76,
      note: '晚間整理報告較晚就寢',
    },
    {
      id: 's-4',
      date: '2026-10-30',
      bedtime: '23:20',
      wakeTime: '07:05',
      latencyMins: 14,
      awakenings: 0,
      refreshmentRating: 4,
      actualHours: 7.5,
      efficiencyPct: 97,
      qualityScore: 90,
      note: '臥室恆溫 21°C，睡眠穩定',
    },
  ],
  privacy: {
    deploymentTarget: detectInitialDeploymentTarget(),
    demoModeEnabled: true,
    maskSensitiveNumbers: false,
    pinEnabled: false,
    pinCode: '2580',
    preventAccidentalClose: true,
    requirePinToDisable: true,
    autoBackupReminder: true,
    lastBackupAt: '2026-11-01 21:30',
  },
  exerciseCompletedMinsThisWeek: 125,
  strengthCompletedSessionsThisWeek: 3,
  stepsToday: 7840,
};

export function loadState(): VitaPulseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SEED_STATE;
    const parsed = JSON.parse(raw);
    const mergedPrivacy: PrivacySettings = {
      ...DEFAULT_SEED_STATE.privacy,
      ...(parsed.privacy || {}),
    };
    // If deployed on GitHub Pages or in GitHub Demo Lock mode, enforce demoModeEnabled & preventAccidentalClose
    if (isEnvForcedGitHubDemo() || mergedPrivacy.deploymentTarget === 'github-pages') {
      mergedPrivacy.deploymentTarget = 'github-pages';
      mergedPrivacy.demoModeEnabled = true;
      mergedPrivacy.preventAccidentalClose = true;
    } else if (mergedPrivacy.demoModeEnabled) {
      // Whenever Demo Mode is ON, Prevent-Close is locked ON
      mergedPrivacy.preventAccidentalClose = true;
    }
    return {
      ...DEFAULT_SEED_STATE,
      ...parsed,
      profile: { ...DEFAULT_SEED_STATE.profile, ...(parsed.profile || {}) },
      questionnaire: { ...DEFAULT_SEED_STATE.questionnaire, ...(parsed.questionnaire || {}) },
      privacy: mergedPrivacy,
    };
  } catch {
    return DEFAULT_SEED_STATE;
  }
}

export function saveState(state: VitaPulseState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors in restricted sandboxes
  }
}

export function formatMaskedNumber(val: number | string, masked: boolean, suffix = ''): string {
  if (masked) {
    return `••.•${suffix ? ' ' + suffix : ''}`;
  }
  return `${val}${suffix ? ' ' + suffix : ''}`;
}

export function createSnapshotRecordFromState(
  state: VitaPulseState,
  note: string,
  restingHr: number,
  stressIndex: number
): HealthHistoryRecord {
  const { profile, waterLogsToday, sleepLogs } = state;
  const bmi = calculateBMI(profile.heightCm, profile.weightKg);
  const totalWater = waterLogsToday.reduce((sum, item) => sum + item.amountMl, 0);
  const latestSleep = sleepLogs[0];
  const todayStr = new Date().toISOString().slice(0, 10);

  return {
    id: `h-${Date.now()}`,
    date: todayStr,
    weightKg: profile.weightKg,
    bmi,
    waistCm: profile.waistCm,
    sleepHours: latestSleep ? latestSleep.actualHours : 7.5,
    sleepQualityScore: latestSleep ? latestSleep.qualityScore : 84,
    waterMl: totalWater,
    restingHr,
    stressIndex,
    systolicBp: profile.systolicBp,
    diastolicBp: profile.diastolicBp,
    note: note.trim() || '日常健康數據快照紀錄',
  };
}
