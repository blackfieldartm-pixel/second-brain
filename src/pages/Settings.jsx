import React, { useState } from 'react'
import './settings.css'

const THEME_KEY = 'sb2_theme'

const THEMES = [
  { id: 'system', label: 'Как в системе' },
  { id: 'light', label: 'Светлая' },
  { id: 'dark', label: 'Тёмная' },
]

function readTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

function applyTheme(mode) {
  const root = document.documentElement
  if (mode === 'light' || mode === 'dark') {
    root.setAttribute('data-theme', mode)
  } else {
    root.removeAttribute('data-theme')
  }
  try {
    if (mode === 'system') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, mode)
  } catch {
    // память недоступна: тема не запомнится
  }
}

export default function Settings({ email, onSignOut }) {
  const [theme, setTheme] = useState(readTheme)

  function choose(mode) {
    setTheme(mode)
    applyTheme(mode)
  }

  return (
    <div className="settings">
      <h1>⚙️ Настройки</h1>
      <section className="settings-card">
        <h2>Аккаунт</h2>
        <p className="settings-email">{email}</p>
        <button type="button" className="secondary-button" onClick={onSignOut}>
          Выйти
        </button>
      </section>
      <section className="settings-card">
        <h2>Приложение</h2>
        <span className="settings-label">Тема оформления</span>
        <div className="theme-options">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={'theme-option' + (t.id === theme ? ' selected' : '')}
              onClick={() => choose(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="settings-note">
          Здесь позже появятся: уведомления, сортировки и другие настройки.
        </p>
      </section>
    </div>
  )
}