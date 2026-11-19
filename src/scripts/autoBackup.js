// Opt-in auto backup: writes the current user's export JSON to a user-chosen folder
// whenever data changes. Uses the File System Access API (Chromium only); hidden elsewhere.

import Dexie from 'dexie';
import { getCurrentUserSync } from './storage.js';
import { buildBackupJson } from './ui/dataManagement.js';

// Separate DB so the readings schema stays untouched. Directory handles are structured-cloneable.
const db = new Dexie('BPAutoBackup');
db.version(1).stores({ kv: '' });
const DIR_KEY = 'dir';
const RW = { mode: 'readwrite' };

export const isAutoBackupSupported = () =>
  typeof window !== 'undefined' && 'showDirectoryPicker' in window;

export const getBackupDir = () => db.kv.get(DIR_KEY);

export function backupFileName(user) {
  if (!user || user.id == null) return 'bp-backup.json';
  const safe = String(user.username ?? '').replace(/[^\w-]+/g, '_');
  return `bp-backup-${user.id}-${safe}.json`;
}

/** @returns {Promise<'off'|'needs-permission'|'on'>} */
export async function getBackupStatus() {
  const dir = await getBackupDir();
  if (!dir) return 'off';
  return (await dir.queryPermission(RW)) === 'granted' ? 'on' : 'needs-permission';
}

/** Must be called from a user gesture (shows the folder picker). */
export async function chooseBackupDir() {
  const dir = await window.showDirectoryPicker({ id: 'bp-backup', ...RW });
  await db.kv.put(dir, DIR_KEY);
  await runBackup();
  return dir;
}

/** Must be called from a user gesture (permission prompt). */
export async function regrantBackupPermission() {
  const dir = await getBackupDir();
  if (!dir || (await dir.requestPermission(RW)) !== 'granted') return false;
  return runBackup();
}

export const disableAutoBackup = () => db.kv.delete(DIR_KEY);

export async function writeBackup(dir) {
  const file = await dir.getFileHandle(backupFileName(getCurrentUserSync()), {
    create: true,
  });
  const writable = await file.createWritable();
  await writable.write(await buildBackupJson());
  await writable.close();
}

/** Writes a backup if enabled and permitted. Returns true when a file was written. */
export async function runBackup() {
  const dir = await getBackupDir();
  if (!dir || (await dir.queryPermission(RW)) !== 'granted') return false;
  await writeBackup(dir);
  return true;
}

let timer = null;
export function scheduleBackup() {
  if (!isAutoBackupSupported()) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    runBackup().catch((e) => console.warn('Auto backup failed', e));
  }, 1000);
}
