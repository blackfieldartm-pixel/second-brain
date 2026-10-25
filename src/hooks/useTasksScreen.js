import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchTasksForView,
  fetchSubtaskCounts,
  addTask,
  setTaskDone,
  updateTask,
  deleteTask,
} from '../lib/tasksApi.js'
import { fetchProjects, addProject, updateProject, deleteProject } from '../lib/projectsApi.js'
import { fetchSections, addSection, renameSection, deleteSection } from '../lib/sectionsApi.js'
import { dueAtDay, dueInView } from '../lib/dateUtils.js'
import { isSystemView } from '../lib/views.js'
import { useAutoRefresh } from '../lib/useSync.js'
import { readJSON, writeJSON, readText, writeText } from '../lib/localCache.js'

// Ключи локального кэша и настроек экрана
const CACHE_TASKS = 'sb2_tasks_'
const CACHE_PROJECTS = 'sb2_projects'
const CACHE_SECTIONS = 'sb2_sections_'
const COLLAPSED_KEY = 'sb2_collapsed_sections'
const LAST_VIEW_KEY = 'sb2_last_view'
const HIDE_DONE_KEY = 'sb2_hide_done'

// Остаётся ли задача в текущей папке после изменений
function belongsToView(task, view) {
  if (view === 'inbox') return !task.project_id
  if (view === 'favorites') return Boolean(task.is_favorite) && task.status !== 'done'
  if (view === 'done') return task.status === 'done'
  if (view === 'today' || view === 'tomorrow' || view === 'soon') {
    return dueInView(task.due_at, view)
  }
  return task.project_id === view
}

// Все данные и обработчики экрана задач в одном месте
export function useTasksScreen() {
  const [projects, setProjects] = useState([])
  const [projectsLoaded, setProjectsLoaded] = useState(false)
  const [view, setView] = useState(() => readText(LAST_VIEW_KEY, 'inbox'))
  const [tasks, setTasks] = useState([])
  const [sections, setSections] = useState([])
  const [collapsed, setCollapsed] = useState(() => readJSON(COLLAPSED_KEY) || {})
  const [subCounts, setSubCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editingProject, setEditingProject] = useState(false)
  const [hideDone, setHideDone] = useState(() => readText(HIDE_DONE_KEY, '0') === '1')
  const [refreshKey, setRefreshKey] = useState(0)
  const viewRef = useRef(view)
  viewRef.current = view
  const isSystem = isSystemView(view)
  const projectId = isSystem ? null : view

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])
  const online = useAutoRefresh(refresh)

  // Проекты: сначала из кэша, затем свежие из базы
  useEffect(() => {
    const cached = readJSON(CACHE_PROJECTS)
    if (cached) setProjects(cached)
    fetchProjects()
      .then((data) => {
        setProjects(data)
        setProjectsLoaded(true)
        writeJSON(CACHE_PROJECTS, data)
      })
      .catch((e) => {
        if (!cached) setError('Не удалось загрузить проекты: ' + e.message)
      })
  }, [])

  // Запоминаем последнюю папку и настройку скрытия выполненных
  useEffect(() => {
    writeText(LAST_VIEW_KEY, view)
  }, [view])

  useEffect(() => {
    writeText(HIDE_DONE_KEY, hideDone ? '1' : '0')
  }, [hideDone])

  // Если сохранённый проект удалён — возвращаемся во «Входящие»
  useEffect(() => {
    if (projectsLoaded && !isSystemView(view) && !projects.some((p) => p.id === view)) {
      setView('inbox')
    }
  }, [projectsLoaded, projects, view])

  // Задачи папки: сначала из кэша, затем свежие из базы
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setTasks([])
    setSubCounts({})
    const cached = readJSON(CACHE_TASKS + view)
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
        writeJSON(CACHE_TASKS + view, data)
      })
      .catch((e) => {
        if (!cancelled && !cached) setError('Не удалось загрузить задачи: ' + e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [view])

  // Секции проекта: сначала из кэша, затем свежие из базы (в системных папках секций нет)
  useEffect(() => {
    if (isSystemView(view)) {
      setSections([])
      return undefined
    }
    let cancelled = false
    setSections(readJSON(CACHE_SECTIONS + view) || [])
    fetchSections(view)
      .then((data) => {
        if (cancelled) return
        setSections(data)
        writeJSON(CACHE_SECTIONS + view, data)
      })
      .catch(() => {})
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
        writeJSON(CACHE_PROJECTS, data)
      })
      .catch(() => {})
    if (!isSystemView(viewId)) {
      fetchSections(viewId)
        .then((data) => {
          setSections(data)
          writeJSON(CACHE_SECTIONS + viewId, data)
        })
        .catch(() => {})
    }
    fetchTasksForView(viewId)
      .then(async (data) => {
        const counts = await fetchSubtaskCounts(data.map((t) => t.id)).catch(() => ({}))
        setTasks(data)
        setSubCounts(counts)
        writeJSON(CACHE_TASKS + viewId, data)
      })
      .catch(() => {})
  }, [refreshKey])

  function selectView(id) {
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
      if (view === 'favorites') extra = { is_favorite: true }
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

  // Звёздочка: добавить в избранное или убрать
  async function handleToggleFavorite(task) {
    const next = !task.is_favorite
    setError('')
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_favorite: next } : t)))
    try {
      const updated = await updateTask(task.id, { is_favorite: next })
      if (view === 'favorites' && !next) {
        // убрали из избранного: в этой папке ей больше не место
        setTasks((prev) => prev.filter((t) => t.id !== task.id))
      } else {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)))
      }
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
      setError('Не удалось обновить избранное: ' + err.message)
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

  // Секции: ошибки пробрасываем наверх, их показывает сам блок секции
  async function handleAddSection(sectionTitle) {
    const maxOrder = sections.reduce((m, s) => Math.max(m, s.sort_order || 0), 0)
    const created = await addSection(view, sectionTitle, maxOrder + 1)
    const next = [...sections, created]
    setSections(next)
    writeJSON(CACHE_SECTIONS + view, next)
  }

  async function handleRenameSection(id, sectionTitle) {
    const updated = await renameSection(id, sectionTitle)
    const next = sections.map((s) => (s.id === id ? updated : s))
    setSections(next)
    writeJSON(CACHE_SECTIONS + view, next)
  }

  async function handleDeleteSection(id) {
    await deleteSection(id)
    const next = sections.filter((s) => s.id !== id)
    setSections(next)
    writeJSON(CACHE_SECTIONS + view, next)
    setTasks((prev) => prev.map((t) => (t.section_id === id ? { ...t, section_id: null } : t)))
  }

  async function handleAddTaskToSection(sectionId, text) {
    const created = await addTask(text, projectId, { section_id: sectionId })
    setTasks((prev) => [created, ...prev])
  }

  function toggleSectionCollapsed(id) {
    const next = { ...collapsed, [id]: !collapsed[id] }
    setCollapsed(next)
    writeJSON(COLLAPSED_KEY, next)
  }

  return {
    projects,
    view,
    selectView,
    tasks,
    sections,
    collapsed,
    subCounts,
    loading,
    error,
    title,
    setTitle,
    adding,
    selected,
    setSelected,
    editingProject,
    setEditingProject,
    hideDone,
    setHideDone,
    online,
    handleAdd,
    handleToggle,
    handleToggleFavorite,
    handleSaveTask,
    handleDeleteTask,
    handleSubtasksChange,
    handleCreateProject,
    handleSaveProject,
    handleDeleteProject,
    handleAddSection,
    handleRenameSection,
    handleDeleteSection,
    handleAddTaskToSection,
    toggleSectionCollapsed,
  }
}