import React, { useState } from 'react'
import './taskdetails.css'

// Те же наборы, что в ProjectBar.jsx
const EMOJIS = ['📁', '', '🏠', '👤', '', '📚', '💡', '🛒', '✈️', '❤️']
const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#9333ea', '#0891b2']

export default function ProjectEditor({ project, onSave, onDelete, onClose }) {
  const [name, setName] = useState(project.title)
  const [emoji, setEmoji] = useState(project.emoji || EMOJIS[0])
  const [color, setColor] = useState(project.color || COLORS[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    const title = name.trim()
    if (!title) return
    setBusy(true)
    setError('')
    try {
      await onSave({ title, emoji, color })
    } catch (err) {
      setError('Не удалось сохранить: ' + err.message)
      setBusy(false)
    }
  }

  async function handleDelete() {
    const ok = window.confirm(
      'Удалить проект «' + project.title + '»? Задачи останутся и переедут во «Входящие».'
    )
    if (!ok) return
    setBusy(true)
    setError('')
    try {
      await onDelete()
    } catch (err) {
      setError('Не удалось удалить: ' + err.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
        <div className="modal-header">
          <h2>Проект</h2>
          <button type="button" className="link-button" onClick={onClose}>
            Закрыть
          </button>
        </div>
        <label className="field-label">Название</label>
        <input
          className="field"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="field-label">Эмодзи</label>
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
        <label className="field-label">Цвет</label>
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
        {error && <p className="task-error">{error}</p>}
        <div className="form-actions modal-actions">
          <button className="task-add" type="submit" disabled={busy || !name.trim()}>
            {busy ? 'Подожди…' : 'Сохранить'}
          </button>
          <button className="secondary-button" type="button" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="danger-button"
            aria-label="Удалить проект"
            title="Удалить проект"
            onClick={handleDelete}
            disabled={busy}
          >
            🗑️
          </button>
        </div>
      </form>
    </div>
  )
}