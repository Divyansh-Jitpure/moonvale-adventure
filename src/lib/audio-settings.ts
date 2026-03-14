export const AUDIO_SETTINGS_STORAGE_KEY = "moonvale-audio-enabled";
export const AUDIO_SETTINGS_EVENT = "moonvale-audio-settings-updated";

export function readAudioEnabled(raw?: string | null) {
  if (raw === "false") return false;
  return true;
}

export function readStoredAudioEnabled(storage?: Storage) {
  if (!storage) return true;
  return readAudioEnabled(storage.getItem(AUDIO_SETTINGS_STORAGE_KEY));
}

export function saveStoredAudioEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUDIO_SETTINGS_STORAGE_KEY, String(enabled));
  window.dispatchEvent(new CustomEvent<boolean>(AUDIO_SETTINGS_EVENT, { detail: enabled }));
}
