// Storage operations for blood pressure readings
// Currently using localStorage, will be replaced with IndexedDB in task 3

export function saveReading(reading) {
  let history = getReadings();
  history.unshift(reading);
  localStorage.setItem('bpHistory', JSON.stringify(history));
}

export function getReadings() {
  return JSON.parse(localStorage.getItem('bpHistory') || '[]');
}

export function deleteReading(index) {
  let history = getReadings();
  history.splice(index, 1);
  localStorage.setItem('bpHistory', JSON.stringify(history));
}

export function clearReadings() {
  localStorage.removeItem('bpHistory');
}
