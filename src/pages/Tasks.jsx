import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchTasksForView,
  fetchSubtaskCounts,
  addTask,
  setTaskDone,
  updateTask,
  deleteTask,
} from '../lib/tasksApi.js'
import { fetchProjects, addProject, updateProject, deleteProject } from '../lib/projectsApi.js'
import { formatDue, isOverdue, dueAtDay, dueInView } from '../lib/dateUtils.js'
import { SYSTEM_VIEWS, isSystemView } from '../lib/views.js'
import { useAutoRefresh } from '../lib/useSync.js'
import ProjectBar from '../components/ProjectBar.jsx'
import ProjectEditor from '../components/ProjectEditor.jsx'
import TaskDetails from '../components/TaskDetails.jsx'
import './tasks.css'
import '../components/projecteditor.css'

// Ключи локального кэша: последние данные для мгновенного открытия
const CACHE_TASKS = 'sb2_tasks_'
const CACHE_PROJECTS = 'sb2_projects'

function readCache(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // память недоступна или переполнена — просто работаем без кэша
  }
}

// Сначала задачи с ближайшим сроком, потом без срока; при равенстве выше приоритет, потом новее
function sortOpen(a, b) {
  const ad = a.due_at ? new Date(a.due_at).getTime() : Infinity
  const bd = b.due_at ? new Date(b.due_at).getTime() : Infinity
  if (ad !== bd) return ad - bd
  if (a.priority !== b.priority) return b.priority - a.priority
  return new Date(b.created_at) - new Date(a.created_at)
}

// Остаётся ли задача в текущей папке после изменений
function belongsToView(task, view) {
  if (view === 'inbox') return !task.project_id
  if (view === 'done') return task.status === 'done'
  if (view === 'today' || view === 'tomorrow' || view === 'soon') {
    return dueInView(task.due_at, view)
  }
  return task.project_id === view
}

const EMPTY_TEXT = {
  today: 'На сегодня задач нет.',
  tomorrow: 'На завтра задач нет.',
  soon: 'Нет задач со сроком позже завтрашнего дня.',
  done: 'Пока нет выполненных задач.',
}

export default function Tasks() {
  const [projects, setProjects] = useState([])
  const [view, setView] = useState('inbox')
  const [tasks, setTasks] = useState([])
  const [subCounts, setSubCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editingProject, setEditingProject] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const viewRef = useRef(view)
  viewRef.current = view
  const isSystem = isSystemView(view)
  const projectId = isSystem ? null : view

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])
  const online = useAutoRefresh(refresh)

  // Проекты: сначала из кэша, затем свежие из базы
  useEffect(() => {
    const cached = readCache(CACHE_PROJECTS)
    if (cached) setProjects(cached)
    fetchProjects()
      .then((data) => {
        setProjects(data)
        writeCache(CACHE_PROJECTS, data)
      })
      .catch((e) => {
        if (!cached) setError('Не удалось загрузить проекты: ' + e.message)
      })
  }, [])

  // Задачи папки: сначала из кэша, затем свежие из базы
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setTasks([])
    setSubCounts({})
    const cached = readCache(CACHE_TASKS + view)
    if (cached) {
      setTasks(cached)
      setLoading(false)
    }
    fetchTasksForView(view)
      .then(async (data) => {
        const counts = await fetchSubtaskCounts(data.map((t) => t.id)).catch(() => ({}))
        if (cancelled) return
        setTasks(data)
        setSubCounts(counts)
        writeCache(CACHE_TASKS + view, data)
      })
      .catch((e) => {
        // если показали кэш, ошибку не пугаем: данные на экране, индикатор покажет «нет связи»
        if (!cancelled && !cached) setError('Не удалось загрузить задачи: ' + e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [view])

  // Тихое обновление по событиям: realtime, возврат в приложение, появление сети
  useEffect(() => {
    if (refreshKey === 0) return
    const viewId = viewRef.current
    fetchProjects()
      .then((data) => {
        setProjects(data)
        writeCache(CACHE_PROJECTS, data)
      })
      .catch(() => {})
    fetchTasksForView(viewId)
      .then(async (data) => {
        const counts = await fetchSubtaskCounts(data.map((t) => t.id)).catch(() => ({}))
        setTasks(data)
        setSubCounts(counts)
        writeCache(CACHE_TASKS + viewId, data)
      })
      .catch(() => {})
  }, [refreshKey])

  function handleSelect(id) {
    setError('')
    setView(id)
  }

  async function handleCreateProject(values) {
    const created = await addProject(values)
    setProjects((prev) => [...prev, created])
    setView(created.id)
  }

  async function handleSaveProject(fields) {
    const updated = await updateProject(view, fields)
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    setEditingProject(false)
  }

  async function handleDeleteProject() {
    await deleteProject(view)
    setProjects((prev) => prev.filter((p) => p.id !== view))
    setEditingProject(false)
    setView('inbox')
  }

  async function handleAdd(e) {
    e.preventDefault()
    const text = title.trim()
    if (!text) return
    setAdding(true)
    setError('')
    try {
      let extra = {}
      if (view === 'today') extra = dueAtDay(0)
      if (view === 'tomorrow') extra = dueAtDay(1)
      const created = await addTask(text, projectId, extra)
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
      if (view === 'done' && !makeDone) {
        // вернули в работу: в папке «Выполненные» ей больше не место
        setTasks((prev) => prev.filter((t) => t.id !== task.id))
      } else {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)))
      }
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
      setError('Не удалось обновить задачу: ' + err.message)
    }
  }

  async function handleSaveTask(fields) {
    const updated = await updateTask(selected.id, fields)
    setTasks((prev) =>
      belongsToView(updated, view)
        ? prev.map((t) => (t.id === updated.id ? updated : t))
        : prev.filter((t) => t.id !== updated.id)
    )
    setSelected(null)
  }

  async function handleDeleteTask() {
    await deleteTask(selected.id)
    setTasks((prev) => prev.filter((t) => t.id !== selected.id))
    setSelected(null)
  }

  function handleSubtasksChange(parentId, counts) {
    setSubCounts((prev) => ({ ...prev, [parentId]: counts }))
  }

  function projectLabel(task) {
    if (!task.project_id) return '📥 Входящие'
    const p = projects.find((x) => x.id === task.project_id)
    return p ? (p.emoji || '📁') + ' ' + p.title : ''
  }

  const systemView = SYSTEM_VIEWS.find((v) => v.id === view)
  const activeProject = projects.find((p) => p.id === view)
  const heading = systemView
    ? systemView.emoji + ' ' + systemView.label
    : activeProject
    ? (activeProject.emoji || '📁') + ' ' + activeProject.title
    : ''
  const showProjectInMeta = isSystem && view !== 'inbox'
  const showAddForm = view !== 'soon' && view !== 'done'
  const openTasks = tasks.filter((t) => t.status !== 'done').sort(sortOpen)
  const doneTasks = tasks.filter((t) => t.status === 'done')

  function renderTask(task) {
    const isDone = task.status === 'done'
    const due = formatDue(task)
    const overdue = isOverdue(task)
    const sub = subCounts[task.id]
    const parts = []
    if (due) parts.push(due)
    if (showProjectInMeta) {
      const label = projectLabel(task)
      if (label) parts.push(label)
    }
    if (sub && sub.total > 0) parts.push('☑ ' + sub.done + '/' + sub.total)
    if (task.note) parts.push('📝')
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
          {parts.length > 0 && (
            <span className={'task-meta' + (overdue ? ' overdue' : '')}>{parts.join(' · ')}</span>
          )}
        </button>
      </li>
    )
  }

  function renderBody() {
    if (loading) return <p>Загрузка…</p>
    if (view === 'done') {
      return doneTasks.length === 0 ? (
        <p className="task-empty">{EMPTY_TEXT.done}</p>
      ) : (
        <ul className="task-list">{doneTasks.map(renderTask)}</ul>
      )
    }
    return (
      <>
        {openTasks.length === 0 && (
          <p className="task-empty">{EMPTY_TEXT[view] || 'Пока нет задач. Добавь первую.'}</p>
        )}
        <ul className="task-list">{openTasks.map(renderTask)}</ul>
        {doneTasks.length > 0 && (
          <>
            <h2 className="task-subtitle">Выполненные ({doneTasks.length})</h2>
            <ul className="task-list">{doneTasks.map(renderTask)}</ul>
          </>
        )}
      </>
    )
  }

  return (
    <div className="tasks">
      <ProjectBar
        projects={projects}
        activeId={view}
        onSelect={handleSelect}
        onCreate={handleCreateProject}
      />
      <div className="heading-row">
        <h1>{heading}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
          <span
            style={{ fontSize: 13, color: online ? '#16a34a' : '#dc2626', whiteSpace: 'nowrap' }}
          >
            {online ? '🔄 Синхронизировано' : '⚠️ Нет связи'}
          </span>
          {activeProject && (
            <button
              type="button"
              className="secondary-button edit-project"
              onClick={() => setEditingProject(true)}
            >
              ✏️ Изменить
            </button>
          )}
        </div>
      </div>
      {showAddForm && (
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
      )}
      {error && <p className="task-error">{error}</p>}
      {renderBody()}
      {selected && (
        <TaskDetails
          key={selected.id}
          task={selected}
          projects={projects}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onClose={() => setSelected(null)}
          onSubtasksChange={handleSubtasksChange}
        />
      )}
      {editingProject && activeProject && (
        <ProjectEditor
          key={activeProject.id}
          project={activeProject}
          onSave={handleSaveProject}
          onDelete={handleDeleteProject}
          onClose={() => setEditingProject(false)}
        />
      )}
    </div>
  )
}