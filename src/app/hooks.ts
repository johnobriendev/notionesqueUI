// src/app/hooks.ts
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
// These provide the correct TypeScript types for your store structure
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

// Alternative approach if the above doesn't work - more explicit typing
export const useTypedDispatch = () => {
  const dispatch = useDispatch();
  return dispatch as AppDispatch;
};