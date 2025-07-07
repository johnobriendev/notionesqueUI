// src/app/store.ts
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, PersistConfig } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import tasksReducer from '../features/tasks/store/tasksSlice';
import uiReducer from '../features/ui/store/uiSlice';
import projectsReducer from '../features/projects/store/projectsSlice';
import commandsReducer from '../features/commands/store/commandSlice';

// Use combineReducers to create the root reducer first
const rootReducer = combineReducers({
  tasks: tasksReducer,
  ui: uiReducer,
  projects: projectsReducer,
  commands: commandsReducer,
});

// Define the persist config for specific slices
const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
  key: 'root',
  storage,
  whitelist: ['tasks', 'projects'], // Only persist tasks and projects, not ui or commands
  blacklist: ['ui', 'commands']
};

// Create the persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create the store with the persisted reducer
export const store = configureStore({
  reducer: persistedReducer,
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
        iignoredActionsPaths: [
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

// Export the proper types - this is crucial for TypeScript to understand our new structure
export type AppStore = typeof store;
export type RootState = ReturnType<typeof persistedReducer>;
export type AppDispatch = typeof store.dispatch;