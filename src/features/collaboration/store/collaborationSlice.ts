//src/features/collaboration/store/collaborationSlice.ts 

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ProjectMember, CollaborationState, Invitation, UserRole } from '../../../types';
import api from '../../../lib/api';

// Super simple initial state - just team members
const initialState: CollaborationState = {
  projectMembers: [],
  pendingInvitations: [],
  isLoadingMembers: false,
  isLoadingInvitations: false,
  isSendingInvitation: false,
  isUpdatingRole: false,
  isRemovingMember: false,
  isAcceptingInvitation: false,
  isDecliningInvitation: false,
  membersError: null,
  invitationsError: null,
  inviteError: null,
  roleUpdateError: null,
  removeError: null,
  acceptError: null,
  declineError: null,
};

export const fetchProjectMembers = createAsyncThunk(
  'collaboration/fetchProjectMembers',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/team/projects/${projectId}/collaborators`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch team members');
    }
  }
);

export const fetchPendingInvitations = createAsyncThunk(
  'collaboration/fetchPendingInvitations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/team/users/invitations');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch invitations');
    }
  }
);


export const inviteUser = createAsyncThunk(
  'collaboration/inviteUser',
  async (
    data: { projectId: string; email: string; role: string },
    { rejectWithValue }
  ) => {
    try {
      await api.post(`/team/projects/${data.projectId}/invite`, {
        email: data.email,
        role: data.role
      });
      return data; // Return the invite data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send invitation');
    }
  }
);

// Update member role
export const updateMemberRole = createAsyncThunk(
  'collaboration/updateMemberRole',
  async (
    data: { projectId: string; userId: string; role: UserRole },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/team/projects/${data.projectId}/collaborators/${data.userId}/role`, {
        role: data.role
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update member role');
    }
  }
);

// Remove team member
export const removeMember = createAsyncThunk(
  'collaboration/removeMember',
  async (
    data: { projectId: string; userId: string },
    { rejectWithValue }
  ) => {
    try {
      await api.delete(`/team/projects/${data.projectId}/collaborators/${data.userId}`);
      return data.userId; // Return the removed user ID
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove team member');
    }
  }
);



export const acceptInvitation = createAsyncThunk(
  'collaboration/acceptInvitation',
  async (invitationToken: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/team/invitations/${invitationToken}/accept`);
      return { invitationToken, project: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept invitation');
    }
  }
);

// Decline invitation
export const declineInvitation = createAsyncThunk(
  'collaboration/declineInvitation',
  async (invitationId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/team/invitations/${invitationId}`);
      return invitationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to decline invitation');
    }
  }
);

// Minimal slice - just handle fetching members
const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    // Just one reducer for now
    clearProjectMembers: (state) => {
      state.projectMembers = [];
      state.membersError = null;
    },
    clearInvitationsError: (state) => {
      state.invitationsError = null;
      state.acceptError = null;
      state.declineError = null;
    },
     clearTeamManagementErrors: (state) => {
      state.roleUpdateError = null;
      state.removeError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Only handle fetching members for now
      .addCase(fetchProjectMembers.pending, (state) => {
        state.isLoadingMembers = true;
        state.membersError = null;
      })
      .addCase(fetchProjectMembers.fulfilled, (state, action) => {
        state.isLoadingMembers = false;
        state.projectMembers = action.payload;
      })
      .addCase(fetchProjectMembers.rejected, (state, action) => {
        state.isLoadingMembers = false;
        state.membersError = action.payload as string;
      })
      .addCase(fetchPendingInvitations.pending, (state) => {
        state.isLoadingInvitations = true;
        state.invitationsError = null;
      })
      .addCase(fetchPendingInvitations.fulfilled, (state, action) => {
        state.isLoadingInvitations = false;
        state.pendingInvitations = action.payload;
      })
      .addCase(fetchPendingInvitations.rejected, (state, action) => {
        state.isLoadingInvitations = false;
        state.invitationsError = action.payload as string;
      })
      .addCase(inviteUser.pending, (state) => {
        state.isSendingInvitation = true;
        state.inviteError = null;
      })
      .addCase(inviteUser.fulfilled, (state) => {
        state.isSendingInvitation = false;
        // Invitation sent successfully
      })
      .addCase(inviteUser.rejected, (state, action) => {
        state.isSendingInvitation = false;
        state.inviteError = action.payload as string;
      })
      .addCase(updateMemberRole.pending, (state) => {
        state.isUpdatingRole = true;
        state.roleUpdateError = null;
      })
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        state.isUpdatingRole = false;
        // Update the member in the local state
        const memberIndex = state.projectMembers.findIndex(
          member => member.userId === action.payload.id
        );
        if (memberIndex !== -1) {
          state.projectMembers[memberIndex] = {
            ...state.projectMembers[memberIndex],
            role: action.payload.role
          };
        }
      })
      .addCase(updateMemberRole.rejected, (state, action) => {
        state.isUpdatingRole = false;
        state.roleUpdateError = action.payload as string;
      })
      .addCase(removeMember.pending, (state) => {
        state.isRemovingMember = true;
        state.removeError = null;
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.isRemovingMember = false;
        // Remove the member from local state
        state.projectMembers = state.projectMembers.filter(
          member => member.userId !== action.payload
        );
      })
      .addCase(removeMember.rejected, (state, action) => {
        state.isRemovingMember = false;
        state.removeError = action.payload as string;
      })
      .addCase(acceptInvitation.pending, (state) => {
        state.isAcceptingInvitation = true;
        state.acceptError = null;
      })
      .addCase(acceptInvitation.fulfilled, (state, action) => {
        state.isAcceptingInvitation = false;
        // Remove accepted invitation from pending list
        state.pendingInvitations = state.pendingInvitations.filter(
          inv => inv.token !== action.payload.invitationToken
        );
      })
      .addCase(acceptInvitation.rejected, (state, action) => {
        state.isAcceptingInvitation = false;
        state.acceptError = action.payload as string;
      })

      // Decline invitation
      .addCase(declineInvitation.pending, (state) => {
        state.isDecliningInvitation = true;
        state.declineError = null;
      })
      .addCase(declineInvitation.fulfilled, (state, action) => {
        state.isDecliningInvitation = false;
        // Remove declined invitation from pending list
        state.pendingInvitations = state.pendingInvitations.filter(
          inv => inv.id !== action.payload
        );
      })
      .addCase(declineInvitation.rejected, (state, action) => {
        state.isDecliningInvitation = false;
        state.declineError = action.payload as string;
      });
  }
});

export const { clearProjectMembers, clearInvitationsError, clearTeamManagementErrors } = collaborationSlice.actions;
export default collaborationSlice.reducer;

export const selectProjectMembers = (state: { collaboration: CollaborationState }) =>
  state.collaboration.projectMembers;
export const selectPendingInvitations = (state: { collaboration: CollaborationState }) =>
  state.collaboration.pendingInvitations;
export const selectIsLoadingMembers = (state: { collaboration: CollaborationState }) =>
  state.collaboration.isLoadingMembers;
export const selectIsLoadingInvitations = (state: { collaboration: CollaborationState }) =>
  state.collaboration.isLoadingInvitations;
export const selectIsSendingInvitation = (state: { collaboration: CollaborationState }) => 
  state.collaboration.isSendingInvitation;
export const selectIsUpdatingRole = (state: { collaboration: CollaborationState }) => 
  state.collaboration.isUpdatingRole;
export const selectIsRemovingMember = (state: { collaboration: CollaborationState }) => 
  state.collaboration.isRemovingMember;
export const selectIsAcceptingInvitation = (state: { collaboration: CollaborationState }) => 
  state.collaboration.isAcceptingInvitation;
export const selectIsDecliningInvitation = (state: { collaboration: CollaborationState }) => 
  state.collaboration.isDecliningInvitation;
export const selectInviteError = (state: { collaboration: CollaborationState }) => 
  state.collaboration.inviteError;
export const selectRoleUpdateError = (state: { collaboration: CollaborationState }) => 
  state.collaboration.roleUpdateError;
export const selectRemoveError = (state: { collaboration: CollaborationState }) => 
  state.collaboration.removeError;
export const selectInvitationsError = (state: { collaboration: CollaborationState }) => 
  state.collaboration.invitationsError;
export const selectAcceptError = (state: { collaboration: CollaborationState }) => 
  state.collaboration.acceptError;
export const selectDeclineError = (state: { collaboration: CollaborationState }) => 
  state.collaboration.declineError;