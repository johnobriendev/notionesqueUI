import { describe, it, expect } from 'vitest'
import { createTestStore, mockTask } from '../../../../test-utils/helpers'
import { 
  createTaskAsync, 
  updateTaskAsync, 
  deleteTaskAsync,
  clearTasks,
  optimisticUpdateTaskPriority 
} from '../tasksSlice'

describe('Tasks Slice', () => {
  it('should create task', () => {
    const store = createTestStore()
    
    store.dispatch(createTaskAsync.fulfilled(mockTask, 'req', {
      projectId: 'project-1',
      title: 'Test Task'
    }))
    
    expect(store.getState().tasks.items).toHaveLength(1)
    expect(store.getState().tasks.items[0]).toEqual(mockTask)
  })

  it('should update task', () => {
    const store = createTestStore({
      tasks: { items: [mockTask], isLoading: false, error: null }
    })
    
    const updatedTask = { ...mockTask, title: 'Updated Task' }
    store.dispatch(updateTaskAsync.fulfilled(updatedTask, 'req', {
      projectId: 'project-1',
      taskId: 'task-1',
      updates: { title: 'Updated Task' }
    }))
    
    expect(store.getState().tasks.items[0].title).toBe('Updated Task')
  })

  it('should delete task', () => {
    const store = createTestStore({
      tasks: { items: [mockTask], isLoading: false, error: null }
    })
    
    store.dispatch(deleteTaskAsync.fulfilled({ taskId: 'task-1' }, 'req', {
      projectId: 'project-1',
      taskId: 'task-1'
    }))
    
    expect(store.getState().tasks.items).toHaveLength(0)
  })

  it('should handle optimistic updates', () => {
    const store = createTestStore({
      tasks: { items: [mockTask], isLoading: false, error: null }
    })
    
    store.dispatch(optimisticUpdateTaskPriority({
      taskId: 'task-1',
      priority: 'high'
    }))
    
    expect(store.getState().tasks.items[0].priority).toBe('high')
  })

  it('should clear all tasks', () => {
    const store = createTestStore({
      tasks: { items: [mockTask], isLoading: false, error: null }
    })
    
    store.dispatch(clearTasks())
    
    expect(store.getState().tasks.items).toHaveLength(0)
  })
})