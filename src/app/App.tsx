import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@context/AuthContext';
import { AdminDashboard } from '@components/AdminDashboard';
import { AdminLogin } from '@components/AdminLogin';
import { useAuth } from '@context/AuthContext';

function AdminContent() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading Admin Portal...</p>
                </div>
            </div>
        );
    }

    // Check if user is admin
    if (!user || user.role !== 'admin') {
        return <AdminLogin />;
    }

    return <AdminDashboard />;
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AdminContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
