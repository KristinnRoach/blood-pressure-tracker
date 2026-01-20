// Blood pressure categorization and pulse status functions
import { getThresholdsSync } from '../storage.js';

export function getCategory(sys, dia) {
  const thresholds = getThresholdsSync();
  const sLow = thresholds?.systolic?.low ?? 90;
  const sHigh = thresholds?.systolic?.high ?? 140;
  const dLow = thresholds?.diastolic?.low ?? 60;
  const dHigh = thresholds?.diastolic?.high ?? 90;

  // Keep fixed critical boundaries for extremes
  if (sys > 180 || dia > 120) {
    return { class: 'critical', text: 'CRITICALLY HIGH BP!' };
  }

  if (sys < 70 || dia < 50) {
    return { class: 'critical', text: 'CRITICALLY LOW BP!' };
  }

  // Respect user-configured "too high" / "too low" thresholds
  if (sys > sHigh || dia > dHigh) {
    return { class: 'high2', text: 'High BP (custom threshold)' };
  }

  if (sys < sLow || dia < dLow) {
    return { class: 'low', text: 'Low BP (custom threshold)' };
  }

  // Fallback to original category logic for intermediate tiers
  if (sys < 90 || dia < 60) {
    return { class: 'low', text: 'Low BP' };
  }

  if (sys >= 140 || dia >= 90) {
    return { class: 'high2', text: 'High BP: Stage 2' };
  }
  if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
    return { class: 'high1', text: 'High BP: Stage 1' };
  }
  if (sys >= 120 && sys <= 129 && dia < 80) {
    return { class: 'elevated', text: 'Elevated BP' };
  }
  if (sys >= 90 && sys < 120 && dia >= 60 && dia < 80) {
    return { class: 'normal', text: 'Normal BP' };
  }
  return { class: 'elevated', text: 'Check values' };
}

export function getPulseStatus(pulse) {
  const thresholds = getThresholdsSync();
  const pLow = thresholds?.pulse?.low ?? 50;
  const pHigh = thresholds?.pulse?.high ?? 100;

  if (pulse < 40) return 'CRITICAL - Seek immediate medical attention';
  if (pulse < 50) return 'Very Low - Consult doctor';

  // Custom low
  if (pulse < pLow) return 'Low (custom threshold)';

  if (pulse > 150) return 'CRITICAL - Seek immediate medical attention';
  if (pulse > 120) return 'Very High - Consult doctor';

  // Custom high
  if (pulse > pHigh) return 'High (custom threshold)';

  if (pulse > 100) return 'High';
  return 'Normal';
}
