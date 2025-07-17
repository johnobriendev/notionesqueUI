//src/features/collaboration/components/TeamModal.tsx - SIMPLE VERSION

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { 
  fetchProjectMembers,
  selectProjectMembers,
  selectIsLoadingMembers,
} from '../store/collaborationSlice';
import { 
  closeTeamModal, 
  selectIsTeamModalOpen 
} from '../../ui/store/uiSlice';
import { selectCurrentProject } from '../../projects/store/projectsSlice';

const TeamModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsTeamModalOpen);
  const currentProject = useAppSelector(selectCurrentProject);
  const members = useAppSelector(selectProjectMembers);
  const isLoading = useAppSelector(selectIsLoadingMembers);

  // Fetch team members when modal opens
  useEffect(() => {
    if (isOpen && currentProject) {
      dispatch(fetchProjectMembers(currentProject.id));
    }
  }, [isOpen, currentProject, dispatch]);

  const handleClose = () => {
    dispatch(closeTeamModal());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
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
        <div className="p-6">
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
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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