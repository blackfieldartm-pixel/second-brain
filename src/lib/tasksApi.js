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
  return data
}

// Мягкое удаление: задача остаётся в базе, но нигде не показывается
export async function deleteTask(id) {
  const { error } = await supabase
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}