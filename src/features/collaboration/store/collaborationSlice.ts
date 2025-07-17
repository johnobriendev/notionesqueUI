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

// Just ONE async thunk for now - fetch team members
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
      });
  }
});

export const { clearProjectMembers } = collaborationSlice.actions;
export default collaborationSlice.reducer;

// Just two selectors for now
export const selectProjectMembers = (state: { collaboration: CollaborationState }) => 
  state.collaboration.projectMembers;
export const selectIsLoadingMembers = (state: { collaboration: CollaborationState }) => 
  state.collaboration.isLoadingMembers;