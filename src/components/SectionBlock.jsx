import React, { useState } from 'react'
import './sections.css'

export default function SectionBlock({
  section,
  tasks,
  collapsed,
  onToggleCollapse,
  onRename,
  onDelete,
  onAddTask,
  renderTask,
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(section.title)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function saveName(e) {
    e.preventDefault()
    const text = name.trim()
    if (!text) return
    setBusy(true)
    setError('')
    try {
      await onRename(section.id, text)
      setEditing(false)
    } catch (err) {
      setError('Не удалось переименовать: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  async function removeSection() {
    const ok = window.confirm(
      'Удалить секцию «' + section.title + '»? Задачи останутся в проекте без секции.'
    )
    if (!ok) return
    setBusy(true)
    setError('')
    try {
      await onDelete(section.id)
    } catch (err) {
      setError('Не удалось удалить: ' + err.message)
      setBusy(false)
    }
  }

  async function addTask(e) {
    e.preventDefault()
    const text = newTitle.trim()
    if (!text) return
    setBusy(true)
    setError('')
    try {
      await onAddTask(section.id, text)
      setNewTitle('')
      setAdding(false)
    } catch (err) {
      setError('Не удалось добавить задачу: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section-block">
      <div className="section-header">
        <button
          type="button"
          className="section-toggle"
          aria-label={collapsed ? 'Развернуть секцию' : 'Свернуть секцию'}
          onClick={() => onToggleCollapse(section.id)}
        >
          {collapsed ? '▸' : '▾'}
        </button>

        {editing ? (
          <form className="section-rename" onSubmit={saveName}>
            <input
              className="task-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <button className="task-add" type="submit" disabled={busy || !name.trim()}>
              OK
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setEditing(false)
                setName(section.title)
              }}
            >
              Отмена
            </button>
          </form>
        ) : (
          <>
            <span className="section-title">
              {section.title}
              <span className="section-count">{tasks.length}</span>
            </span>
            <button
              type="button"
              className="section-action"
              aria-label="Добавить задачу в секцию"
              onClick={() => setAdding(true)}
            >
              +
            </button>
            <button
              type="button"
              className="section-action"
              aria-label="Переименовать секцию"
              onClick={() => {
                setName(section.title)
                setEditing(true)
              }}
            >
              ✏️
            </button>
            <button
              type="button"
              className="section-action"
              aria-label="Удалить секцию"
              onClick={removeSection}
              disabled={busy}
            >
              🗑️
            </button>
          </>
        )}
      </div>

      {adding && (
        <form className="section-add-form" onSubmit={addTask}>
          <input
            className="task-input"
            type="text"
            placeholder="Новая задача в секции"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <button className="task-add" type="submit" disabled={busy || !newTitle.trim()}>
            Добавить
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setAdding(false)
              setNewTitle('')
            }}
          >
            Отмена
          </button>
        </form>
      )}

      {!collapsed && tasks.length > 0 && <ul className="task-list">{tasks.map(renderTask)}</ul>}
      {!collapsed && tasks.length === 0 && !adding && (
        <p className="task-empty section-empty">В секции пока нет задач.</p>
      )}

      {error && <p className="task-error">{error}</p>}
    </section>
  )
}