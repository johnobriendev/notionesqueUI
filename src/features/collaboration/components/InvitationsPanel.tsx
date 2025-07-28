//src/features/collaboration/components/InvitationsPanel.tsx

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  fetchPendingInvitations,
  acceptInvitation,
  declineInvitation,
  selectPendingInvitations,
  selectIsLoadingInvitations,
  selectIsAcceptingInvitation,
  selectIsDecliningInvitation,
  selectInvitationsError,
  selectAcceptError,
  selectDeclineError,
  clearInvitationsError
} from '../store/collaborationSlice';
import { closeInvitationsPanel } from '../../ui/store/uiSlice';

interface InvitationsPanelProps {
  isOpen: boolean;
}

const InvitationsPanel: React.FC<InvitationsPanelProps> = ({ isOpen }) => {
  const dispatch = useAppDispatch();
  const invitations = useAppSelector(selectPendingInvitations);
  const isLoading = useAppSelector(selectIsLoadingInvitations);
  const isAccepting = useAppSelector(selectIsAcceptingInvitation);
  const isDeclining = useAppSelector(selectIsDecliningInvitation);
  const invitationsError = useAppSelector(selectInvitationsError);
  const acceptError = useAppSelector(selectAcceptError);
  const declineError = useAppSelector(selectDeclineError);

  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch invitations when panel opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchPendingInvitations());
    }
  }, [isOpen, dispatch]);

  // Clear errors when panel closes
  useEffect(() => {
    if (!isOpen) {
      dispatch(clearInvitationsError());
      setSuccessMessage('');
      setProcessingInvitation(null);
    }
  }, [isOpen, dispatch]);

  const handleClose = () => {
    dispatch(closeInvitationsPanel());
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleAccept = async (invitationToken: string, projectName: string) => {
    console.log('Attempting to accept invitation with token:', invitationToken);
    setProcessingInvitation(invitationToken);
    try {
      await dispatch(acceptInvitation(invitationToken)).unwrap();
      setSuccessMessage(`Successfully joined ${projectName}!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    } finally {
      setProcessingInvitation(null);
    }
  };

  useEffect(() => {
    if (invitations.length > 0) {
      console.log('Current invitations:', invitations);
    }
  }, [invitations]);

  const handleDecline = async (invitationId: string, projectName: string) => {
    setProcessingInvitation(invitationId);
    try {
      await dispatch(declineInvitation(invitationId)).unwrap();
      setSuccessMessage(`Invitation to ${projectName} declined.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to decline invitation:', error);
    } finally {
      setProcessingInvitation(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-red-100 text-red-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0  bg-black/10 backdrop-blur-xs flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white border rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Project Invitations</h2>
            <p className="text-sm text-gray-600">
              {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
          {(invitationsError || acceptError || declineError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                {invitationsError || acceptError || declineError}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : invitations.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invitations</h3>
              <p className="text-gray-600">You don't have any pending project invitations.</p>
            </div>
          ) : (
            /* Invitations List */
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">{invitation.project?.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(invitation.role)}`}>
                          {invitation.role}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-1">
                        Invited by <span className="font-medium">{invitation.sender?.email}</span>
                      </p>

                      <div className="flex items-center text-xs text-gray-400 space-x-4">
                        <span>Invited {new Date(invitation.createdAt).toLocaleDateString()}</span>
                        <span>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleAccept(invitation.token, invitation.project?.name)}
                        disabled={processingInvitation === invitation.token}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {processingInvitation === invitation.token && isAccepting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Accepting...
                          </>
                        ) : (
                          'Accept'
                        )}
                      </button>

                      <button
                        onClick={() => handleDecline(invitation.id, invitation.project?.name)}
                        disabled={processingInvitation === invitation.id}
                        className="px-3 py-1 text-gray-600 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {processingInvitation === invitation.id && isDeclining ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Declining...
                          </>
                        ) : (
                          'Decline'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvitationsPanel;