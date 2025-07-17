//src/types/index.ts -

export type TaskStatus = 'not started' | 'in progress' | 'completed';

export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

// User roles for collaboration
export type UserRole = 'owner' | 'editor' | 'viewer';

// Invitation status
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

// Project interface with collaboration fields
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  userId: string; // Owner of the project
  // Collaboration fields from backend
  userRole: UserRole; // Current user's role in this project
  canWrite: boolean; // Computed permission for quick checks
}

// Task interface with collaboration fields
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
    // Collaboration fields from backend
    version: number; // For optimistic locking/conflict detection
    updatedBy: string; // Email of user who last updated this task
}

export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  createdAt: string;
  updatedAt: string;
}

// Collaboration-related interfaces
export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: UserRole;
  email: string;
  name?: string;
  picture?: string;
  joinedAt: string;
}

export interface Invitation {
  id: string;
  projectId: string;
  projectName: string;
  inviterEmail: string;
  inviteeEmail: string;
  role: UserRole;
  status: InvitationStatus;
  token: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// API request/response types
export interface InviteUserRequest {
  email: string;
  role: UserRole;
}

export interface UpdateMemberRoleRequest {
  role: UserRole;
}

export interface AcceptInvitationRequest {
  token: string;
}

// Conflict resolution
export interface TaskConflict {
  taskId: string;
  currentVersion: number;
  conflictVersion: number;
  updatedBy: string;
  currentTask: Task;
  message: string;
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
  // Conflict tracking
  conflicts: TaskConflict[];
}

// ProjectsState for managing projects
export interface ProjectsState {
  items: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
}

// Collaboration state
export interface CollaborationState {
  // Team members for current project
  projectMembers: ProjectMember[];
  
  // User's pending invitations across all projects
  pendingInvitations: Invitation[];
  
  // Loading states
  isLoadingMembers: boolean;
  isLoadingInvitations: boolean;
  isSendingInvitation: boolean;
  isUpdatingRole: boolean;
  isRemovingMember: boolean;
  isAcceptingInvitation: boolean;
  isDecliningInvitation: boolean;
  
  // Error states
  membersError: string | null;
  invitationsError: string | null;
  inviteError: string | null;
  roleUpdateError: string | null;
  removeError: string | null;
  acceptError: string | null;
  declineError: string | null;
}

// UI state structure with collaboration modals
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
  
  // Collaboration UI state
  isTeamModalOpen: boolean;
  isInviteModalOpen: boolean;
  isInvitationsPanelOpen: boolean;
  
  // Conflict resolution UI
  activeConflicts: string[]; // Task IDs with active conflicts
  conflictBannerVisible: boolean;
}

export interface CommandHistoryState {
  undoStack: any[]; 
  redoStack: any[];
  isExecuting: boolean;
}

// Permission helper types
export interface ProjectPermissions {
  canRead: boolean;
  canWrite: boolean;
  canInvite: boolean;
  canManageTeam: boolean;
  canDeleteProject: boolean;
  isOwner: boolean;
  isEditor: boolean;
  isViewer: boolean;
  userRole: UserRole;
}

export interface TaskPermissions {
  canRead: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canChangeStatus: boolean;
  canChangePriority: boolean;
  canReorder: boolean;
}

// API Error types for better error handling
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export interface VersionConflictError extends ApiError {
  status: 409;
  code: 'VERSION_CONFLICT';
  currentTask: Task;
  updatedBy: string;
}

export interface PermissionError extends ApiError {
  status: 403;
  code: 'PERMISSION_DENIED';
  requiredRole: UserRole;
  userRole: UserRole;
}

