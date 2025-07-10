// // JWT debugging utilities (from authDebug.ts)
// export const decodeJwt = (token: string) => {
//   try {
//     const base64Url = token.split('.')[1];
//     const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//     const jsonPayload = decodeURIComponent(
//       atob(base64)
//         .split('')
//         .map(function(c) {
//           return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//         })
//         .join('')
//     );
//     return JSON.parse(jsonPayload);
//   } catch (error) {
//     console.error('Error decoding JWT:', error);
//     return null;
//   }
// };

// export const debugToken = async (getToken: () => Promise<string | undefined>) => {
//   try {
//     console.log('Attempting to get token...');
//     const token = await getToken();
    
//     if (!token) {
//       console.error('No token received');
//       return;
//     }
    
//     console.log('Token received (first 10 chars):', token.substring(0, 10) + '...');
    
//     const payload = decodeJwt(token);
//     console.log('Token payload:', payload);
    
//     if (payload) {
//       console.log('Token audience:', payload.aud);
//       console.log('Token subject (user id):', payload.sub);
//       console.log('Token expiration:', new Date(payload.exp * 1000).toISOString());
      
//       if (payload.email) {
//         console.log('Token has email claim:', payload.email);
//       } else {
//         console.warn('Token does not have an email claim!');
//       }
//     }
    
//     return payload;
//   } catch (error) {
//     console.error('Error debugging token:', error);
//   }
// };

// Welcome tasks for new users (from welcomeTasks.ts)
import { TaskPriority, TaskStatus } from '../types';

export const getWelcomeTasks = () => {
  return [
    {
      title: '🔍 Try filtering and searching',
      description: 'Use the filters and search bar to quickly find the tasks you need.',
      status: 'not started' as TaskStatus,
      priority: 'urgent' as TaskPriority,
      projectId: 'default', 
      customFields: { 
        "Example custom field": "You can add custom fields to tasks!" 
      } as Record<string, string | number | boolean>
    },
    {
      title: '✏️ Quick-add tasks in any column',
      description: 'Use the "+ Add task" button at the bottom of any column to quickly create tasks with that priority level.',
      status: 'not started' as TaskStatus,
      priority: 'high' as TaskPriority,
      projectId: 'default', 
      customFields: {} as Record<string, string | number | boolean>
    },
    {
      title: '⭐ Create your first task',
      description: 'Try creating a new task with the "+ Add task" button below or using the "New Task" button in the header.',
      status: 'not started' as TaskStatus,
      priority: 'medium' as TaskPriority,
      projectId: 'default', 
      customFields: {} as Record<string, string | number | boolean>
    },
    {
      title: '🗂️ Switch between List and Kanban views',
      description: 'Use the view selector in the header to switch between different ways of organizing your tasks.',
      status: 'not started' as TaskStatus,
      priority: 'low' as TaskPriority,
      projectId: 'default', 
      customFields: {} as Record<string, string | number | boolean>
    },
    {
      title: '👋 Welcome to Notionesque!',
      description: 'This is your new task management app. Here are a few tips to get you started:\n\n• Tasks can be organized by priority (columns) and status\n• Drag tasks between columns to change priority\n• Drag within a column to reorder tasks\n• Click on a task to view details',
      status: 'not started' as TaskStatus,
      priority: 'none' as TaskPriority,
      projectId: 'default', 
      customFields: {} as Record<string, string | number | boolean>
    },
  ];
};