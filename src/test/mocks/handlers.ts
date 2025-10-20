// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { Task, Project, Comment, Invitation, ProjectMember } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const handlers = [
  // Tasks endpoints
  http.get(`${API_URL}/projects/:projectId/tasks`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${API_URL}/projects/:projectId/tasks`, async ({ request }) => {
    const body = await request.json() as any;
    const newTask: Task = {
      id: 'mock-task-id',
      projectId: body.projectId,
      title: body.title,
      description: body.description || null,
      status: body.status || 'not started',
      priority: body.priority || 'low',
      position: body.position || 0,
      statusPosition: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: body.customFields || {},
      version: 1,
      updatedBy: 'test@example.com',
    };
    return HttpResponse.json(newTask, { status: 201 });
  }),

  http.patch(`${API_URL}/projects/:projectId/tasks/:taskId`, async ({ request }) => {
    const body = await request.json() as any;
    const updatedTask: Task = {
      id: 'mock-task-id',
      projectId: 'mock-project-id',
      title: body.title || 'Updated Task',
      description: body.description || null,
      status: body.status || 'not started',
      priority: body.priority || 'low',
      position: body.position || 0,
      statusPosition: body.statusPosition || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: body.customFields || {},
      version: (body.version || 1) + 1,
      updatedBy: 'test@example.com',
    };
    return HttpResponse.json(updatedTask);
  }),

  http.delete(`${API_URL}/projects/:projectId/tasks/:taskId`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Projects endpoints
  http.get(`${API_URL}/projects`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${API_URL}/projects`, async ({ request }) => {
    const body = await request.json() as any;
    const newProject: Project = {
      id: 'mock-project-id',
      name: body.name,
      description: body.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'mock-user-id',
      userRole: 'owner',
      canWrite: true,
    };
    return HttpResponse.json(newProject, { status: 201 });
  }),

  http.patch(`${API_URL}/projects/:projectId`, async ({ request }) => {
    const body = await request.json() as any;
    const updatedProject: Project = {
      id: 'mock-project-id',
      name: body.name || 'Updated Project',
      description: body.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'mock-user-id',
      userRole: 'owner',
      canWrite: true,
    };
    return HttpResponse.json(updatedProject);
  }),

  http.delete(`${API_URL}/projects/:projectId`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Comments endpoints
  http.get(`${API_URL}/projects/:projectId/tasks/:taskId/comments`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${API_URL}/projects/:projectId/tasks/:taskId/comments`, async ({ request }) => {
    const body = await request.json() as any;
    const newComment: Comment = {
      id: 'mock-comment-id',
      content: body.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      taskId: 'mock-task-id',
      userId: 'mock-user-id',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    };
    return HttpResponse.json(newComment, { status: 201 });
  }),

  // Collaboration endpoints
  http.get(`${API_URL}/projects/:projectId/members`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${API_URL}/projects/:projectId/invitations`, async ({ request }) => {
    const body = await request.json() as any;
    const newInvitation: Invitation = {
      id: 'mock-invitation-id',
      projectId: 'mock-project-id',
      project: {
        name: 'Test Project',
        description: 'Test Description',
      },
      sender: {
        email: 'sender@example.com',
        name: 'Sender Name',
      },
      receiverEmail: body.email,
      role: body.role,
      status: 'pending',
      token: 'mock-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newInvitation, { status: 201 });
  }),

  http.get(`${API_URL}/invitations`, () => {
    return HttpResponse.json([]);
  }),
];
