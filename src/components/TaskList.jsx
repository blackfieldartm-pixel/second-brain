import React, { useState } from 'react'
import { formatDue, isOverdue } from '../lib/dateUtils.js'
import { isSystemView } from '../lib/views.js'
import SectionBlock from './SectionBlock.jsx'
import './favorites.css'

// Сначала задачи с ближайшим сроком, потом без срока; при равенстве выше приоритет, потом новее
function sortOpen(a, b) {
  const ad = a.due_at ? new Date(a.due_at).getTime() : Infinity
  const bd = b.due_at ? new Date(b.due_at).getTime() : Infinity
  if (ad !== bd) return ad - bd
  if (a.priority !== b.priority) return b.priority - a.priority
  return new Date(b.created_at) - new Date(a.created_at)
}

const EMPTY_TEXT = {
  favorites: 'Нет избранных задач. Нажми ☆ справа у любой задачи.',
  today: 'На сегодня задач нет.',
  tomorrow: 'На завтра задач нет.',
  soon: 'Нет задач со сроком позже завтрашнего дня.',
  done: 'Пока нет выполненных задач.',
}

// Кнопка «+ Секция» с полем ввода названия
function AddSection({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    const text = name.trim()
    if (!text) return
    setBusy(true)
    setError('')
    try {
      await onAdd(text)
      setName('')
      setOpen(false)
    } catch (err) {
      setError('Не удалось добавить секцию: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <div className="add-section-row">
        <button type="button" className="link-button" onClick={() => setOpen(true)}>
          + Секция
        </button>
      </div>
    )
  }

  return (
    <>
      <form className="add-section-form" onSubmit={submit}>
        <input
          className="task-input"
          type="text"
          placeholder="Название секции"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <button className="task-add" type="submit" disabled={busy || !name.trim()}>
          Добавить
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            setOpen(false)
            setName('')
            setError('')
          }}
        >
          Отмена
        </button>
      </form>
      {error && <p className="task-error">{error}</p>}
    </>
  )
}

export default function TaskList({
  tasks,
  subCounts,
  view,
  projects,
  hideDone,
  onToggleHide,
  onToggle,
  onToggleFavorite,
  onSelect,
  sections = [],
  collapsed = {},
  onToggleCollapse,
  onAddSection,
  onRenameSection,
  onDeleteSection,
  onAddTaskToSection,
}) {
  const isProjectView = !isSystemView(view)
  const showProjectInMeta = isSystemView(view) && view !== 'inbox'
  const openTasks = tasks.filter((t) => t.status !== 'done').sort(sortOpen)
  const doneTasks = tasks.filter((t) => t.status === 'done')

  function projectLabel(task) {
    if (!task.project_id) return '📥 Входящие'
    const p = projects.find((x) => x.id === task.project_id)
    return p ? (p.emoji || '📁') + ' ' + p.title : ''
  }

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
          onClick={() => onToggle(task)}
        >
          {isDone ? '✓' : ''}
        </button>
        <button type="button" className="task-body" onClick={() => onSelect(task)}>
          <span className="task-title">{task.title}</span>
          {parts.length > 0 && (
            <span className={'task-meta' + (overdue ? ' overdue' : '')}>{parts.join(' · ')}</span>
          )}
        </button>
        <button
          type="button"
          className={'task-star' + (task.is_favorite ? ' on' : '')}
          aria-label={task.is_favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
          onClick={() => onToggleFavorite(task)}
        >
          {task.is_favorite ? '★' : '☆'}
        </button>
      </li>
    )
  }

  function renderDone() {
    if (doneTasks.length === 0) return null
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="task-subtitle">Выполненные ({doneTasks.length})</h2>
          <button type="button" className="link-button" onClick={onToggleHide}>
            {hideDone ? 'показать' : 'скрыть'}
          </button>
        </div>
        {!hideDone && <ul className="task-list">{doneTasks.map(renderTask)}</ul>}
      </>
    )
  }

  if (view === 'done') {
    return doneTasks.length === 0 ? (
      <p className="task-empty">{EMPTY_TEXT.done}</p>
    ) : (
      <ul className="task-list">{doneTasks.map(renderTask)}</ul>
    )
  }

  // Проект: задачи без секции сверху, затем секции
  if (isProjectView) {
    const sectionIds = new Set(sections.map((s) => s.id))
    const looseOpen = openTasks.filter((t) => !t.section_id || !sectionIds.has(t.section_id))
    return (
      <>
        {openTasks.length === 0 && sections.length === 0 && (
          <p className="task-empty">Пока нет задач. Добавь первую.</p>
        )}
        {looseOpen.length > 0 && <ul className="task-list">{looseOpen.map(renderTask)}</ul>}
        {sections.map((s) => (
          <SectionBlock
            key={s.id}
            section={s}
            tasks={openTasks.filter((t) => t.section_id === s.id)}
            collapsed={Boolean(collapsed[s.id])}
            onToggleCollapse={onToggleCollapse}
            onRename={onRenameSection}
            onDelete={onDeleteSection}
            onAddTask={onAddTaskToSection}
            renderTask={renderTask}
          />
        ))}
        <AddSection onAdd={onAddSection} />
        {renderDone()}
      </>
    )
  }

  return (
    <>
      {openTasks.length === 0 && (
        <p className="task-empty">{EMPTY_TEXT[view] || 'Пока нет задач. Добавь первую.'}</p>
      )}
      <ul className="task-list">{openTasks.map(renderTask)}</ul>
      {renderDone()}
    </>
  )
}