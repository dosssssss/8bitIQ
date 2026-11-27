import * as SecureStore from 'expo-secure-store';

// Keeps the login on the phone so players stay logged in after closing the
// app. SecureStore uses the iOS Keychain / Android Keystore. Every call is
// wrapped, because storage can be missing (for example in a browser).
const KEY = '8bitiq.session';

export async function saveSession(user, token) {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify({ user, token }));
  } catch {
    // Not saved: the player just has to log in again next time.
  }
}

// Returns { user, token } or null.
export async function loadSession() {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    const saved = raw ? JSON.parse(raw) : null;
    return saved && saved.token && saved.user ? saved : null;
  } catch {
    return null;
  }
}

export async function clearSession() {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Nothing to clear.
  }
}