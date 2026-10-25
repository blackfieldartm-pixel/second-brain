import React, { useState } from 'react'
import { SYSTEM_VIEWS } from '../lib/views.js'
import { EMOJIS, COLORS } from '../lib/palettes.js'

function chipStyle(accent, active) {
  return active
    ? { background: accent, borderColor: accent, color: '#fff' }
    : { borderColor: accent }
}

export default function ProjectBar({ projects, activeId, onSelect, onCreate }) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [color, setColor] = useState(COLORS[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function closeForm() {
    setShowForm(false)
    setName('')
    setEmoji(EMOJIS[0])
    setColor(COLORS[0])
    setError('')
  }

  async function submit(e) {
    e.preventDefault()
    const title = name.trim()
    if (!title) return
    setBusy(true)
    setError('')
    try {
      await onCreate({ title, emoji, color })
      closeForm()
    } catch (err) {
      setError('Не удалось создать проект: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="project-bar">
        {SYSTEM_VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={'chip' + (v.id === activeId ? ' active' : '')}
            style={chipStyle(v.color, v.id === activeId)}
            onClick={() => onSelect(v.id)}
          >
            {v.emoji + ' ' + v.label}
          </button>
        ))}
      </div>
      <div className="project-bar">
        {projects.map((p) => (
          <button
            key={p.id}
            type="button"
            className={'chip' + (p.id === activeId ? ' active' : '')}
            style={chipStyle(p.color || '#2563eb', p.id === activeId)}
            onClick={() => onSelect(p.id)}
          >
            {(p.emoji || '📁') + ' ' + p.title}
          </button>
        ))}
        <button type="button" className="chip chip-add" onClick={() => setShowForm(true)}>
          + Проект
        </button>
      </div>
      {showForm && (
        <form className="project-form" onSubmit={submit}>
          <input
            className="task-input"
            type="text"
            placeholder="Название проекта"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="picker">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className={'pick' + (e === emoji ? ' selected' : '')}
                onClick={() => setEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="picker">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={'Цвет ' + c}
                className={'color-pick' + (c === color ? ' selected' : '')}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <div className="form-actions">
            <button className="task-add" type="submit" disabled={busy || !name.trim()}>
              {busy ? 'Создаю…' : 'Создать'}
            </button>
            <button className="secondary-button" type="button" onClick={closeForm}>
              Отмена
            </button>
          </div>
          {error && <p className="task-error">{error}</p>}
        </form>
      )}
    </div>
  )
}