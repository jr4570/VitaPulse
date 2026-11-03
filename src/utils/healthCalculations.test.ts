import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBMI,
  classifyBMI,
  calculateIdealWeightRange,
  calculateBMR,
  calculateTDEE,
  calculateWHR,
  calculateBloodPressureStatus,
  evaluateHealthQuestionnaire,
  calculateNutritionAndExercisePlan,
  calculateSleepEfficiency,
  calculateBpmFrom15SecCount,
  calculateHeartRateZones,
  calculateStressIndex,
} from './healthCalculations';

test('calculateBMI computes accurate BMI and handles invalid inputs', () => {
  assert.equal(calculateBMI(175, 68), 22.2);
  assert.equal(calculateBMI(160, 45), 17.6);
  assert.equal(calculateBMI(170, 85), 29.4);
  assert.equal(calculateBMI(0, 70), 0);
  assert.equal(calculateBMI(175, -5), 0);
});

test('classifyBMI distinguishes Taiwan HPA and WHO standards accurately', () => {
  const twNormal = classifyBMI(22.2, 'tw');
  assert.equal(twNormal.category, 'normal');
  assert.equal(twNormal.label, '正常範圍');

  const twOverweight = classifyBMI(24.5, 'tw');
  assert.equal(twOverweight.category, 'overweight');
  assert.equal(twOverweight.label, '體重過重');

  const whoNormal = classifyBMI(24.5, 'who');
  assert.equal(whoNormal.category, 'normal');

  const twObese = classifyBMI(28.0, 'tw');
  assert.equal(twObese.category, 'obese1');
});

test('calculateIdealWeightRange computes min, max, and target weight', () => {
  const range = calculateIdealWeightRange(175, 68, 'tw');
  assert.equal(range.minKg, 56.7);
  assert.equal(range.maxKg, 73.2);
  assert.equal(range.targetKg, 67.4);
  assert.equal(range.diffFromTargetKg, 0.6);
});

test('calculateBMR and calculateTDEE compute daily energy expenditure', () => {
  const maleBmr = calculateBMR(68, 175, 30, 'male');
  assert.equal(maleBmr, 1629);

  const femaleBmr = calculateBMR(55, 162, 28, 'female');
  assert.equal(femaleBmr, 1262);

  const tdee = calculateTDEE(1629, 'moderate');
  assert.equal(tdee, 2525);
});

test('calculateWHR evaluates waist-to-hip ratio and waist-to-height ratio', () => {
  const optimalWhr = calculateWHR(78, 96, 'male', 175);
  assert.equal(optimalWhr.whr, 0.81);
  assert.equal(optimalWhr.whtr, 0.45);
  assert.equal(optimalWhr.waistStatus, 'optimal');

  const highWhr = calculateWHR(94, 98, 'male', 175);
  assert.equal(highWhr.waistStatus, 'central_obesity');
});

test('calculateBloodPressureStatus classifies blood pressure accurately', () => {
  assert.equal(calculateBloodPressureStatus(116, 74).category, 'normal');
  assert.equal(calculateBloodPressureStatus(125, 76).category, 'elevated');
  assert.equal(calculateBloodPressureStatus(135, 85).category, 'stage1');
  assert.equal(calculateBloodPressureStatus(145, 95).category, 'stage2');
});

test('evaluateHealthQuestionnaire scores lifestyle dimensions and prioritizes recommendations', () => {
  const highEval = evaluateHealthQuestionnaire(
    {
      dietQuality: 14,
      sugarAndProcessed: 9,
      exerciseFreq: 14,
      sedentaryControl: 9,
      sleepRegularity: 14,
      hydrationHabit: 9,
      stressResilience: 13,
      substanceControl: 10,
    },
    22.0
  );
  assert.ok(highEval.totalScore >= 90);
  assert.equal(highEval.grade, 'A+');
  assert.equal(highEval.recommendations.length, 4);

  const lowEval = evaluateHealthQuestionnaire(
    {
      dietQuality: 5,
      sugarAndProcessed: 3,
      exerciseFreq: 4,
      sedentaryControl: 3,
      sleepRegularity: 6,
      hydrationHabit: 4,
      stressResilience: 5,
      substanceControl: 5,
    },
    28.5
  );
  assert.ok(lowEval.totalScore < 50);
  assert.equal(lowEval.grade, 'D');
  assert.equal(lowEval.recommendations[0].degree, '亟需改善');
});

test('calculateNutritionAndExercisePlan produces macro targets and exercise regimen', () => {
  const losePlan = calculateNutritionAndExercisePlan(2300, 75, 25.5, 'lose');
  assert.equal(losePlan.dailyCalories, 1850);
  assert.equal(losePlan.calorieDelta, -450);
  assert.ok(losePlan.macros.proteinGrams > 120);
  assert.ok(losePlan.dailyWaterMl >= 2600);
  assert.equal(losePlan.exerciseGoals.weeklyCardioMins, 210);
});

test('calculateSleepEfficiency computes overnight sleep duration and quality score from observable metrics', () => {
  const res = calculateSleepEfficiency('23:15', '07:15', 15, 0, 5);
  assert.equal(res.timeInBedHours, 8);
  assert.ok(res.actualSleepHours >= 7.7);
  assert.ok(res.efficiencyPct >= 95);
  assert.ok(res.qualityScore >= 86);
  assert.equal(res.statusLabel, '優質修復');
});

test('calculateBpmFrom15SecCount, calculateHeartRateZones and calculateStressIndex compute accurate metrics', () => {
  assert.equal(calculateBpmFrom15SecCount(15), 60);
  assert.equal(calculateBpmFrom15SecCount(18), 72);
  assert.equal(calculateBpmFrom15SecCount(0), 0);

  const hr = calculateHeartRateZones(30, 60);
  assert.equal(hr.maxHr, 187);
  assert.equal(hr.heartRateReserve, 127);
  assert.equal(hr.zones.length, 5);
  assert.equal(hr.fitnessLevel, '極佳');

  const lowStress = calculateStressIndex({
    restingHr: 60,
    baselineHr: 60,
    sleepHours: 7.8,
    perceivedStress: 2,
    caffeineCups: 1,
    workHours: 7.5,
  });
  assert.equal(lowStress.level, '放鬆平衡');

  const highStress = calculateStressIndex({
    restingHr: 78,
    baselineHr: 62,
    sleepHours: 5.0,
    perceivedStress: 9,
    caffeineCups: 4,
    workHours: 11,
  });
  assert.equal(highStress.level, '高度壓力');
});
