// src/app/store.ts
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, PersistConfig } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import tasksReducer from '../features/tasks/store/tasksSlice';
import uiReducer from '../features/ui/store/uiSlice';
import projectsReducer from '../features/projects/store/projectsSlice';
import commandsReducer from '../features/commands/store/commandSlice';
import collaborationReducer from '../features/collaboration/store/collaborationSlice';
import commentsReducer from '../features/comments/store/commentsSlice';



const uiPersistConfig: PersistConfig<any> = {
  key: 'ui',
  storage,
  whitelist: [
    'currentProjectId',    // Just the ID, not the full project data
    'viewMode',           // kanban vs list view preference
    'theme',              // if you have theme preferences
    'sidebarCollapsed',   // UI state preferences
   
  ],
};


const rootReducer = combineReducers({
  tasks: tasksReducer,
  ui: persistReducer(uiPersistConfig, uiReducer),
  projects: projectsReducer,
  commands: commandsReducer,
  collaboration: collaborationReducer,
  comments: commentsReducer,
});



// Create the store with the persisted reducer
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializability check
        ignoredActions: [
          'persist/PERSIST', 
          'persist/REHYDRATE',
          // UPDATED: Ignore command-related actions that contain functions
          'commands/executeCommand/pending',
          'commands/executeCommand/fulfilled', 
          'commands/executeCommand/rejected',
          'commands/undoLastCommand/pending',
          'commands/undoLastCommand/fulfilled',
          'commands/undoLastCommand/rejected',
          'commands/redoLastCommand/pending',
          'commands/redoLastCommand/fulfilled',
          'commands/redoLastCommand/rejected'
        ],
        // Also ignore command functions in the serialization check
        ignoredActionsPaths: [
          'payload.execute', 
          'payload.undo',
          'meta.arg.execute',
          'meta.arg.undo'
        ],
        ignoredPaths: ['commands.undoStack', 'commands.redoStack'],
      },
    }),
});

export const persistor = persistStore(store);

//  Helper function for clean logout
export const clearPersistedState = () => {
  persistor.purge();
};

// Export the proper types - this is crucial for TypeScript to understand our new structure
export type AppStore = typeof store;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;