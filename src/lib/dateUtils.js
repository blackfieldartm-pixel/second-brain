function pad(n) {
  return String(n).padStart(2, '0')
}

function dateKey(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

// 'ГГГГ-ММ-ДД' для поля даты
export function toDateInput(iso) {
  if (!iso) return ''
  return dateKey(new Date(iso))
}

// 'ЧЧ:ММ' для поля времени (у задач на весь день времени нет)
export function toTimeInput(iso, allDay) {
  if (!iso || allDay) return ''
  const d = new Date(iso)
  return pad(d.getHours()) + ':' + pad(d.getMinutes())
}

// Собираем срок из полей формы.
// Без времени задача «на весь день»: храним 12:00 по местному времени.
export function buildDue(dateStr, timeStr) {
  if (!dateStr) return { due_at: null, all_day: false }
  if (!timeStr) {
    return { due_at: new Date(dateStr + 'T12:00:00').toISOString(), all_day: true }
  }
  return { due_at: new Date(dateStr + 'T' + timeStr + ':00').toISOString(), all_day: false }
}

// Подпись срока в списке: «Сегодня», «Завтра, 15:00», «12 нояб.»
export function formatDue(task) {
  if (!task.due_at) return ''
  const d = new Date(task.due_at)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  let label
  if (dateKey(d) === dateKey(today)) label = 'Сегодня'
  else if (dateKey(d) === dateKey(tomorrow)) label = 'Завтра'
  else label = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

  if (!task.all_day) label += ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
  return label
}

export function isOverdue(task) {
  if (!task.due_at || task.status === 'done') return false
  const d = new Date(task.due_at)
  if (task.all_day) return dateKey(d) < dateKey(new Date())
  return d < new Date()
}