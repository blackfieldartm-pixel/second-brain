import React, { useState } from 'react'
import { toDateInput, toTimeInput, buildDue } from '../lib/dateUtils.js'
import Subtasks from './Subtasks.jsx'
import './taskdetails.css'

const PRIORITIES = [
  { value: 0, label: 'Нет' },
  { value: 1, label: 'Низкий' },
  { value: 2, label: 'Средний' },
  { value: 3, label: 'Высокий' },
]

export default function TaskDetails({
  task,
  projects,
  sections = [],
  onSave,
  onDelete,
  onClose,
  onSubtasksChange,
}) {
  const [title, setTitle] = useState(task.title)
  const [note, setNote] = useState(task.note || '')
  const [date, setDate] = useState(toDateInput(task.due_at))
  const [time, setTime] = useState(toTimeInput(task.due_at, task.all_day))
  const [priority, setPriority] = useState(task.priority)
  const [projectId, setProjectId] = useState(task.project_id || '')
  const [sectionId, setSectionId] = useState(
    sections.some((s) => s.id === task.section_id) ? task.section_id : ''
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Секции показываем, только пока задача остаётся в своём проекте
  const sameProject = projectId === (task.project_id || '')
  const showSections = sameProject && sections.length > 0

  function changeDate(value) {
    setDate(value)
    if (!value) setTime('')
  }

  async function handleSave(e) {
    e.preventDefault()
    const text = title.trim()
    if (!text) return
    setBusy(true)
    setError('')

    const fields = {
      title: text,
      note: note.trim() || null,
      priority,
      project_id: projectId || null,
      ...buildDue(date, time),
    }
    if (!sameProject) fields.section_id = null
    else if (showSections) fields.section_id = sectionId || null

    try {
      await onSave(fields)
    } catch (err) {
      setError('Не удалось сохранить: ' + err.message)
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Удалить задачу вместе с подзадачами?')) return
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
          <h2>Задача</h2>
          <button type="button" className="link-button" onClick={onClose}>
            Закрыть
          </button>
        </div>
        <label className="field-label">Название</label>
        <input
          className="field"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label className="field-label">Заметка</label>
        <textarea
          className="field"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Subtasks parent={task} onCountChange={onSubtasksChange} />
        <label className="field-label">Срок (дата и время, время можно не указывать)</label>
        <div className="due-row">
          <input
            className="field"
            type="date"
            value={date}
            onChange={(e) => changeDate(e.target.value)}
          />
          <input
            className="field"
            type="time"
            value={time}
            disabled={!date}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        {date && (
          <button type="button" className="link-button" onClick={() => changeDate('')}>
            Убрать срок
          </button>
        )}
        <label className="field-label">Приоритет</label>
        <div className="priority-row">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              className={'prio p' + p.value + (p.value === priority ? ' selected' : '')}
              onClick={() => setPriority(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label className="field-label">Проект</label>
        <select className="field" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">📥 Входящие</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {(p.emoji || '📁') + ' ' + p.title}
            </option>
          ))}
        </select>
        {showSections && (
          <>
            <label className="field-label">Секция</label>
            <select
              className="field"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
            >
              <option value="">Без секции</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </>
        )}
        {error && <p className="task-error">{error}</p>}
        <div className="form-actions modal-actions">
          <button className="task-add" type="submit" disabled={busy || !title.trim()}>
            {busy ? 'Подожди…' : 'Сохранить'}
          </button>
          <button className="secondary-button" type="button" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="danger-button"
            aria-label="Удалить задачу"
            title="Удалить задачу"
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