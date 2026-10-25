import React, { useEffect, useState } from 'react'
import { fetchTasks, addTask, setTaskDone, updateTask, deleteTask } from '../lib/tasksApi.js'
import { fetchProjects, addProject } from '../lib/projectsApi.js'
import { formatDue, isOverdue } from '../lib/dateUtils.js'
import ProjectBar from '../components/ProjectBar.jsx'
import TaskDetails from '../components/TaskDetails.jsx'
import './tasks.css'

// Сначала задачи с ближайшим сроком, потом без срока; при равенстве выше приоритет, потом новее
function sortOpen(a, b) {
  const ad = a.due_at ? new Date(a.due_at).getTime() : Infinity
  const bd = b.due_at ? new Date(b.due_at).getTime() : Infinity
  if (ad !== bd) return ad - bd
  if (a.priority !== b.priority) return b.priority - a.priority
  return new Date(b.created_at) - new Date(a.created_at)
}

export default function Tasks() {
  const [projects, setProjects] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch((e) => setError('Не удалось загрузить проекты: ' + e.message))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setTasks([])
    fetchTasks(activeId)
      .then((data) => {
        if (!cancelled) setTasks(data)
      })
      .catch((e) => {
        if (!cancelled) setError('Не удалось загрузить задачи: ' + e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeId])

  function handleSelect(id) {
    setError('')
    setActiveId(id)
  }

  async function handleCreateProject(values) {
    const created = await addProject(values)
    setProjects((prev) => [...prev, created])
    setActiveId(created.id)
  }

  async function handleAdd(e) {
    e.preventDefault()
    const text = title.trim()
    if (!text) return
    setAdding(true)
    setError('')
    try {
      const created = await addTask(text, activeId)
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

  async function handleSaveTask(fields) {
    const updated = await updateTask(selected.id, fields)
    setTasks((prev) => {
      const moved = (updated.project_id || null) !== (activeId || null)
      return moved
        ? prev.filter((t) => t.id !== updated.id)
        : prev.map((t) => (t.id === updated.id ? updated : t))
    })
    setSelected(null)
  }

  async function handleDeleteTask() {
    await deleteTask(selected.id)
    setTasks((prev) => prev.filter((t) => t.id !== selected.id))
    setSelected(null)
  }

  const activeProject = projects.find((p) => p.id === activeId)
  const heading = activeProject
    ? (activeProject.emoji || '📁') + ' ' + activeProject.title
    : 'Входящие'

  const openTasks = tasks.filter((t) => t.status !== 'done').sort(sortOpen)
  const doneTasks = tasks.filter((t) => t.status === 'done')

  function renderTask(task) {
    const isDone = task.status === 'done'
    const due = formatDue(task)
    const overdue = isOverdue(task)
    return (
      <li key={task.id} className={'task-item p' + task.priority + (isDone ? ' done' : '')}>
        <button
          type="button"
          className="task-check"
          aria-label={isDone ? 'Вернуть в невыполненные' : 'Отметить выполненной'}
          onClick={() => handleToggle(task)}
        >
          {isDone ? '✓' : ''}
        </button>
        <button type="button" className="task-body" onClick={() => setSelected(task)}>
          <span className="task-title">{task.title}</span>
          {(due || task.note) && (
            <span className={'task-meta' + (overdue ? ' overdue' : '')}>
              {due}
              {due && task.note ? ' · ' : ''}
              {task.note ? '📝' : ''}
            </span>
          )}
        </button>
      </li>
    )
  }

  return (
    <div className="tasks">
      <ProjectBar
        projects={projects}
        activeId={activeId}
        onSelect={handleSelect}
        onCreate={handleCreateProject}
      />

      <h1>{heading}</h1>

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

      {selected && (
        <TaskDetails
          key={selected.id}
          task={selected}
          projects={projects}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}