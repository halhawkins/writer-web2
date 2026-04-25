// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { projectSlice } from './src/ProjectWindow/ProjectSlice';
import { appMenuSlice } from './src/AppMenu/AppMenuSlice';
// Import your slice reducers here as you create them

const store = configureStore({
  reducer: {
    project: projectSlice.reducer,
    appMenu: appMenuSlice.reducer,
    // Add your slice reducers here as you create them
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
