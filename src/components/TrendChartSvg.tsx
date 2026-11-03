import React, { useState } from 'react';
import { HealthHistoryRecord, formatMaskedNumber } from '../utils/storage';

export type ChartMetricKey =
  | 'bmi'
  | 'weightKg'
  | 'waistCm'
  | 'sleepQualityScore'
  | 'restingHr'
  | 'stressIndex';

interface MetricConfig {
  key: ChartMetricKey;
  label: string;
  unit: string;
  stroke: string;
  idealMin: number;
  idealMax: number;
  idealLabel: string;
}

export const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: 'bmi',
    label: 'BMI 指數',
    unit: '',
    stroke: '#0d9488',
    idealMin: 18.5,
    idealMax: 23.9,
    idealLabel: '正常範圍 18.5 - 23.9',
  },
  {
    key: 'weightKg',
    label: '體重變化',
    unit: 'kg',
    stroke: '#0284c7',
    idealMin: 58,
    idealMax: 72,
    idealLabel: '建議體重區間',
  },
  {
    key: 'waistCm',
    label: '腰圍變化',
    unit: 'cm',
    stroke: '#4f46e5',
    idealMin: 65,
    idealMax: 85,
    idealLabel: '國健署警戒線 男<90 / 女<80 cm',
  },
  {
    key: 'sleepQualityScore',
    label: '睡眠品質分',
    unit: '分',
    stroke: '#7c3aed',
    idealMin: 80,
    idealMax: 100,
    idealLabel: '優質修復 ≥ 80 分',
  },
  {
    key: 'restingHr',
    label: '靜息心率',
    unit: 'bpm',
    stroke: '#e11d48',
    idealMin: 52,
    idealMax: 68,
    idealLabel: '良好心肺 52 - 68 bpm',
  },
  {
    key: 'stressIndex',
    label: '壓力指數',
    unit: '',
    stroke: '#d97706',
    idealMin: 15,
    idealMax: 45,
    idealLabel: '平衡壓力 ≤ 45',
  },
];

interface TrendChartSvgProps {
  records: HealthHistoryRecord[];
  selectedMetric: ChartMetricKey;
  onSelectMetric: (metric: ChartMetricKey) => void;
  masked?: boolean;
}

export const TrendChartSvg: React.FC<TrendChartSvgProps> = ({
  records,
  selectedMetric,
  onSelectMetric,
  masked = false,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const config = METRIC_CONFIGS.find((m) => m.key === selectedMetric) || METRIC_CONFIGS[0];

  const chronological = [...records].sort((a, b) => a.date.localeCompare(b.date));

  if (chronological.length === 0) {
    return (
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center bg-white dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          目前尚無歷史趨勢紀錄，請於上方輸入身高體重並點擊「儲存至今日紀錄」以生成趨勢圖表。
        </p>
      </div>
    );
  }

  const values = chronological.map((r) => Number(r[selectedMetric]) || 0);
  const rawMin = Math.min(...values, config.idealMin);
  const rawMax = Math.max(...values, config.idealMax);
  const padding = Math.max(1.5, (rawMax - rawMin) * 0.18);
  const minVal = Math.max(0, Math.floor((rawMin - padding) * 10) / 10);
  const maxVal = Math.ceil((rawMax + padding) * 10) / 10;
  const valSpan = Math.max(1, maxVal - minVal);

  const width = 1160;
  const height = 240;
  const padLeft = 48;
  const padRight = 24;
  const padTop = 22;
  const padBottom = 36;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (idx: number) => {
    if (chronological.length === 1) return padLeft + plotW / 2;
    return padLeft + (idx / (chronological.length - 1)) * plotW;
  };

  const getY = (val: number) => {
    const ratio = (val - minVal) / valSpan;
    return padTop + plotH - ratio * plotH;
  };

  const points = chronological.map((rec, idx) => ({
    x: getX(idx),
    y: getY(Number(rec[selectedMetric]) || 0),
    val: Number(rec[selectedMetric]) || 0,
    date: rec.date,
    note: rec.note,
  }));

  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPoints = `${points[0].x.toFixed(1)},${padTop + plotH} ${polylinePoints} ${points[points.length - 1].x.toFixed(1)},${padTop + plotH}`;

  const idealTopY = Math.max(padTop, Math.min(padTop + plotH, getY(config.idealMax)));
  const idealBottomY = Math.max(padTop, Math.min(padTop + plotH, getY(config.idealMin)));
  const idealBandHeight = Math.max(0, idealBottomY - idealTopY);

  const firstVal = values[0];
  const lastVal = values[values.length - 1];
  const delta = Math.round((lastVal - firstVal) * 10) / 10;
  const avgVal = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : points[points.length - 1];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            多維度健康歷史趨勢圖表
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            <span>區間樣本數：{chronological.length} 筆</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>平均值：{formatMaskedNumber(avgVal, masked, config.unit)}</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>
              區間變化：{masked ? '••.•' : `${delta > 0 ? '+' : ''}${delta} ${config.unit}`}
            </span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>{config.idealLabel}</span>
          </p>
        </div>

        <div
          role="tablist"
          aria-label="選擇趨勢圖表指標"
          className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
        >
          {METRIC_CONFIGS.map((m) => {
            const active = m.key === selectedMetric;
            return (
              <button
                key={m.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectMetric(m.key)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 overflow-visible select-none"
          role="img"
          aria-label={`${config.label}歷史趨勢折線圖`}
        >
          <defs>
            <linearGradient id={`grad-${config.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={config.stroke} stopOpacity="0.22" />
              <stop offset="100%" stopColor={config.stroke} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {idealBandHeight > 2 && (
            <rect
              x={padLeft}
              y={idealTopY}
              width={plotW}
              height={idealBandHeight}
              fill="#10b981"
              fillOpacity="0.08"
            />
          )}

          {[0, 0.25, 0.5, 0.75, 1].map((step) => {
            const y = padTop + step * plotH;
            const labelVal = Math.round((maxVal - step * valSpan) * 10) / 10;
            return (
              <g key={step}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + plotW}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray={step === 0 || step === 1 ? undefined : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] fill-slate-500 dark:fill-slate-400 font-mono tabular-nums"
                >
                  {masked ? '••' : labelVal}
                </text>
              </g>
            );
          })}

          {points.length > 1 && (
            <polygon points={areaPoints} fill={`url(#grad-${config.key})`} />
          )}

          {points.length > 1 && (
            <polyline
              fill="none"
              stroke={config.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />
          )}

          {points.map((pt, idx) => {
            const isHovered = hoverIndex === idx || (hoverIndex === null && idx === points.length - 1);
            return (
              <g
                key={pt.date + idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <circle cx={pt.x} cy={pt.y} r={12} fill="transparent" />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill={isHovered ? '#ffffff' : config.stroke}
                  stroke={config.stroke}
                  strokeWidth={isHovered ? 3 : 1.5}
                />
                {(idx % Math.max(1, Math.floor(points.length / 6)) === 0 || idx === points.length - 1) && (
                  <text
                    x={pt.x}
                    y={height - 10}
                    textAnchor="middle"
                    className="text-[11px] fill-slate-500 dark:fill-slate-400 font-mono tabular-nums"
                  >
                    {pt.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {activePoint && (
          <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2 tabular-nums">
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {activePoint.date}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {config.label}：
                <strong className="font-mono text-slate-900 dark:text-slate-100 ml-0.5">
                  {formatMaskedNumber(activePoint.val, masked, config.unit)}
                </strong>
              </span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 truncate max-w-md">
              備註：{activePoint.note || '無備註'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
