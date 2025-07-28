//src/features/collaboration/components/TeamModal.tsx 

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  fetchProjectMembers,
  selectProjectMembers,
  selectIsLoadingMembers,
  inviteUser,
  selectIsSendingInvitation,
  selectInviteError,
  updateMemberRole,
  removeMember,
  selectIsUpdatingRole,
  selectIsRemovingMember,
  selectRoleUpdateError,
  selectRemoveError,
  clearTeamManagementErrors,
} from '../store/collaborationSlice';
import {
  closeTeamModal,
  selectIsTeamModalOpen
} from '../../ui/store/uiSlice';
import { selectCurrentProject } from '../../projects/store/projectsSlice';
import { getProjectPermissions } from '../../../lib/permissions';
import { UserRole, ProjectMember } from '../../../types';
import { useNavigate } from 'react-router-dom';

const TeamModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isOpen = useAppSelector(selectIsTeamModalOpen);
  const currentProject = useAppSelector(selectCurrentProject);
  const members = useAppSelector(selectProjectMembers);
  const isLoading = useAppSelector(selectIsLoadingMembers);
  const isSending = useAppSelector(selectIsSendingInvitation);
  const inviteError = useAppSelector(selectInviteError);
  const isUpdatingRole = useAppSelector(selectIsUpdatingRole);
  const isRemovingMember = useAppSelector(selectIsRemovingMember);
  const roleUpdateError = useAppSelector(selectRoleUpdateError);
  const removeError = useAppSelector(selectRemoveError);

  const permissions = getProjectPermissions(currentProject);

  // Simple invite form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Role change modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('viewer');

  // Fetch team members when modal opens
  useEffect(() => {
    if (isOpen && currentProject) {
      dispatch(fetchProjectMembers(currentProject.id));
    }
  }, [isOpen, currentProject, dispatch]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setRole('viewer');
      setShowInviteForm(false);
      setSuccessMessage('');
      setShowRoleModal(false);
      setEditingMember(null);
      dispatch(clearTeamManagementErrors());
    }
  }, [isOpen, dispatch]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleClose = () => {
    dispatch(closeTeamModal());
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };


  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !email.trim()) return;

    try {
      await dispatch(inviteUser({
        projectId: currentProject.id,
        email: email.trim(),
        role
      })).unwrap();

      // Success
      setSuccessMessage(`Invitation sent to ${email.trim()}!`);
      setEmail('');
      setRole('viewer');
      setShowInviteForm(false);
    } catch (error) {
      // Error is handled by the slice
      console.error('Failed to send invitation:', error);
    }
  };

  // Open role change modal
  const openRoleModal = (member: ProjectMember) => {
    setEditingMember(member);
    setNewRole(member.role);
    setShowRoleModal(true);
    dispatch(clearTeamManagementErrors());
  };

  // Handle role update
  const handleUpdateRole = async () => {
    if (!currentProject || !editingMember) return;

    try {
      await dispatch(updateMemberRole({
        projectId: currentProject.id,
        userId: editingMember.id,
        role: newRole
      })).unwrap();

      setSuccessMessage(`${editingMember.email}'s role updated to ${newRole}!`);
      setShowRoleModal(false);
      setEditingMember(null);

      // 🔧 FIX: Refresh the member list to show updated data
      dispatch(fetchProjectMembers(currentProject.id));
    } catch (error) {
      // Error is handled by the slice
      console.error('Failed to update role:', error);
    }
  };

  // Handle member removal
  const handleRemoveMember = async (member: ProjectMember) => {
    if (!currentProject) return;

    if (!window.confirm(`Are you sure you want to remove ${member.email} from this project?`)) {
      return;
    }

    try {
      await dispatch(removeMember({
        projectId: currentProject.id,
        userId: member.id
      })).unwrap();

      setSuccessMessage(`${member.email} has been removed from the project.`);

      // 🔧 FIX: Refresh the member list to show updated data
      dispatch(fetchProjectMembers(currentProject.id));
    } catch (error) {
      // Error is handled by the slice
      console.error('Failed to remove member:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0  bg-black/10 backdrop-blur-xs flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white border rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{members.length} member{members.length !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${permissions.userRole === 'owner' ? 'bg-red-100 text-red-800' :
                  permissions.userRole === 'editor' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                }`}>
                Your role: {permissions.userRole}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!showInviteForm && permissions.canInvite && (
              <button
                onClick={() => setShowInviteForm(true)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Invite
              </button>
            )}
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Error Messages */}
          {(inviteError || roleUpdateError || removeError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                {inviteError || roleUpdateError || removeError}
              </p>
            </div>
          )}

          {/* Invite Form */}
          {showInviteForm && permissions.canInvite && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Invite New Member</h3>

              <form onSubmit={handleInvite} className="space-y-3">
                <div>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    required
                    disabled={isSending}
                  />
                </div>
                <div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    disabled={isSending}
                  >
                    <option value="viewer">Viewer (read-only)</option>
                    <option value="editor">Editor (can edit tasks)</option>
                    {permissions.userRole === 'owner' && (
                      <option value="owner">Owner (full access)</option>
                    )}
                  </select>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={isSending || !email.trim()}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? 'Sending...' : 'Send Invite'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    disabled={isSending}
                    className="px-3 py-1 text-gray-600 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Leave Project Button (for non-owners) - REMOVED */}
          {/* Removed because backend only allows owners to remove members */}

          {/* Team Members List */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : members.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No team members found.</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"> {/* 🔧 FIX: Use 'id' instead of 'userId' */}
                  {member.picture ? (
                    <img
                      src={member.picture}
                      alt={member.name || member.email}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {(member.name || member.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {member.name || member.email.split('@')[0]}
                    </p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>

                  {/* Role and Actions */}
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.role === 'owner' ? 'bg-red-100 text-red-800' :
                        member.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {member.role}
                    </span>

                    {/* Management buttons (only for owners, and not for other owners) */}
                    {permissions.canManageTeam && member.role !== 'owner' && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => openRoleModal(member)}
                          disabled={isUpdatingRole || isRemovingMember}
                          className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                        >
                          Change Role
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleRemoveMember(member)}
                          disabled={isUpdatingRole || isRemovingMember}
                          className="text-xs text-red-600 hover:text-red-800 underline disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Change Role</h3>
              <p className="text-sm text-gray-600 mt-1">
                Changing role for {editingMember.email}
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isUpdatingRole}
                >
                  <option value="viewer">Viewer (read-only)</option>
                  <option value="editor">Editor (can edit tasks)</option>
                  {permissions.userRole === 'owner' && (
                    <option value="owner">Owner (full access)</option>
                  )}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRoleModal(false)}
                  disabled={isUpdatingRole}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRole}
                  disabled={isUpdatingRole || newRole === editingMember.role}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingRole ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamModal;