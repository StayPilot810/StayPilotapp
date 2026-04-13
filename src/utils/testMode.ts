const TEST_MODE_KEY = 'sm_test_mode_enabled'

export function isTestModeEnabled() {
  try {
    return localStorage.getItem(TEST_MODE_KEY) === '1'
  } catch {
    return false
  }
}

export function setTestModeEnabled(enabled: boolean) {
  try {
    localStorage.setItem(TEST_MODE_KEY, enabled ? '1' : '0')
  } catch {
    // ignore storage failures in restricted contexts
  }
}
