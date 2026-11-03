import {
  calculateBMI,
  calculateBMR,
  calculateBloodPressureStatus,
  calculateHeartRateZones,
  calculateIdealWeightRange,
  calculateNutritionAndExercisePlan,
  calculateStressIndex,
  calculateTDEE,
  calculateWHR,
  classifyBMI,
  evaluateHealthQuestionnaire,
  evaluateMentalHealthScales,
} from './healthCalculations';
import { VitaPulseState } from './storage';

export interface HealthReportSummaryData {
  generatedAt: string;
  userName: string;
  age: number;
  genderLabel: string;
  heightCm: number;
  weightKg: number;
  bmi: number;
  bmiLabel: string;
  bmiStandardLabel: string;
  idealWeightRangeText: string;
  waistCm: number;
  whtr: number;
  waistStatusLabel: string;
  bmr: number;
  tdee: number;
  dailyCaloriesTarget: number;
  bpText: string;
  bpLabel: string;
  historyCount: number;
  bmiTrend: {
    firstDate: string;
    latestDate: string;
    firstBmi: number;
    latestBmi: number;
    avgBmi: number;
    bmiDelta: number;
    firstWeight: number;
    latestWeight: number;
    weightDelta: number;
    series: { date: string; bmi: number; weightKg: number }[];
  };
  sleepSummary: {
    avgSleepHours: number;
    avgQualityScore: number;
    avgEfficiencyPct: number;
    latestSleepHours: number;
    latestQualityScore: number;
    statusText: string;
    series: { date: string; hours: number; score: number }[];
  };
  stressAndVitalsSummary: {
    latestRestingHr: number;
    avgRestingHr: number;
    zone2Text: string;
    latestStressIndex: number;
    avgStressIndex: number;
    stressLevel: string;
    autonomicBalance: string;
    mentalWellnessScore: number;
    phq9Text: string;
    gad7Text: string;
    bsrs5Text: string;
    pssText: string;
    lifestyleScore: number;
    lifestyleGrade: string;
    series: { date: string; stressIndex: number; restingHr: number }[];
  };
  topRecommendations: {
    dimension: string;
    degree: string;
    actionPlan: string;
  }[];
}

/**
 * Aggregate BMI trend, sleep quality, and stress index analysis into a structured summary object.
 */
export function buildHealthSummaryReportData(state: VitaPulseState): HealthReportSummaryData {
  const { profile, history, sleepLogs, questionnaire, mentalHealthScales } = state;
  const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

  const bmi = calculateBMI(profile.heightCm, profile.weightKg);
  const bmiInfo = classifyBMI(bmi, profile.bmiStandard);
  const idealRange = calculateIdealWeightRange(profile.heightCm, profile.weightKg, profile.bmiStandard);
  const bmr = calculateBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const nutritionPlan = calculateNutritionAndExercisePlan(tdee, profile.weightKg, bmi, profile.goal);
  const whrInfo = calculateWHR(profile.waistCm, profile.hipCm, profile.gender, profile.heightCm);
  const bpInfo = calculateBloodPressureStatus(profile.systolicBp, profile.diastolicBp);
  const qEval = evaluateHealthQuestionnaire(questionnaire, bmi);
  const mentalEval = evaluateMentalHealthScales(mentalHealthScales);

  // Chronological history (oldest -> newest)
  const chronological = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const count = chronological.length;

  const firstRec = chronological[0];
  const latestRec = chronological[count - 1];

  const firstBmi = firstRec ? firstRec.bmi : bmi;
  const latestBmi = latestRec ? latestRec.bmi : bmi;
  const avgBmi =
    count > 0
      ? Math.round((chronological.reduce((s, r) => s + r.bmi, 0) / count) * 10) / 10
      : bmi;
  const bmiDelta = Math.round((latestBmi - firstBmi) * 10) / 10;

  const firstWeight = firstRec ? firstRec.weightKg : profile.weightKg;
  const latestWeight = latestRec ? latestRec.weightKg : profile.weightKg;
  const weightDelta = Math.round((latestWeight - firstWeight) * 10) / 10;

  // Sleep summary
  const avgSleepHours =
    count > 0
      ? Math.round((chronological.reduce((s, r) => s + r.sleepHours, 0) / count) * 10) / 10
      : sleepLogs[0]?.actualHours || 7.5;
  const avgQualityScore =
    count > 0
      ? Math.round(chronological.reduce((s, r) => s + r.sleepQualityScore, 0) / count)
      : sleepLogs[0]?.qualityScore || 85;
  const avgEfficiencyPct =
    sleepLogs.length > 0
      ? Math.round(sleepLogs.reduce((s, l) => s + l.efficiencyPct, 0) / sleepLogs.length)
      : 92;

  const latestSleepHours = sleepLogs[0]?.actualHours ?? latestRec?.sleepHours ?? 7.5;
  const latestQualityScore = sleepLogs[0]?.qualityScore ?? latestRec?.sleepQualityScore ?? 85;
  const sleepStatusText =
    avgQualityScore >= 85
      ? '優質深層修復（睡眠效率與時數皆達臨床建議標準）'
      : avgQualityScore >= 72
        ? '尚可維持（建議固定就寢時間以減少睡眠負債）'
        : '睡眠修復不足（建議優先延長睡眠時數並減少睡前藍光）';

  // Stress & Vitals summary
  const latestRestingHr = latestRec?.restingHr || 62;
  const avgRestingHr =
    count > 0
      ? Math.round(chronological.reduce((s, r) => s + r.restingHr, 0) / count)
      : latestRestingHr;

  const hrZones = calculateHeartRateZones(profile.age, latestRestingHr);
  const zone2 = hrZones.zones[1];

  const stressEval = calculateStressIndex({
    restingHr: latestRestingHr,
    baselineHr: 60,
    sleepHours: latestSleepHours,
    perceivedStress: mentalEval.recommendedPerceivedStress1To10,
    caffeineCups: 1,
    workHours: 8,
  });

  const latestStressIndex = latestRec?.stressIndex ?? stressEval.stressIndex;
  const avgStressIndex =
    count > 0
      ? Math.round(chronological.reduce((s, r) => s + r.stressIndex, 0) / count)
      : latestStressIndex;

  return {
    generatedAt: nowStr,
    userName: profile.name || '未命名使用者',
    age: profile.age,
    genderLabel: profile.gender === 'male' ? '生理男' : '生理女',
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    bmi,
    bmiLabel: bmiInfo.label,
    bmiStandardLabel: profile.bmiStandard === 'tw' ? '台灣衛福部國健署標準' : 'WHO 國際標準',
    idealWeightRangeText: `${idealRange.minKg} ~ ${idealRange.maxKg} kg (黃金目標 ${idealRange.targetKg} kg)`,
    waistCm: profile.waistCm,
    whtr: whrInfo.whtr,
    waistStatusLabel: whrInfo.label,
    bmr,
    tdee,
    dailyCaloriesTarget: nutritionPlan.dailyCalories,
    bpText: `${profile.systolicBp}/${profile.diastolicBp} mmHg`,
    bpLabel: bpInfo.label,
    historyCount: count,
    bmiTrend: {
      firstDate: firstRec?.date || nowStr.slice(0, 10),
      latestDate: latestRec?.date || nowStr.slice(0, 10),
      firstBmi,
      latestBmi,
      avgBmi,
      bmiDelta,
      firstWeight,
      latestWeight,
      weightDelta,
      series: chronological.map((r) => ({
        date: r.date.slice(5),
        bmi: r.bmi,
        weightKg: r.weightKg,
      })),
    },
    sleepSummary: {
      avgSleepHours,
      avgQualityScore,
      avgEfficiencyPct,
      latestSleepHours,
      latestQualityScore,
      statusText: sleepStatusText,
      series: chronological.map((r) => ({
        date: r.date.slice(5),
        hours: r.sleepHours,
        score: r.sleepQualityScore,
      })),
    },
    stressAndVitalsSummary: {
      latestRestingHr,
      avgRestingHr,
      zone2Text: `${zone2.minBpm} ~ ${zone2.maxBpm} bpm`,
      latestStressIndex,
      avgStressIndex,
      stressLevel: stressEval.level,
      autonomicBalance: stressEval.autonomicBalance,
      mentalWellnessScore: mentalEval.mentalWellnessScore,
      phq9Text: `${mentalEval.phq9Score}/27 (${mentalEval.phq9Level})`,
      gad7Text: `${mentalEval.gad7Score}/21 (${mentalEval.gad7Level})`,
      bsrs5Text: `${mentalEval.bsrs5Score}/20 (${mentalEval.bsrs5Level})`,
      pssText: `${mentalEval.pssScore}/24 (${mentalEval.pssLevel})`,
      lifestyleScore: qEval.totalScore,
      lifestyleGrade: qEval.grade,
      series: chronological.map((r) => ({
        date: r.date.slice(5),
        stressIndex: r.stressIndex,
        restingHr: r.restingHr,
      })),
    },
    topRecommendations: qEval.recommendations.slice(0, 4).map((r) => ({
      dimension: r.dimension,
      degree: r.degree,
      actionPlan: r.actionPlan,
    })),
  };
}

/**
 * Draw a mini trend line chart onto a 2D canvas context.
 */
function drawMiniTrendChart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  labels: string[],
  values: number[],
  strokeColor: string,
  fillColor: string,
  unitSuffix: string
) {
  ctx.save();
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText(title, x + 18, y + 30);

  if (values.length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '15px "Noto Sans TC", sans-serif';
    ctx.fillText('尚無足夠歷史趨勢資料', x + 18, y + h / 2);
    ctx.restore();
    return;
  }

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const spread = Math.max(1, maxVal - minVal);
  const padMin = minVal - spread * 0.2;
  const padMax = maxVal + spread * 0.2;

  const plotX = x + 46;
  const plotY = y + 48;
  const plotW = w - 68;
  const plotH = h - 82;

  // Horizontal grid lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 2; i++) {
    const gy = plotY + (plotH * i) / 2;
    ctx.beginPath();
    ctx.moveTo(plotX, gy);
    ctx.lineTo(plotX + plotW, gy);
    ctx.stroke();

    const labelVal = Math.round((padMax - ((padMax - padMin) * i) / 2) * 10) / 10;
    ctx.fillStyle = '#64748b';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText(`${labelVal}`, x + 10, gy + 4);
  }

  const points = values.map((v, idx) => {
    const px =
      values.length === 1
        ? plotX + plotW / 2
        : plotX + (idx / (values.length - 1)) * plotW;
    const py = plotY + plotH - ((v - padMin) / (padMax - padMin)) * plotH;
    return { px, py, v, label: labels[idx] || '' };
  });

  // Area fill
  if (points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(points[0].px, plotY + plotH);
    points.forEach((p) => ctx.lineTo(p.px, p.py));
    ctx.lineTo(points[points.length - 1].px, plotY + plotH);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  // Line path
  ctx.beginPath();
  points.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(p.px, p.py);
    else ctx.lineTo(p.px, p.py);
  });
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Dots and value labels
  points.forEach((p, idx) => {
    ctx.beginPath();
    ctx.arc(p.px, p.py, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    if (idx === 0 || idx === points.length - 1 || idx === Math.floor(points.length / 2)) {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(`${p.v}${unitSuffix}`, p.px - 14, p.py - 10);
    }
    if (idx === 0 || idx === points.length - 1 || idx % 2 === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(p.label, p.px - 14, plotY + plotH + 18);
    }
  });

  ctx.restore();
}

/**
 * Wrap text into multiple lines for Canvas 2D rendering.
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const chars = Array.from(text);
  let line = '';
  let currY = y;
  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, currY);
      line = chars[i];
      currY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currY);
    currY += lineHeight;
  }
  return currY;
}

/**
 * Package a JPEG data URL into a single-page A4 PDF 1.4 binary Uint8Array.
 */
function buildPdfBytesFromJpegDataUrl(
  jpegDataUrl: string,
  pixelWidth: number,
  pixelHeight: number
): Uint8Array {
  const base64Data = jpegDataUrl.split(',')[1] || '';
  const binaryStr = atob(base64Data);
  const jpegBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    jpegBytes[i] = binaryStr.charCodeAt(i);
  }

  // Standard A4 size in PDF points: 595.28 x 841.89
  const pageW = 595.28;
  const pageH = 841.89;

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  const pushStr = (s: string) => {
    const bytes = encoder.encode(s);
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    currentOffset += b.length;
  };

  const startObj = (id: number) => {
    offsets[id] = currentOffset;
    pushStr(`${id} 0 obj\n`);
  };

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // 1: Catalog
  startObj(1);
  pushStr('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // 2: Pages
  startObj(2);
  pushStr('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // 3: Page
  startObj(3);
  pushStr(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // 4: Image XObject (DCTDecode JPEG)
  startObj(4);
  pushStr(
    `<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushStr('\nendstream\nendobj\n');

  // 5: Page Content Stream
  const contentStream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
  startObj(5);
  pushStr(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`);

  // Cross-reference table
  const xrefOffset = currentOffset;
  pushStr('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    const padded = String(offsets[i]).padStart(10, '0');
    pushStr(`${padded} 00000 n \n`);
  }

  pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  return result;
}

/**
 * Render the complete Health Summary Report onto a 2x A4 Canvas, build a valid PDF file, and trigger download.
 */
export function generateAndDownloadHealthReportPdf(state: VitaPulseState): {
  fileName: string;
  summary: HealthReportSummaryData;
} {
  const summary = buildHealthSummaryReportData(state);

  // High-DPI A4 Canvas (1240 x 1754 px)
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // Page background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top Header Banner
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, 132);

  ctx.fillStyle = '#14b8a6';
  ctx.fillRect(0, 128, canvas.width, 6);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText('VitaPulse 全方位個人健康總結報告', 48, 56);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '16px "Noto Sans TC", "PingFang TC", sans-serif';
  ctx.fillText(
    `受測者：${summary.userName} (${summary.genderLabel} · ${summary.age} 歲)   |   身高：${summary.heightCm} cm   |   體重：${summary.weightKg} kg   |   歷史紀錄：${summary.historyCount} 筆`,
    48,
    92
  );

  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px "JetBrains Mono", monospace';
  ctx.fillText(`產出時間：${summary.generatedAt}  ·  判定基準：${summary.bmiStandardLabel}`, 48, 116);

  // Section 1: Core KPI Summary Strip (4 boxes)
  const kpiY = 158;
  const kpiW = 272;
  const kpiH = 112;
  const kpiGap = 20;

  const kpis = [
    {
      label: '1. 目前 BMI 身體質量指數',
      value: `${summary.bmi}`,
      badge: summary.bmiLabel,
      sub: `區間平均 ${summary.bmiTrend.avgBmi} (變化 ${summary.bmiTrend.bmiDelta >= 0 ? '+' : ''}${summary.bmiTrend.bmiDelta})`,
      accent: '#0d9488',
    },
    {
      label: '2. 腰身高比 (WHtR) 與血壓',
      value: `WHtR ${summary.whtr}`,
      badge: `${summary.waistCm} cm`,
      sub: `血壓 ${summary.bpText} (${summary.bpLabel})`,
      accent: '#0284c7',
    },
    {
      label: '3. 睡眠品質與修復效率',
      value: `${summary.sleepSummary.avgQualityScore} 分`,
      badge: `平均 ${summary.sleepSummary.avgSleepHours}h`,
      sub: `臨床睡眠效率 ${summary.sleepSummary.avgEfficiencyPct}%`,
      accent: '#4f46e5',
    },
    {
      label: '4. 身心壓力與心理韌性',
      value: `壓力 ${summary.stressAndVitalsSummary.latestStressIndex}`,
      badge: summary.stressAndVitalsSummary.stressLevel,
      sub: `靜息心率 ${summary.stressAndVitalsSummary.latestRestingHr} bpm · 心理韌性 ${summary.stressAndVitalsSummary.mentalWellnessScore}分`,
      accent: '#e11d48',
    },
  ];

  kpis.forEach((k, idx) => {
    const bx = 48 + idx * (kpiW + kpiGap);
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bx, kpiY, kpiW, kpiH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = k.accent;
    ctx.fillRect(bx, kpiY, 6, kpiH);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
    ctx.fillText(k.label, bx + 18, kpiY + 28);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.fillText(k.value, bx + 18, kpiY + 64);

    ctx.fillStyle = k.accent;
    ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
    ctx.fillText(k.badge, bx + 150, kpiY + 62);

    ctx.fillStyle = '#64748b';
    ctx.font = '13px "Noto Sans TC", sans-serif';
    ctx.fillText(k.sub, bx + 18, kpiY + 94);
  });

  // Section 2: 3 Trend Charts (BMI Trend, Sleep Quality Trend, Stress Index Trend)
  const chartY = 296;
  const chartW = 368;
  const chartH = 225;
  const chartGap = 20;

  drawMiniTrendChart(
    ctx,
    48,
    chartY,
    chartW,
    chartH,
    'BMI 身體質量指數歷史變化趨勢',
    summary.bmiTrend.series.map((s) => s.date),
    summary.bmiTrend.series.map((s) => s.bmi),
    '#0d9488',
    'rgba(13, 148, 136, 0.14)',
    ''
  );

  drawMiniTrendChart(
    ctx,
    48 + chartW + chartGap,
    chartY,
    chartW,
    chartH,
    '睡眠品質評分歷史趨勢 (0-100分)',
    summary.sleepSummary.series.map((s) => s.date),
    summary.sleepSummary.series.map((s) => s.score),
    '#4f46e5',
    'rgba(79, 70, 229, 0.14)',
    '分'
  );

  drawMiniTrendChart(
    ctx,
    48 + (chartW + chartGap) * 2,
    chartY,
    chartW,
    chartH,
    '身心壓力負荷指數趨勢 (0-100)',
    summary.stressAndVitalsSummary.series.map((s) => s.date),
    summary.stressAndVitalsSummary.series.map((s) => s.stressIndex),
    '#e11d48',
    'rgba(225, 29, 72, 0.14)',
    ''
  );

  // Section 3: Detailed Clinical Breakdown (BMI & Metabolism + Sleep & Stress/Mental Scales)
  const detailY = 546;
  const detailW = 562;
  const detailH = 330;

  // Left Box: BMI, Weight Change & Metabolic Analysis
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(48, detailY, detailW, detailH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
  ctx.fillText('一、BMI 體位變化與代謝指標分析', 70, detailY + 38);

  const leftLines = [
    `• 統計期間：${summary.bmiTrend.firstDate} 至 ${summary.bmiTrend.latestDate}（共 ${summary.historyCount} 筆紀錄）`,
    `• 體重變化：由 ${summary.bmiTrend.firstWeight} kg 變化至 ${summary.bmiTrend.latestWeight} kg（淨變化 ${summary.bmiTrend.weightDelta >= 0 ? '+' : ''}${summary.bmiTrend.weightDelta} kg）`,
    `• BMI 變化：由 ${summary.bmiTrend.firstBmi} 變化至 ${summary.bmiTrend.latestBmi}（區間平均 ${summary.bmiTrend.avgBmi} · ${summary.bmiLabel}）`,
    `• 理想體重區間：${summary.idealWeightRangeText}`,
    `• 內臟脂肪指標：腰圍 ${summary.waistCm} cm · 腰身高比 WHtR ${summary.whtr}（${summary.waistStatusLabel}）`,
    `• 熱量代謝基準：BMR ${summary.bmr} kcal / TDEE ${summary.tdee} kcal（建議攝取 ${summary.dailyCaloriesTarget} kcal）`,
    `• 睡眠品質總結：平均睡眠 ${summary.sleepSummary.avgSleepHours} 小時 · 平均品質 ${summary.sleepSummary.avgQualityScore} 分`,
    `• 睡眠臨床評估：${summary.sleepSummary.statusText}`,
  ];

  ctx.fillStyle = '#334155';
  ctx.font = '15px "Noto Sans TC", sans-serif';
  leftLines.forEach((line, i) => {
    ctx.fillText(line, 70, detailY + 76 + i * 31);
  });

  // Right Box: Stress Index, Heart Rate & Psychological Scales (PHQ-9 / GAD-7 / BSRS-5 / PSS)
  const rightX = 48 + detailW + 20;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(rightX, detailY, detailW, detailH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
  ctx.fillText('二、壓力指數、心率與心理量表分析', rightX + 22, detailY + 38);

  const rightLines = [
    `• 身心壓力指數：目前 ${summary.stressAndVitalsSummary.latestStressIndex} / 100（區間平均 ${summary.stressAndVitalsSummary.avgStressIndex} · ${summary.stressAndVitalsSummary.stressLevel}）`,
    `• 自律神經狀態：${summary.stressAndVitalsSummary.autonomicBalance}`,
    `• 靜息心率與燃脂區：目前 ${summary.stressAndVitalsSummary.latestRestingHr} bpm（Zone 2 燃脂區間 ${summary.stressAndVitalsSummary.zone2Text}）`,
    `• 綜合心理韌性指數：${summary.stressAndVitalsSummary.mentalWellnessScore} / 100 分（生活型態問卷 ${summary.stressAndVitalsSummary.lifestyleScore}分 ${summary.stressAndVitalsSummary.lifestyleGrade}級）`,
    `• PHQ-9 憂鬱症檢核：${summary.stressAndVitalsSummary.phq9Text}`,
    `• GAD-7 廣泛性焦慮：${summary.stressAndVitalsSummary.gad7Text}`,
    `• BSRS-5 心情溫度計：${summary.stressAndVitalsSummary.bsrs5Text}`,
    `• PSS 感知壓力量表：${summary.stressAndVitalsSummary.pssText}`,
  ];

  ctx.fillStyle = '#334155';
  ctx.font = '15px "Noto Sans TC", sans-serif';
  rightLines.forEach((line, i) => {
    ctx.fillText(line, rightX + 22, detailY + 76 + i * 31);
  });

  // Section 4: Recent Historical Records Table
  const tableY = 900;
  const tableW = 1144;
  const tableH = 380;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(48, tableY, tableW, tableH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
  ctx.fillText('三、近期健康歷史趨勢明細表（最新 8 筆快照）', 70, tableY + 36);

  // Table Header
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(68, tableY + 52, tableW - 40, 34);

  const cols = [
    { label: '日期', x: 82 },
    { label: '體重 (kg)', x: 220 },
    { label: 'BMI 指數', x: 340 },
    { label: '腰圍 (cm)', x: 460 },
    { label: '睡眠時數/評分', x: 585 },
    { label: '靜息心率', x: 750 },
    { label: '壓力指數', x: 870 },
    { label: '居家血壓', x: 990 },
  ];

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
  cols.forEach((c) => ctx.fillText(c.label, c.x, tableY + 74));

  const recentRows = [...state.history]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  recentRows.forEach((row, idx) => {
    const ry = tableY + 112 + idx * 33;
    if (idx % 2 === 1) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(68, ry - 22, tableW - 40, 32);
    }
    ctx.fillStyle = '#0f172a';
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText(row.date, cols[0].x, ry);
    ctx.fillText(`${row.weightKg} kg`, cols[1].x, ry);
    ctx.fillStyle = '#0d9488';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText(`${row.bmi}`, cols[2].x, ry);
    ctx.fillStyle = '#334155';
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText(`${row.waistCm} cm`, cols[3].x, ry);
    ctx.fillText(`${row.sleepHours}h (${row.sleepQualityScore}分)`, cols[4].x, ry);
    ctx.fillText(`${row.restingHr} bpm`, cols[5].x, ry);
    ctx.fillStyle = row.stressIndex >= 60 ? '#e11d48' : '#334155';
    ctx.fillText(`${row.stressIndex}`, cols[6].x, ry);
    ctx.fillStyle = '#334155';
    ctx.fillText(`${row.systolicBp}/${row.diastolicBp}`, cols[7].x, ry);
  });

  // Section 5: Personalized Improvement Action Plan
  const recY = 1304;
  const recH = 345;
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(48, recY, tableW, recH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
  ctx.fillText('四、個人化健康改善建議與優先處方', 70, recY + 36);

  let currRecY = recY + 72;
  summary.topRecommendations.forEach((rec, idx) => {
    ctx.fillStyle =
      rec.degree === '亟需改善'
        ? '#e11d48'
        : rec.degree === '建議強化'
          ? '#d97706'
          : '#059669';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText(`${idx + 1}. 【${rec.degree}】${rec.dimension}`, 70, currRecY);

    ctx.fillStyle = '#334155';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    currRecY = drawWrappedText(ctx, `建議方案：${rec.actionPlan}`, 92, currRecY + 24, 1070, 22) + 10;
  });

  // Footer
  ctx.fillStyle = '#64748b';
  ctx.font = '13px "Noto Sans TC", sans-serif';
  ctx.fillText(
    '醫療免責聲明：本報告由 VitaPulse 全方位個人健康管家自動產出，採用衛福部國健署、WHO、Mifflin-St Jeor 與 Karvonen 臨床公式，僅供日常健康管理參考，不具醫療診斷效力。',
    48,
    1705
  );

  // Convert Canvas to JPEG and package into PDF 1.4 binary
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.94);
  const pdfBytes = buildPdfBytesFromJpegDataUrl(jpegDataUrl, canvas.width, canvas.height);

  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const fileName = `vitapulse-health-report-${new Date().toISOString().slice(0, 10)}.pdf`;

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { fileName, summary };
}
