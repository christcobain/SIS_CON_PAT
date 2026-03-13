import './api/interceptors';
import AppRouter from './routes/AppRouter';
import ToastProvider from './components/feedback/ToastProvider';


export default function App() {
  return <ToastProvider><AppRouter /></ToastProvider>
}
