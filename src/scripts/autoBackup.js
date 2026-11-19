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

/** @returns {Promise<{status: 'off'|'needs-permission'|'on', name?: string}>} */
export async function getBackupStatus() {
  const dir = await getBackupDir();
  if (!dir) return { status: 'off' };
  const granted = (await dir.queryPermission(RW)) === 'granted';
  return { status: granted ? 'on' : 'needs-permission', name: dir.name };
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

// The user is resolved once so the filename and data always match.
export async function writeBackup(dir, user = getCurrentUserSync()) {
  const file = await dir.getFileHandle(backupFileName(user), { create: true });
  const writable = await file.createWritable();
  await writable.write(await buildBackupJson(user));
  await writable.close();
}

/** Writes a backup if enabled and permitted. Returns true when a file was written. */
export async function runBackup(user = getCurrentUserSync()) {
  const dir = await getBackupDir();
  if (!dir || (await dir.queryPermission(RW)) !== 'granted') return false;
  await writeBackup(dir, user);
  return true;
}

// One debounce timer per user (a user switch must not drop the previous user's backup),
// and writes run one at a time so an older snapshot can't finish last.
const timers = new Map();
let queue = Promise.resolve();

export function scheduleBackup() {
  if (!isAutoBackupSupported()) return;
  const user = getCurrentUserSync();
  const key = user?.id ?? 'default';
  clearTimeout(timers.get(key));
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      queue = queue
        .then(() => runBackup(user))
        .catch((e) => console.warn('Auto backup failed', e));
    }, 1000),
  );
}
