// src/features/ui/store/uiSlice.test.ts
import { describe, it, expect } from 'vitest';
import uiReducer, {
  setViewMode,
  setKanbanGroupBy,
  setCurrentProjectId,
  setSortConfig,
  setFilterStatus,
  setFilterPriority,
  setSearchTerm,
  openTaskModal,
  closeTaskModal,
  openTaskDetail,
  closeTaskDetail,
  openDeleteConfirm,
  closeDeleteConfirm,
  openBulkEdit,
  closeBulkEdit,
  openTeamModal,
  closeTeamModal,
  openInvitationsPanel,
  closeInvitationsPanel,
  openDeleteCommentModal,
  closeDeleteCommentModal,
  openUrgentTasksModal,
  closeUrgentTasksModal,
} from './uiSlice';
import { UiState } from '../../../types';

describe('uiSlice', () => {
  const initialState: UiState = {
    viewMode: 'list',
    kanbanGroupBy: 'priority',
    sortConfig: {
      field: 'createdAt',
      direction: 'desc',
    },
    filterConfig: {
      status: 'all',
      priority: 'all',
      searchTerm: '',
    },
    isTaskModalOpen: false,
    editingTaskId: null,
    isTaskDetailOpen: false,
    viewingTaskId: null,
    isDeleteConfirmOpen: false,
    deletingTaskId: null,
    deletingTaskIds: [],
    isBulkEditOpen: false,
    bulkEditType: null,
    selectedTaskIds: [],
    currentProjectId: null,
    isTeamModalOpen: false,
    isInviteModalOpen: false,
    isInvitationsPanelOpen: false,
    activeConflicts: [],
    conflictBannerVisible: false,
    isDeleteCommentModalOpen: false,
    deletingCommentId: null,
    isUrgentTasksModalOpen: false,
  };

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(uiReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('setViewMode', () => {
    it('should switch to kanban view', () => {
      const actual = uiReducer(initialState, setViewMode('kanban'));
      expect(actual.viewMode).toBe('kanban');
    });

    it('should switch to list view', () => {
      const state = { ...initialState, viewMode: 'kanban' as const };
      const actual = uiReducer(state, setViewMode('list'));
      expect(actual.viewMode).toBe('list');
    });
  });

  describe('setKanbanGroupBy', () => {
    it('should group by status', () => {
      const actual = uiReducer(initialState, setKanbanGroupBy('status'));
      expect(actual.kanbanGroupBy).toBe('status');
    });

    it('should group by priority', () => {
      const state = { ...initialState, kanbanGroupBy: 'status' as const };
      const actual = uiReducer(state, setKanbanGroupBy('priority'));
      expect(actual.kanbanGroupBy).toBe('priority');
    });
  });

  describe('setCurrentProjectId', () => {
    it('should set current project ID', () => {
      const actual = uiReducer(initialState, setCurrentProjectId('project-123'));
      expect(actual.currentProjectId).toBe('project-123');
    });

    it('should allow setting to null', () => {
      const state = { ...initialState, currentProjectId: 'project-123' };
      const actual = uiReducer(state, setCurrentProjectId(null));
      expect(actual.currentProjectId).toBeNull();
    });
  });

  describe('setSortConfig', () => {
    it('should update sort field', () => {
      const actual = uiReducer(initialState, setSortConfig({ field: 'title' }));
      expect(actual.sortConfig.field).toBe('title');
    });

    it('should update sort direction', () => {
      const actual = uiReducer(initialState, setSortConfig({ direction: 'asc' }));
      expect(actual.sortConfig.direction).toBe('asc');
    });

    it('should toggle direction when same field is clicked', () => {
      const state = {
        ...initialState,
        sortConfig: { field: 'title' as const, direction: 'asc' as const },
      };
      const actual = uiReducer(state, setSortConfig({ field: 'title' }));
      expect(actual.sortConfig.direction).toBe('desc');
    });

    it('should toggle back to asc when clicked again', () => {
      const state = {
        ...initialState,
        sortConfig: { field: 'title' as const, direction: 'desc' as const },
      };
      const actual = uiReducer(state, setSortConfig({ field: 'title' }));
      expect(actual.sortConfig.direction).toBe('asc');
    });

    it('should update both field and direction', () => {
      const actual = uiReducer(
        initialState,
        setSortConfig({ field: 'priority', direction: 'asc' })
      );
      expect(actual.sortConfig.field).toBe('priority');
      expect(actual.sortConfig.direction).toBe('asc');
    });
  });

  describe('filter actions', () => {
    describe('setFilterStatus', () => {
      it('should set status filter', () => {
        const actual = uiReducer(initialState, setFilterStatus('completed'));
        expect(actual.filterConfig.status).toBe('completed');
      });

      it('should set to all', () => {
        const actual = uiReducer(initialState, setFilterStatus('all'));
        expect(actual.filterConfig.status).toBe('all');
      });
    });

    describe('setFilterPriority', () => {
      it('should set priority filter', () => {
        const actual = uiReducer(initialState, setFilterPriority('high'));
        expect(actual.filterConfig.priority).toBe('high');
      });

      it('should set to all', () => {
        const actual = uiReducer(initialState, setFilterPriority('all'));
        expect(actual.filterConfig.priority).toBe('all');
      });
    });

    describe('setSearchTerm', () => {
      it('should set search term', () => {
        const actual = uiReducer(initialState, setSearchTerm('test search'));
        expect(actual.filterConfig.searchTerm).toBe('test search');
      });

      it('should clear search term', () => {
        const state = { ...initialState, filterConfig: { ...initialState.filterConfig, searchTerm: 'test' } };
        const actual = uiReducer(state, setSearchTerm(''));
        expect(actual.filterConfig.searchTerm).toBe('');
      });
    });
  });

  describe('task modal actions', () => {
    describe('openTaskModal', () => {
      it('should open modal for new task', () => {
        const actual = uiReducer(initialState, openTaskModal(null));
        expect(actual.isTaskModalOpen).toBe(true);
        expect(actual.editingTaskId).toBeNull();
      });

      it('should open modal for editing task', () => {
        const actual = uiReducer(initialState, openTaskModal('task-123'));
        expect(actual.isTaskModalOpen).toBe(true);
        expect(actual.editingTaskId).toBe('task-123');
      });
    });

    describe('closeTaskModal', () => {
      it('should close modal and clear editing task', () => {
        const state = {
          ...initialState,
          isTaskModalOpen: true,
          editingTaskId: 'task-123',
        };
        const actual = uiReducer(state, closeTaskModal());
        expect(actual.isTaskModalOpen).toBe(false);
        expect(actual.editingTaskId).toBeNull();
      });
    });
  });

  describe('task detail actions', () => {
    describe('openTaskDetail', () => {
      it('should open detail view', () => {
        const actual = uiReducer(initialState, openTaskDetail('task-123'));
        expect(actual.isTaskDetailOpen).toBe(true);
        expect(actual.viewingTaskId).toBe('task-123');
      });

      it('should close task modal when opening detail', () => {
        const state = {
          ...initialState,
          isTaskModalOpen: true,
          editingTaskId: 'task-123',
        };
        const actual = uiReducer(state, openTaskDetail('task-456'));
        expect(actual.isTaskModalOpen).toBe(false);
        expect(actual.editingTaskId).toBeNull();
        expect(actual.isTaskDetailOpen).toBe(true);
        expect(actual.viewingTaskId).toBe('task-456');
      });
    });

    describe('closeTaskDetail', () => {
      it('should close detail view and clear viewing task', () => {
        const state = {
          ...initialState,
          isTaskDetailOpen: true,
          viewingTaskId: 'task-123',
        };
        const actual = uiReducer(state, closeTaskDetail());
        expect(actual.isTaskDetailOpen).toBe(false);
        expect(actual.viewingTaskId).toBeNull();
      });
    });
  });

  describe('delete confirmation actions', () => {
    describe('openDeleteConfirm', () => {
      it('should open for single task', () => {
        const actual = uiReducer(initialState, openDeleteConfirm('task-123'));
        expect(actual.isDeleteConfirmOpen).toBe(true);
        expect(actual.deletingTaskId).toBe('task-123');
        expect(actual.deletingTaskIds).toEqual([]);
      });

      it('should open for multiple tasks', () => {
        const actual = uiReducer(initialState, openDeleteConfirm(['task-1', 'task-2']));
        expect(actual.isDeleteConfirmOpen).toBe(true);
        expect(actual.deletingTaskId).toBeNull();
        expect(actual.deletingTaskIds).toEqual(['task-1', 'task-2']);
      });
    });

    describe('closeDeleteConfirm', () => {
      it('should close and clear deleting state', () => {
        const state = {
          ...initialState,
          isDeleteConfirmOpen: true,
          deletingTaskId: 'task-123',
          deletingTaskIds: ['task-1', 'task-2'],
        };
        const actual = uiReducer(state, closeDeleteConfirm());
        expect(actual.isDeleteConfirmOpen).toBe(false);
        expect(actual.deletingTaskId).toBeNull();
        expect(actual.deletingTaskIds).toEqual([]);
      });
    });
  });

  describe('bulk edit actions', () => {
    describe('openBulkEdit', () => {
      it('should open for status editing', () => {
        const actual = uiReducer(
          initialState,
          openBulkEdit({ type: 'status', taskIds: ['task-1', 'task-2'] })
        );
        expect(actual.isBulkEditOpen).toBe(true);
        expect(actual.bulkEditType).toBe('status');
        expect(actual.selectedTaskIds).toEqual(['task-1', 'task-2']);
      });

      it('should open for priority editing', () => {
        const actual = uiReducer(
          initialState,
          openBulkEdit({ type: 'priority', taskIds: ['task-1'] })
        );
        expect(actual.isBulkEditOpen).toBe(true);
        expect(actual.bulkEditType).toBe('priority');
        expect(actual.selectedTaskIds).toEqual(['task-1']);
      });
    });

    describe('closeBulkEdit', () => {
      it('should close and clear bulk edit type', () => {
        const state = {
          ...initialState,
          isBulkEditOpen: true,
          bulkEditType: 'status' as const,
          selectedTaskIds: ['task-1', 'task-2'],
        };
        const actual = uiReducer(state, closeBulkEdit());
        expect(actual.isBulkEditOpen).toBe(false);
        expect(actual.bulkEditType).toBeNull();
        // selectedTaskIds are preserved
        expect(actual.selectedTaskIds).toEqual(['task-1', 'task-2']);
      });
    });
  });

  describe('team modal actions', () => {
    describe('openTeamModal', () => {
      it('should open team modal', () => {
        const actual = uiReducer(initialState, openTeamModal());
        expect(actual.isTeamModalOpen).toBe(true);
      });
    });

    describe('closeTeamModal', () => {
      it('should close team modal', () => {
        const state = { ...initialState, isTeamModalOpen: true };
        const actual = uiReducer(state, closeTeamModal());
        expect(actual.isTeamModalOpen).toBe(false);
      });
    });
  });

  describe('invitations panel actions', () => {
    describe('openInvitationsPanel', () => {
      it('should open invitations panel', () => {
        const actual = uiReducer(initialState, openInvitationsPanel());
        expect(actual.isInvitationsPanelOpen).toBe(true);
      });
    });

    describe('closeInvitationsPanel', () => {
      it('should close invitations panel', () => {
        const state = { ...initialState, isInvitationsPanelOpen: true };
        const actual = uiReducer(state, closeInvitationsPanel());
        expect(actual.isInvitationsPanelOpen).toBe(false);
      });
    });
  });

  describe('comment deletion modal actions', () => {
    describe('openDeleteCommentModal', () => {
      it('should open with comment ID', () => {
        const actual = uiReducer(initialState, openDeleteCommentModal('comment-123'));
        expect(actual.isDeleteCommentModalOpen).toBe(true);
        expect(actual.deletingCommentId).toBe('comment-123');
      });
    });

    describe('closeDeleteCommentModal', () => {
      it('should close and clear deleting comment ID', () => {
        const state = {
          ...initialState,
          isDeleteCommentModalOpen: true,
          deletingCommentId: 'comment-123',
        };
        const actual = uiReducer(state, closeDeleteCommentModal());
        expect(actual.isDeleteCommentModalOpen).toBe(false);
        expect(actual.deletingCommentId).toBeNull();
      });
    });
  });
});
