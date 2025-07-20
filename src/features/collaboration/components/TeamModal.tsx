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
} from '../store/collaborationSlice';
import {
  closeTeamModal,
  selectIsTeamModalOpen
} from '../../ui/store/uiSlice';
import { selectCurrentProject } from '../../projects/store/projectsSlice';
import { WriteGuard } from '../../../components/common/PermissionGuard';


const TeamModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsTeamModalOpen);
  const currentProject = useAppSelector(selectCurrentProject);
  const members = useAppSelector(selectProjectMembers);
  const isLoading = useAppSelector(selectIsLoadingMembers);
  const isSending = useAppSelector(selectIsSendingInvitation);
  const inviteError = useAppSelector(selectInviteError);

  // Simple invite form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
    }
  }, [isOpen]);

  const handleClose = () => {
    dispatch(closeTeamModal());
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

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      // Error is handled by the slice
      console.error('Failed to send invitation:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
            <p className="text-sm text-gray-600">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center space-x-2">
            {!showInviteForm && (
              <WriteGuard
                fallback={
                  <button
                  onClick={() => setShowInviteForm(true)}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm "
                  disabled
                >
                  Invite disabled for read only
                </button>
                }
                showFallback={true}
              >
                <button
                  onClick={() => setShowInviteForm(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Invite
                </button>
              </WriteGuard >
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

          {/* Simple Invite Form */}
          {showInviteForm && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Invite New Member</h3>

              {inviteError && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                  {inviteError}
                </div>
              )}

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
                    <option value="owner">Owner (full access)</option>
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
                <div key={member.userId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
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
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.role === 'owner' ? 'bg-red-100 text-red-800' :
                      member.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamModal;