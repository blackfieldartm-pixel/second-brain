import React, { useEffect, useState } from 'react'
import { fetchSubtasks, addSubtask, setTaskDone, deleteTask } from '../lib/tasksApi.js'
import './subtasks.css'

function countOf(list) {
  return { total: list.length, done: list.filter((t) => t.status === 'done').length }
}

export default function Subtasks({ parent, onCountChange }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchSubtasks(parent.id)
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch((e) => {
        if (!cancelled) setError('Не удалось загрузить подзадачи: ' + e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [parent.id])

  function update(next) {
    setItems(next)
    onCountChange(parent.id, countOf(next))
  }

  async function handleAdd() {
    const text = title.trim()
    if (!text || busy) return
    setBusy(true)
    setError('')
    try {
      const created = await addSubtask(parent.id, text, parent.project_id)
      update([...items, created])
      setTitle('')
    } catch (err) {
      setError('Не удалось добавить: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleToggle(item) {
    const makeDone = item.status !== 'done'
    setError('')
    update(items.map((t) => (t.id === item.id ? { ...t, status: makeDone ? 'done' : 'open' } : t)))
    try {
      const saved = await setTaskDone(item.id, makeDone)
      setItems((prev) => prev.map((t) => (t.id === item.id ? saved : t)))
    } catch (err) {
      update(items)
      setError('Не удалось обновить: ' + err.message)
    }
  }

  async function handleRemove(item) {
    setError('')
    try {
      await deleteTask(item.id)
      update(items.filter((t) => t.id !== item.id))
    } catch (err) {
      setError('Не удалось удалить: ' + err.message)
    }
  }

  const { total, done } = countOf(items)

  return (
    <div className="subtasks">
      <label className="field-label">
        Подзадачи{total > 0 ? ' (' + done + '/' + total + ')' : ''}
      </label>

      {loading ? (
        <p className="task-empty">Загрузка…</p>
      ) : (
        <ul className="subtask-list">
          {items.map((item) => {
            const isDone = item.status === 'done'
            return (
              <li key={item.id} className={'subtask-item' + (isDone ? ' done' : '')}>
                <button
                  type="button"
                  className="subtask-check"
                  aria-label={isDone ? 'Вернуть в невыполненные' : 'Отметить выполненной'}
                  onClick={() => handleToggle(item)}
                >
                  {isDone ? '✓' : ''}
                </button>
                <span className="subtask-title">{item.title}</span>
                <button
                  type="button"
                  className="subtask-remove"
                  aria-label="Удалить подзадачу"
                  onClick={() => handleRemove(item)}
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="subtask-add">
        <input
          className="field"
          type="text"
          placeholder="Новая подзадача"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <button
          type="button"
          className="secondary-button"
          onClick={handleAdd}
          disabled={busy || !title.trim()}
        >
          +
        </button>
      </div>

      {error && <p className="task-error">{error}</p>}
    </div>
  )
}