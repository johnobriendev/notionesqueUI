//src/types/index.ts    

export type TaskStatus = 'not started' | 'in progress' | 'completed';

export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  userId: string; // Owner of the project
}

export interface Task {
    id: string;
    projectId: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    position: number;
    createdAt: string;
    updatedAt: string;
    customFields: Record<string, string | number | boolean>;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'list' | 'kanban';

export type SortField = 'title' | 'status' | 'priority' | 'createdAt'| 'updatedAt';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
    field: SortField;
    direction: SortDirection;
}

export interface FilterConfig {
    status: TaskStatus | 'all';
    priority: TaskPriority | 'all';
    searchTerm: string;
}

// Structure for task state with redux-undo
export interface TasksState {
  items: Task[];
  isLoading: boolean;
  error: string | null;
}

// Add ProjectsState for managing projects
export interface ProjectsState {
  items: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
}


// UI state structure
export interface UiState {
  viewMode: ViewMode;
  sortConfig: SortConfig;
  filterConfig: FilterConfig;
  isTaskModalOpen: boolean;
  editingTaskId: string | null;
  isTaskDetailOpen: boolean;
  viewingTaskId: string | null;
  isDeleteConfirmOpen: boolean;
  deletingTaskId: string | null;
  deletingTaskIds: string[]; 
  isBulkEditOpen: boolean;
  bulkEditType: 'status' | 'priority' | null;
  selectedTaskIds: string[];
  currentProjectId: string | null;
}


export interface CommandHistoryState {
  undoStack: any[]; 
  redoStack: any[];
  isExecuting: boolean;
}

