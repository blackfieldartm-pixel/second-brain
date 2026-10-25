import React from 'react'
import './settings.css'

export default function Settings({ email, onSignOut }) {
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
        <p className="settings-note">
          Здесь позже появятся: тема оформления, уведомления, сортировки и другие настройки.
        </p>
      </section>
    </div>
  )
}