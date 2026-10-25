import { supabase } from './supabase.js'

// Задачи проекта; если projectId пустой, то задачи «Входящих»
export async function fetchTasks(projectId) {
  let query = supabase
    .from('tasks')
    .select('*')
    .is('parent_id', null)
    .is('deleted_at', null)

  query = projectId ? query.eq('project_id', projectId) : query.is('project_id', null)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addTask(title, projectId) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ title, project_id: projectId || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function setTaskDone(id, done) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: done ? 'done' : 'open',
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Изменение полей задачи (название, заметка, срок, приоритет, проект)
export async function updateTask(id, fields) {
  const { data, error } = await supabase
    .from('tasks')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error

  // при переносе в другой проект подзадачи едут вместе с задачей
  if ('project_id' in fields) {
    const { error: childError } = await supabase
      .from('tasks')
      .update({ project_id: fields.project_id })
      .eq('parent_id', id)
    if (childError) throw childError
  }
  return data
}

// Мягкое удаление: задача и её подзадачи остаются в базе, но нигде не показываются
export async function deleteTask(id) {
  const { error } = await supabase
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .is('deleted_at', null)
    .or('id.eq.' + id + ',parent_id.eq.' + id)
  if (error) throw error
}

// Подзадачи одной задачи
export async function fetchSubtasks(parentId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('parent_id', parentId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addSubtask(parentId, title, projectId) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ title, parent_id: parentId, project_id: projectId || null })
    .select()
    .single()
  if (error) throw error
  return data
}

// Счётчики для списка: { идентификатор задачи: { total, done } }
export async function fetchSubtaskCounts(parentIds) {
  if (parentIds.length === 0) return {}
  const { data, error } = await supabase
    .from('tasks')
    .select('parent_id, status')
    .in('parent_id', parentIds)
    .is('deleted_at', null)
  if (error) throw error

  const counts = {}
  for (const row of data) {
    const c = counts[row.parent_id] || { total: 0, done: 0 }
    c.total += 1
    if (row.status === 'done') c.done += 1
    counts[row.parent_id] = c
  }
  return counts
}