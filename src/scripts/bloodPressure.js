// Blood pressure categorization and pulse status functions

export function getCategory(sys, dia) {
  if (sys > 180 || dia > 120) {
    return {
      class: 'crisis',
      text: 'CRISIS - Seek immediate medical attention',
    };
  }
  if (sys < 90 || dia < 60) {
    return {
      class: 'low',
      text: 'Low Blood Pressure - Consult healthcare provider',
    };
  }
  if (sys >= 140 || dia >= 90) {
    return { class: 'high2', text: 'High Blood Pressure Stage 2' };
  }
  if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
    return { class: 'high1', text: 'High Blood Pressure Stage 1' };
  }
  if (sys >= 120 && sys <= 129 && dia < 80) {
    return { class: 'elevated', text: 'Elevated Blood Pressure' };
  }
  if (sys >= 90 && sys < 120 && dia >= 60 && dia < 80) {
    return { class: 'normal', text: 'Normal Blood Pressure' };
  }
  return { class: 'elevated', text: 'Check values' };
}

export function getPulseStatus(pulse) {
  if (pulse < 50) return 'Very Low - Consult doctor';
  if (pulse < 60) return 'Low';
  if (pulse > 120) return 'Very High - Consult doctor';
  if (pulse > 100) return 'High';
  return 'Normal';
}
