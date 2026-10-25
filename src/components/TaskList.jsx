import React from 'react'
import { formatDue, isOverdue } from '../lib/dateUtils.js'
import { isSystemView } from '../lib/views.js'

// Сначала задачи с ближайшим сроком, потом без срока; при равенстве выше приоритет, потом новее
function sortOpen(a, b) {
  const ad = a.due_at ? new Date(a.due_at).getTime() : Infinity
  const bd = b.due_at ? new Date(b.due_at).getTime() : Infinity
  if (ad !== bd) return ad - bd
  if (a.priority !== b.priority) return b.priority - a.priority
  return new Date(b.created_at) - new Date(a.created_at)
}

const EMPTY_TEXT = {
  today: 'На сегодня задач нет.',
  tomorrow: 'На завтра задач нет.',
  soon: 'Нет задач со сроком позже завтрашнего дня.',
  done: 'Пока нет выполненных задач.',
}

export default function TaskList({
  tasks,
  subCounts,
  view,
  projects,
  hideDone,
  onToggleHide,
  onToggle,
  onSelect,
}) {
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
      </li>
    )
  }

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className="task-subtitle">Выполненные ({doneTasks.length})</h2>
            <button type="button" className="link-button" onClick={onToggleHide}>
              {hideDone ? 'показать' : 'скрыть'}
            </button>
          </div>
          {!hideDone && <ul className="task-list">{doneTasks.map(renderTask)}</ul>}
        </>
      )}
    </>
  )
}