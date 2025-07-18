//src/features/collaboration/store/collaborationSlice.ts 

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ProjectMember, CollaborationState } from '../../../types';
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
      });
  }
});

export const { clearProjectMembers } = collaborationSlice.actions;
export default collaborationSlice.reducer;


export const selectProjectMembers = (state: { collaboration: CollaborationState }) =>
  state.collaboration.projectMembers;
export const selectIsLoadingMembers = (state: { collaboration: CollaborationState }) =>
  state.collaboration.isLoadingMembers;
export const selectIsSendingInvitation = (state: { collaboration: CollaborationState }) => 
  state.collaboration.isSendingInvitation;
export const selectInviteError = (state: { collaboration: CollaborationState }) => 
  state.collaboration.inviteError;