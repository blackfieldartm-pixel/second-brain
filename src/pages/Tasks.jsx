import React, { useEffect, useState } from 'react'
import { fetchInboxTasks, addTask, setTaskDone } from '../lib/tasksApi.js'
import './tasks.css'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchInboxTasks()
      .then(setTasks)
      .catch((e) => setError('Не удалось загрузить задачи: ' + e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    const text = title.trim()
    if (!text) return
    setAdding(true)
    setError('')
    try {
      const created = await addTask(text)
      setTasks((prev) => [created, ...prev])
      setTitle('')
    } catch (err) {
      setError('Не удалось добавить задачу: ' + err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleToggle(task) {
    const makeDone = task.status !== 'done'
    setError('')
    // сразу показываем результат; если база не ответила, вернём как было
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: makeDone ? 'done' : 'open' } : t))
    )
    try {
      const updated = await setTaskDone(task.id, makeDone)
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)))
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
      setError('Не удалось обновить задачу: ' + err.message)
    }
  }

  const openTasks = tasks.filter((t) => t.status !== 'done')
  const doneTasks = tasks.filter((t) => t.status === 'done')

  function renderTask(task) {
    const isDone = task.status === 'done'
    return (
      <li key={task.id} className={'task-item' + (isDone ? ' done' : '')}>
        <button
          type="button"
          className="task-check"
          aria-label={isDone ? 'Вернуть в невыполненные' : 'Отметить выполненной'}
          onClick={() => handleToggle(task)}
        >
          {isDone ? '✓' : ''}
        </button>
        <span className="task-title">{task.title}</span>
      </li>
    )
  }

  return (
    <div className="tasks">
      <h1>Входящие</h1>

      <form className="task-form" onSubmit={handleAdd}>
        <input
          className="task-input"
          type="text"
          placeholder="Новая задача"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="task-add" type="submit" disabled={adding || !title.trim()}>
          Добавить
        </button>
      </form>

      {error && <p className="task-error">{error}</p>}

      {loading ? (
        <p>Загрузка…</p>
      ) : (
        <>
          {openTasks.length === 0 && <p className="task-empty">Пока нет задач. Добавь первую.</p>}
          <ul className="task-list">{openTasks.map(renderTask)}</ul>
          {doneTasks.length > 0 && (
            <>
              <h2 className="task-subtitle">Выполненные ({doneTasks.length})</h2>
              <ul className="task-list">{doneTasks.map(renderTask)}</ul>
            </>
          )}
        </>
      )}
    </div>
  )
}