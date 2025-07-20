//src/lib/permissions.ts

import { Project, UserRole } from '../types';

 //Calculate what a user can do based on their role in a project
 
export const getProjectPermissions = (project: Project | null) => {
  if (!project) {
    return {
      canRead: false,
      canWrite: false,
      canInvite: false,
      canManageTeam: false,
      canDeleteProject: false,
      userRole: 'viewer' as UserRole,
    };
  }

  const userRole = project.userRole;

  return {
    canRead: true, // All roles can read
    canWrite: userRole === 'owner' || userRole === 'editor', // Owners and editors can write
    canInvite: userRole === 'owner' || userRole === 'editor', // Owners and editors can invite
    canManageTeam: userRole === 'owner', // Only owners can manage team
    canDeleteProject: userRole === 'owner', // Only owners can delete
    userRole,
  };
};

// Check if user can perform a specific action

export const canPerformAction = (
  action: 'read' | 'write' | 'invite' | 'manage_team' | 'delete_project',
  project: Project | null
): boolean => {
  const permissions = getProjectPermissions(project);

  switch (action) {
    case 'read':
      return permissions.canRead;
    case 'write':
      return permissions.canWrite;
    case 'invite':
      return permissions.canInvite;
    case 'manage_team':
      return permissions.canManageTeam;
    case 'delete_project':
      return permissions.canDeleteProject;
    default:
      return false;
  }
};


  //Get role display information for UI
 
export const getRoleInfo = (role: UserRole) => {
  switch (role) {
    case 'owner':
      return {
        name: 'Owner',
        description: 'Full access to project and team management',
        color: 'bg-red-100 text-red-800',
        icon: '👑',
      };
    case 'editor':
      return {
        name: 'Editor',
        description: 'Can view and edit tasks',
        color: 'bg-blue-100 text-blue-800',
        icon: '✏️',
      };
    case 'viewer':
      return {
        name: 'Viewer',
        description: 'Read-only access',
        color: 'bg-gray-100 text-gray-800',
        icon: '👁️',
      };
    default:
      return {
        name: 'Unknown',
        description: 'Unknown role',
        color: 'bg-gray-100 text-gray-800',
        icon: '❓',
      };
  }
};