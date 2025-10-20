// src/features/collaboration/store/collaborationSlice.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import collaborationReducer, {
  clearProjectMembers,
  clearInvitationsError,
  clearTeamManagementErrors,
  fetchProjectMembers,
  fetchPendingInvitations,
  inviteUser,
  updateMemberRole,
  removeMember,
  acceptInvitation,
  declineInvitation,
} from './collaborationSlice';
import api from '../../../lib/api';
import { ProjectMember, Invitation, UserRole } from '../../../types';

// Mock the API module
vi.mock('../../../lib/api');

describe('collaborationSlice', () => {
  let store: ReturnType<typeof configureStore>;

  const createMockMember = (overrides?: Partial<ProjectMember>): ProjectMember => ({
    id: 'member-1',
    userId: 'user-1',
    projectId: 'project-1',
    role: 'editor',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    joinedAt: new Date().toISOString(),
    ...overrides,
  });

  const createMockInvitation = (overrides?: Partial<Invitation>): Invitation => ({
    id: 'invitation-1',
    projectId: 'project-1',
    project: {
      name: 'Test Project',
      description: 'Test Description',
    },
    sender: {
      email: 'sender@example.com',
      name: 'Sender Name',
    },
    receiverEmail: 'receiver@example.com',
    role: 'editor',
    status: 'pending',
    token: 'test-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    store = configureStore({
      reducer: {
        collaboration: collaborationReducer,
      },
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().collaboration;

      expect(state).toEqual({
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
      });
    });
  });

  describe('clearProjectMembers reducer', () => {
    it('should clear project members and error', () => {
      const storeWithData = configureStore({
        reducer: {
          collaboration: collaborationReducer,
        },
        preloadedState: {
          collaboration: {
            projectMembers: [createMockMember()],
            pendingInvitations: [],
            isLoadingMembers: false,
            isLoadingInvitations: false,
            isSendingInvitation: false,
            isUpdatingRole: false,
            isRemovingMember: false,
            isAcceptingInvitation: false,
            isDecliningInvitation: false,
            membersError: 'Some error',
            invitationsError: null,
            inviteError: null,
            roleUpdateError: null,
            removeError: null,
            acceptError: null,
            declineError: null,
          },
        },
      });

      storeWithData.dispatch(clearProjectMembers());

      const state = storeWithData.getState().collaboration;
      expect(state.projectMembers).toEqual([]);
      expect(state.membersError).toBeNull();
    });
  });

  describe('clearInvitationsError reducer', () => {
    it('should clear invitation-related errors', () => {
      const storeWithErrors = configureStore({
        reducer: {
          collaboration: collaborationReducer,
        },
        preloadedState: {
          collaboration: {
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
            invitationsError: 'Invitation error',
            inviteError: null,
            roleUpdateError: null,
            removeError: null,
            acceptError: 'Accept error',
            declineError: 'Decline error',
          },
        },
      });

      storeWithErrors.dispatch(clearInvitationsError());

      const state = storeWithErrors.getState().collaboration;
      expect(state.invitationsError).toBeNull();
      expect(state.acceptError).toBeNull();
      expect(state.declineError).toBeNull();
    });
  });

  describe('clearTeamManagementErrors reducer', () => {
    it('should clear team management errors', () => {
      const storeWithErrors = configureStore({
        reducer: {
          collaboration: collaborationReducer,
        },
        preloadedState: {
          collaboration: {
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
            roleUpdateError: 'Role update error',
            removeError: 'Remove error',
            acceptError: null,
            declineError: null,
          },
        },
      });

      storeWithErrors.dispatch(clearTeamManagementErrors());

      const state = storeWithErrors.getState().collaboration;
      expect(state.roleUpdateError).toBeNull();
      expect(state.removeError).toBeNull();
    });
  });

  describe('fetchProjectMembers async thunk', () => {
    it('should set loading state when pending', () => {
      const action = { type: fetchProjectMembers.pending.type };
      const state = collaborationReducer(undefined, action);

      expect(state.isLoadingMembers).toBe(true);
      expect(state.membersError).toBe(null);
    });

    it('should set members when fulfilled', async () => {
      const mockMembers = [
        createMockMember({ id: 'member-1' }),
        createMockMember({ id: 'member-2', userId: 'user-2' }),
      ];
      vi.mocked(api.get).mockResolvedValue({ data: mockMembers });

      await store.dispatch(fetchProjectMembers('project-1'));
      const state = store.getState().collaboration;

      expect(state.isLoadingMembers).toBe(false);
      expect(state.projectMembers).toEqual(mockMembers);
      expect(state.membersError).toBe(null);
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to fetch team members';
      vi.mocked(api.get).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(fetchProjectMembers('project-1'));
      const state = store.getState().collaboration;

      expect(state.isLoadingMembers).toBe(false);
      expect(state.membersError).toBe(errorMessage);
    });
  });

  describe('fetchPendingInvitations async thunk', () => {
    it('should set loading state when pending', () => {
      const action = { type: fetchPendingInvitations.pending.type };
      const state = collaborationReducer(undefined, action);

      expect(state.isLoadingInvitations).toBe(true);
      expect(state.invitationsError).toBe(null);
    });

    it('should set invitations when fulfilled', async () => {
      const mockInvitations = [
        createMockInvitation({ id: 'inv-1' }),
        createMockInvitation({ id: 'inv-2', token: 'token-2' }),
      ];
      vi.mocked(api.get).mockResolvedValue({ data: mockInvitations });

      await store.dispatch(fetchPendingInvitations());
      const state = store.getState().collaboration;

      expect(state.isLoadingInvitations).toBe(false);
      expect(state.pendingInvitations).toEqual(mockInvitations);
      expect(state.invitationsError).toBe(null);
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to fetch invitations';
      vi.mocked(api.get).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(fetchPendingInvitations());
      const state = store.getState().collaboration;

      expect(state.isLoadingInvitations).toBe(false);
      expect(state.invitationsError).toBe(errorMessage);
    });
  });

  describe('inviteUser async thunk', () => {
    it('should set sending state when pending', () => {
      const action = { type: inviteUser.pending.type };
      const state = collaborationReducer(undefined, action);

      expect(state.isSendingInvitation).toBe(true);
      expect(state.inviteError).toBe(null);
    });

    it('should complete invitation when fulfilled', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: {} });

      await store.dispatch(
        inviteUser({
          projectId: 'project-1',
          email: 'newuser@example.com',
          role: 'editor',
        })
      );

      const state = store.getState().collaboration;
      expect(state.isSendingInvitation).toBe(false);
      expect(state.inviteError).toBe(null);
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to send invitation';
      vi.mocked(api.post).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(
        inviteUser({
          projectId: 'project-1',
          email: 'newuser@example.com',
          role: 'editor',
        })
      );

      const state = store.getState().collaboration;
      expect(state.isSendingInvitation).toBe(false);
      expect(state.inviteError).toBe(errorMessage);
    });
  });

  describe('updateMemberRole async thunk', () => {
    it('should set updating state when pending', () => {
      const action = { type: updateMemberRole.pending.type };
      const state = collaborationReducer(undefined, action);

      expect(state.isUpdatingRole).toBe(true);
      expect(state.roleUpdateError).toBe(null);
    });

    it('should update member role in state when fulfilled', async () => {
      const existingMember = createMockMember({ userId: 'user-1', role: 'editor' });
      const updatedMemberData = { id: 'user-1', role: 'viewer' as UserRole };
      vi.mocked(api.put).mockResolvedValue({ data: updatedMemberData });

      const storeWithData = configureStore({
        reducer: {
          collaboration: collaborationReducer,
        },
        preloadedState: {
          collaboration: {
            projectMembers: [existingMember],
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
          },
        },
      });

      await storeWithData.dispatch(
        updateMemberRole({
          projectId: 'project-1',
          userId: 'user-1',
          role: 'viewer',
        })
      );

      const state = storeWithData.getState().collaboration;
      expect(state.isUpdatingRole).toBe(false);
      expect(state.projectMembers[0].role).toBe('viewer');
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to update member role';
      vi.mocked(api.put).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(
        updateMemberRole({
          projectId: 'project-1',
          userId: 'user-1',
          role: 'viewer',
        })
      );

      const state = store.getState().collaboration;
      expect(state.isUpdatingRole).toBe(false);
      expect(state.roleUpdateError).toBe(errorMessage);
    });
  });

  describe('removeMember async thunk', () => {
    it('should set removing state when pending', () => {
      const action = { type: removeMember.pending.type };
      const state = collaborationReducer(undefined, action);

      expect(state.isRemovingMember).toBe(true);
      expect(state.removeError).toBe(null);
    });

    it('should remove member from state when fulfilled', async () => {
      const member1 = createMockMember({ userId: 'user-1' });
      const member2 = createMockMember({ userId: 'user-2' });
      vi.mocked(api.delete).mockResolvedValue({ data: {} });

      const storeWithData = configureStore({
        reducer: {
          collaboration: collaborationReducer,
        },
        preloadedState: {
          collaboration: {
            projectMembers: [member1, member2],
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
          },
        },
      });

      await storeWithData.dispatch(
        removeMember({
          projectId: 'project-1',
          userId: 'user-1',
        })
      );

      const state = storeWithData.getState().collaboration;
      expect(state.isRemovingMember).toBe(false);
      expect(state.projectMembers).toHaveLength(1);
      expect(state.projectMembers[0].userId).toBe('user-2');
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to remove team member';
      vi.mocked(api.delete).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(
        removeMember({
          projectId: 'project-1',
          userId: 'user-1',
        })
      );

      const state = store.getState().collaboration;
      expect(state.isRemovingMember).toBe(false);
      expect(state.removeError).toBe(errorMessage);
    });
  });

  describe('acceptInvitation async thunk', () => {
    it('should set accepting state when pending', () => {
      const action = { type: acceptInvitation.pending.type };
      const state = collaborationReducer(undefined, action);

      expect(state.isAcceptingInvitation).toBe(true);
      expect(state.acceptError).toBe(null);
    });

    it('should remove invitation from pending list when fulfilled', async () => {
      const invitation1 = createMockInvitation({ token: 'token-1' });
      const invitation2 = createMockInvitation({ token: 'token-2' });
      vi.mocked(api.post).mockResolvedValue({ data: { id: 'project-1' } });

      const storeWithData = configureStore({
        reducer: {
          collaboration: collaborationReducer,
        },
        preloadedState: {
          collaboration: {
            projectMembers: [],
            pendingInvitations: [invitation1, invitation2],
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
          },
        },
      });

      await storeWithData.dispatch(acceptInvitation('token-1'));

      const state = storeWithData.getState().collaboration;
      expect(state.isAcceptingInvitation).toBe(false);
      expect(state.pendingInvitations).toHaveLength(1);
      expect(state.pendingInvitations[0].token).toBe('token-2');
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to accept invitation';
      vi.mocked(api.post).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(acceptInvitation('token-1'));

      const state = store.getState().collaboration;
      expect(state.isAcceptingInvitation).toBe(false);
      expect(state.acceptError).toBe(errorMessage);
    });
  });

  describe('declineInvitation async thunk', () => {
    it('should set declining state when pending', () => {
      const action = { type: declineInvitation.pending.type };
      const state = collaborationReducer(undefined, action);

      expect(state.isDecliningInvitation).toBe(true);
      expect(state.declineError).toBe(null);
    });

    it('should remove invitation from pending list when fulfilled', async () => {
      const invitation1 = createMockInvitation({ id: 'inv-1' });
      const invitation2 = createMockInvitation({ id: 'inv-2' });
      vi.mocked(api.delete).mockResolvedValue({ data: {} });

      const storeWithData = configureStore({
        reducer: {
          collaboration: collaborationReducer,
        },
        preloadedState: {
          collaboration: {
            projectMembers: [],
            pendingInvitations: [invitation1, invitation2],
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
          },
        },
      });

      await storeWithData.dispatch(declineInvitation('inv-1'));

      const state = storeWithData.getState().collaboration;
      expect(state.isDecliningInvitation).toBe(false);
      expect(state.pendingInvitations).toHaveLength(1);
      expect(state.pendingInvitations[0].id).toBe('inv-2');
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to decline invitation';
      vi.mocked(api.delete).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(declineInvitation('inv-1'));

      const state = store.getState().collaboration;
      expect(state.isDecliningInvitation).toBe(false);
      expect(state.declineError).toBe(errorMessage);
    });
  });
});
