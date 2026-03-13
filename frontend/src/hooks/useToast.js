import { useContext } from 'react';
import { ToastCtx }  from '../components/feedback/ToastProvider';


export function useToast() {
  return useContext(ToastCtx);
}