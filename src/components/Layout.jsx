import React, { useState } from 'react'
import Placeholder from '../pages/Placeholder.jsx'
import Tasks from '../pages/Tasks.jsx'
import './layout.css'

const TABS = [
  { id: 'tasks', label: 'Задачи', icon: '✅', text: 'Здесь будут задачи и проекты.' },
  { id: 'notes', label: 'Заметки', icon: '📝', text: 'Здесь будут заметки и база знаний.' },
  { id: 'calendar', label: 'Календарь', icon: '📅', text: 'Здесь будет календарь.' },
  { id: 'search', label: 'Поиск', icon: '🔍', text: 'Здесь будет поиск по всему.' },
]

export default function Layout({ email, onSignOut }) {
  const [active, setActive] = useState('tasks')
  const tab = TABS.find((t) => t.id === active)
  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={'nav-item' + (t.id === active ? ' active' : '')}
              onClick={() => setActive(t.id)}
            >
              <span className="icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <div className="nav-footer">
          <span className="nav-email" title={email}>
            {email}
          </span>
          <button type="button" className="link-button nav-exit" onClick={onSignOut}>
            Выйти
          </button>
        </div>
      </nav>
      <main className="content">
        <div className="topbar-mobile">
          <button type="button" className="link-button" onClick={onSignOut}>
            Выйти
          </button>
        </div>
        {active === 'tasks' ? (
          <Tasks />
        ) : (
          <Placeholder title={tab.label} text={tab.text} />
        )}
      </main>
    </div>
  )
}