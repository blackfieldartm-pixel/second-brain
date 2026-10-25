// Системные папки: идентификатор, название, значок и цвет
export const SYSTEM_VIEWS = [
  { id: 'inbox', label: 'Входящие', emoji: '📥', color: '#2563eb' },
  { id: 'today', label: 'Сегодня', emoji: '☀️', color: '#d97706' },
  { id: 'tomorrow', label: 'Завтра', emoji: '🌅', color: '#9333ea' },
  { id: 'soon', label: 'Скоро', emoji: '🗓️', color: '#0891b2' },
  { id: 'done', label: 'Выполненные', emoji: '✅', color: '#16a34a' },
]

export function isSystemView(id) {
  return SYSTEM_VIEWS.some((v) => v.id === id)
}