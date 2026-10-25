import { supabase } from './supabase.js'

// Задачи из «Входящих»: без проекта и не подзадачи
export async function fetchInboxTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .is('project_id', null)
    .is('parent_id', null)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addTask(title) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ title })
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