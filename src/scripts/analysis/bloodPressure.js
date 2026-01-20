// Blood pressure categorization and pulse status functions
import { getThresholdsSync } from '../storage.js';

export function getCategory(sys, dia) {
  sys = Number(sys);
  dia = Number(dia);
  if (!Number.isFinite(sys) || !Number.isFinite(dia)) {
    console.error('Invalid blood pressure values');
    return { class: 'unknown', text: 'Unknown' };
  }

  const thresholds = getThresholdsSync();

  // Validate thresholds exist
  if (
    !thresholds ||
    !thresholds.systolic ||
    !thresholds.diastolic ||
    thresholds.systolic.min == null ||
    thresholds.systolic.max == null ||
    thresholds.diastolic.min == null ||
    thresholds.diastolic.max == null
  ) {
    console.error('Blood pressure thresholds not properly configured');
    return { class: 'unknown', text: 'Unknown' };
  }

  // Single source of truth: derive all boundaries from configured thresholds
  let sMin = Number(thresholds.systolic.min);
  let sMax = Number(thresholds.systolic.max);
  let dMin = Number(thresholds.diastolic.min);
  let dMax = Number(thresholds.diastolic.max);

  // Defensive: if values are non-finite or inverted, fall back to sensible defaults
  if (!Number.isFinite(sMin) || !Number.isFinite(sMax) || sMin >= sMax) {
    console.warn('Invalid systolic thresholds; falling back to defaults');
    sMin = 90;
    sMax = 140;
  }
  if (!Number.isFinite(dMin) || !Number.isFinite(dMax) || dMin >= dMax) {
    console.warn('Invalid diastolic thresholds; falling back to defaults');
    dMin = 60;
    dMax = 90;
  }

  // Local small deltas (kept here for now; can be moved to storage later)
  // TODO: Move these deltas (STAGE1_DELTA, ELEVATED_DELTA, CRITICAL_*_DELTA)
  // to `storage.js` defaults so tuning is centralized and consistent.
  const STAGE1_DELTA = 10;
  const ELEVATED_DELTA = 20;
  const CRITICAL_HIGH_DELTA = 40;
  const CRITICAL_LOW_DELTA = 20;

  // Critical (derive from thresholds)
  if (sys >= sMax + CRITICAL_HIGH_DELTA || dia >= dMax + CRITICAL_HIGH_DELTA) {
    return { class: 'critical', text: 'CRITICALLY HIGH BP!' };
  }
  if (sys <= sMin - CRITICAL_LOW_DELTA || dia <= dMin - CRITICAL_LOW_DELTA) {
    return { class: 'critical', text: 'CRITICALLY LOW BP!' };
  }

  // Above / below configured thresholds (primary indicators)
  if (sys > sMax || dia > dMax) {
    return { class: 'high2', text: 'High BP (above threshold)' };
  }
  if (sys < sMin || dia < dMin) {
    return { class: 'low', text: 'Low BP (below threshold)' };
  }

  // Staging windows derived from thresholds (below the max)
  const sStage1Low = sMax - STAGE1_DELTA;
  const sElevatedLow = sMax - ELEVATED_DELTA;
  const dStage1Low = dMax - STAGE1_DELTA;
  const dElevatedLow = dMax - ELEVATED_DELTA;

  if ((sys >= sStage1Low && sys < sMax) || (dia >= dStage1Low && dia < dMax)) {
    return { class: 'high1', text: 'High BP: Stage 1' };
  }

  if (
    (sys >= sElevatedLow && sys < sStage1Low) ||
    (dia >= dElevatedLow && dia < dStage1Low)
  ) {
    return { class: 'elevated', text: 'Elevated BP' };
  }

  // Within configured thresholds
  if (sys >= sMin && sys <= sMax && dia >= dMin && dia <= dMax) {
    return { class: 'normal', text: 'Normal BP' };
  }

  return { class: 'elevated', text: 'Check values' };
}

export function getPulseStatus(pulse) {
  if (typeof pulse !== 'number') {
    console.error('Invalid pulse value provided to getPulseStatus');
    return 'Unknown';
  }

  const thresholds = getThresholdsSync();

  if (
    !thresholds ||
    !thresholds.pulse ||
    !thresholds.pulse.min ||
    !thresholds.pulse.max
  ) {
    console.error('Pulse thresholds not properly configured');
    return 'Unknown';
  }

  const pMin = thresholds.pulse.min;
  const pMax = thresholds.pulse.max;

  // TODO: Review pulse severity messaging.
  // Current behaviour returns simple 'Low' / 'Normal' / 'High'.
  // The UI (`modal.js`) currently looks for 'Very Low' / 'Very High' / 'CRITICAL'
  // keywords to apply more severe styling. Either restore those more
  // granular strings here (derived from numeric deltas), or update the UI
  // to derive severity classes directly from numeric values. See issue
  // to centralize decision and ensure consistent UX.
  if (pulse < pMin) return 'Low';
  if (pulse > pMax) return 'High';

  return 'Normal';
}
