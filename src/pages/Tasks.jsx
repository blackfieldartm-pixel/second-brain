import React from 'react'
import { SYSTEM_VIEWS } from '../lib/views.js'
import { useTasksScreen } from '../hooks/useTasksScreen.js'
import ProjectBar from '../components/ProjectBar.jsx'
import ProjectEditor from '../components/ProjectEditor.jsx'
import TaskDetails from '../components/TaskDetails.jsx'
import TaskList from '../components/TaskList.jsx'
import './tasks.css'
import '../components/projecteditor.css'

export default function Tasks() {
  const {
    projects,
    view,
    selectView,
    tasks,
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
    handleSaveTask,
    handleDeleteTask,
    handleSubtasksChange,
    handleCreateProject,
    handleSaveProject,
    handleDeleteProject,
  } = useTasksScreen()

  const systemView = SYSTEM_VIEWS.find((v) => v.id === view)
  const activeProject = projects.find((p) => p.id === view)
  const heading = systemView
    ? systemView.emoji + ' ' + systemView.label
    : activeProject
    ? (activeProject.emoji || '📁') + ' ' + activeProject.title
    : ''
  const showAddForm = view !== 'soon' && view !== 'done'

  return (
    <div className="tasks">
      <ProjectBar
        projects={projects}
        activeId={view}
        onSelect={selectView}
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
      {loading ? (
        <p>Загрузка…</p>
      ) : (
        <TaskList
          tasks={tasks}
          subCounts={subCounts}
          view={view}
          projects={projects}
          hideDone={hideDone}
          onToggleHide={() => setHideDone(!hideDone)}
          onToggle={handleToggle}
          onSelect={setSelected}
        />
      )}
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