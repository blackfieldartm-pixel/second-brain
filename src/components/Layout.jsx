import React, { useState } from 'react'
import Placeholder from '../pages/Placeholder.jsx'
import Tasks from '../pages/Tasks.jsx'
import Settings from '../pages/Settings.jsx'
import './layout.css'

const TABS = [
  { id: 'tasks', label: 'Задачи', icon: '✅', text: 'Здесь будут задачи и проекты.' },
  { id: 'notes', label: 'Заметки', icon: '📝', text: 'Здесь будут заметки и база знаний.' },
  { id: 'calendar', label: 'Календарь', icon: '📅', text: 'Здесь будет календарь.' },
  { id: 'search', label: 'Поиск', icon: '🔍', text: 'Здесь будет поиск по всему.' },
  { id: 'settings', label: 'Настройки', icon: '⚙️', text: '' },
]

export default function Layout({ email, onSignOut }) {
  const [active, setActive] = useState('tasks')
  const tab = TABS.find((t) => t.id === active)
  return (
    <div className="app">
      <nav className="nav">
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
      </nav>
      <main className="content">
        {active === 'tasks' ? (
          <Tasks />
        ) : active === 'settings' ? (
          <Settings email={email} onSignOut={onSignOut} />
        ) : (
          <Placeholder title={tab.label} text={tab.text} />
        )}
      </main>
    </div>
  )
}