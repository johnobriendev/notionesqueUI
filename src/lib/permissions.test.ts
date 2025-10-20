// src/lib/permissions.test.ts
import { describe, it, expect } from 'vitest';
import { getProjectPermissions, canPerformAction, getRoleInfo } from './permissions';
import { Project, UserRole } from '../types';

describe('getProjectPermissions', () => {
  describe('when project is null', () => {
    it('should return all permissions as false', () => {
      const permissions = getProjectPermissions(null);

      expect(permissions).toEqual({
        canRead: false,
        canWrite: false,
        canInvite: false,
        canManageTeam: false,
        canDeleteProject: false,
        isOwner: false,
        isEditor: false,
        isViewer: false,
        userRole: 'viewer',
      });
    });
  });

  describe('when user is owner', () => {
    const ownerProject: Project = {
      id: 'test-project',
      name: 'Test Project',
      description: 'Test Description',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'owner-id',
      userRole: 'owner',
      canWrite: true,
    };

    it('should return all permissions as true', () => {
      const permissions = getProjectPermissions(ownerProject);

      expect(permissions.canRead).toBe(true);
      expect(permissions.canWrite).toBe(true);
      expect(permissions.canInvite).toBe(true);
      expect(permissions.canManageTeam).toBe(true);
      expect(permissions.canDeleteProject).toBe(true);
    });

    it('should identify user as owner', () => {
      const permissions = getProjectPermissions(ownerProject);

      expect(permissions.isOwner).toBe(true);
      expect(permissions.isEditor).toBe(false);
      expect(permissions.isViewer).toBe(false);
      expect(permissions.userRole).toBe('owner');
    });
  });

  describe('when user is editor', () => {
    const editorProject: Project = {
      id: 'test-project',
      name: 'Test Project',
      description: 'Test Description',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'owner-id',
      userRole: 'editor',
      canWrite: true,
    };

    it('should have read, write, and invite permissions', () => {
      const permissions = getProjectPermissions(editorProject);

      expect(permissions.canRead).toBe(true);
      expect(permissions.canWrite).toBe(true);
      expect(permissions.canInvite).toBe(true);
    });

    it('should NOT have team management and delete permissions', () => {
      const permissions = getProjectPermissions(editorProject);

      expect(permissions.canManageTeam).toBe(false);
      expect(permissions.canDeleteProject).toBe(false);
    });

    it('should identify user as editor', () => {
      const permissions = getProjectPermissions(editorProject);

      expect(permissions.isOwner).toBe(false);
      expect(permissions.isEditor).toBe(true);
      expect(permissions.isViewer).toBe(false);
      expect(permissions.userRole).toBe('editor');
    });
  });

  describe('when user is viewer', () => {
    const viewerProject: Project = {
      id: 'test-project',
      name: 'Test Project',
      description: 'Test Description',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'owner-id',
      userRole: 'viewer',
      canWrite: false,
    };

    it('should only have read permission', () => {
      const permissions = getProjectPermissions(viewerProject);

      expect(permissions.canRead).toBe(true);
      expect(permissions.canWrite).toBe(false);
      expect(permissions.canInvite).toBe(false);
      expect(permissions.canManageTeam).toBe(false);
      expect(permissions.canDeleteProject).toBe(false);
    });

    it('should identify user as viewer', () => {
      const permissions = getProjectPermissions(viewerProject);

      expect(permissions.isOwner).toBe(false);
      expect(permissions.isEditor).toBe(false);
      expect(permissions.isViewer).toBe(true);
      expect(permissions.userRole).toBe('viewer');
    });
  });
});

describe('canPerformAction', () => {
  const ownerProject: Project = {
    id: 'test-project',
    name: 'Test Project',
    description: 'Test Description',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'owner-id',
    userRole: 'owner',
    canWrite: true,
  };

  const editorProject: Project = {
    ...ownerProject,
    userRole: 'editor',
  };

  const viewerProject: Project = {
    ...ownerProject,
    userRole: 'viewer',
    canWrite: false,
  };

  describe('read action', () => {
    it('should allow all roles to read', () => {
      expect(canPerformAction('read', ownerProject)).toBe(true);
      expect(canPerformAction('read', editorProject)).toBe(true);
      expect(canPerformAction('read', viewerProject)).toBe(true);
    });

    it('should not allow read when project is null', () => {
      expect(canPerformAction('read', null)).toBe(false);
    });
  });

  describe('write action', () => {
    it('should allow owners and editors to write', () => {
      expect(canPerformAction('write', ownerProject)).toBe(true);
      expect(canPerformAction('write', editorProject)).toBe(true);
    });

    it('should not allow viewers to write', () => {
      expect(canPerformAction('write', viewerProject)).toBe(false);
    });

    it('should not allow write when project is null', () => {
      expect(canPerformAction('write', null)).toBe(false);
    });
  });

  describe('invite action', () => {
    it('should allow owners and editors to invite', () => {
      expect(canPerformAction('invite', ownerProject)).toBe(true);
      expect(canPerformAction('invite', editorProject)).toBe(true);
    });

    it('should not allow viewers to invite', () => {
      expect(canPerformAction('invite', viewerProject)).toBe(false);
    });
  });

  describe('manage_team action', () => {
    it('should only allow owners to manage team', () => {
      expect(canPerformAction('manage_team', ownerProject)).toBe(true);
      expect(canPerformAction('manage_team', editorProject)).toBe(false);
      expect(canPerformAction('manage_team', viewerProject)).toBe(false);
    });
  });

  describe('delete_project action', () => {
    it('should only allow owners to delete project', () => {
      expect(canPerformAction('delete_project', ownerProject)).toBe(true);
      expect(canPerformAction('delete_project', editorProject)).toBe(false);
      expect(canPerformAction('delete_project', viewerProject)).toBe(false);
    });
  });

  describe('invalid action', () => {
    it('should return false for unknown actions', () => {
      expect(canPerformAction('invalid' as any, ownerProject)).toBe(false);
    });
  });
});

describe('getRoleInfo', () => {
  it('should return correct info for owner role', () => {
    const info = getRoleInfo('owner');

    expect(info.name).toBe('Owner');
    expect(info.description).toBe('Full access to project and team management');
    expect(info.color).toBe('bg-red-100 text-red-800');
    expect(info.icon).toBe('👑');
  });

  it('should return correct info for editor role', () => {
    const info = getRoleInfo('editor');

    expect(info.name).toBe('Editor');
    expect(info.description).toBe('Can view and edit tasks');
    expect(info.color).toBe('bg-blue-100 text-blue-800');
    expect(info.icon).toBe('✏️');
  });

  it('should return correct info for viewer role', () => {
    const info = getRoleInfo('viewer');

    expect(info.name).toBe('Viewer');
    expect(info.description).toBe('Read-only access');
    expect(info.color).toBe('bg-gray-100 text-gray-800');
    expect(info.icon).toBe('👁️');
  });

  it('should return unknown info for invalid role', () => {
    const info = getRoleInfo('invalid' as UserRole);

    expect(info.name).toBe('Unknown');
    expect(info.description).toBe('Unknown role');
    expect(info.color).toBe('bg-gray-100 text-gray-800');
    expect(info.icon).toBe('❓');
  });
});
