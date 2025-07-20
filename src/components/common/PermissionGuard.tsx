//src/components/common/PermissionGuard.tsx

import React from 'react';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentProject } from '../../features/projects/store/projectsSlice';
import { canPerformAction } from '../../lib/permissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  action: 'read' | 'write' | 'invite' | 'manage_team' | 'delete_project';
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

// Component that conditionally renders children based on user permissions
 
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  action,
  fallback = null,
  showFallback = false,
}) => {
  const currentProject = useAppSelector(selectCurrentProject);
  
  const hasPermission = canPerformAction(action, currentProject);

  if (hasPermission) {
    return <>{children}</>;
  }

  if (showFallback && fallback) {
    return <>{fallback}</>;
  }

  return null;
};

export default PermissionGuard;

// Convenience components for common use cases
export const WriteGuard: React.FC<Omit<PermissionGuardProps, 'action'>> = (props) => (
  <PermissionGuard {...props} action="write" />
);

export const OwnerGuard: React.FC<Omit<PermissionGuardProps, 'action'>> = (props) => (
  <PermissionGuard {...props} action="manage_team" />
);

export const InviteGuard: React.FC<Omit<PermissionGuardProps, 'action'>> = (props) => (
  <PermissionGuard {...props} action="invite" />
);