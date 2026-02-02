import { AuthProvider } from '@context/AuthContext';
import { StudentAppContent } from '../components/StudentAppContent';

export const StudentApp = () => (
  <AuthProvider>
    <StudentAppContent />
  </AuthProvider>
);
