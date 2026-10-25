// Локальная память устройства: кэш данных и настройки экрана
export function readJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // память недоступна — работаем без кэша
  }
}

export function readText(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback
  } catch {
    return fallback
  }
}

export function writeText(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // память недоступна — просто не запоминаем
  }
}