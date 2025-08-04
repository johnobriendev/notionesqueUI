import { describe, it, expect } from 'vitest'
import { createTestStore } from '../../../../test-utils/helpers'
import { setViewMode, openTaskModal, closeTaskModal } from '../uiSlice'

describe('UI Slice', () => {
  it('should toggle view mode', () => {
    const store = createTestStore()
    
    store.dispatch(setViewMode('kanban'))
    expect(store.getState().ui.viewMode).toBe('kanban')
    
    store.dispatch(setViewMode('list'))
    expect(store.getState().ui.viewMode).toBe('list')
  })

  it('should handle task modal', () => {
    const store = createTestStore()
    
    // Open for new task
    store.dispatch(openTaskModal(null))
    expect(store.getState().ui.isTaskModalOpen).toBe(true)
    expect(store.getState().ui.editingTaskId).toBeNull()
    
    // Open for editing
    store.dispatch(openTaskModal('task-1'))
    expect(store.getState().ui.editingTaskId).toBe('task-1')
    
    // Close modal
    store.dispatch(closeTaskModal())
    expect(store.getState().ui.isTaskModalOpen).toBe(false)
    expect(store.getState().ui.editingTaskId).toBeNull()
  })
})