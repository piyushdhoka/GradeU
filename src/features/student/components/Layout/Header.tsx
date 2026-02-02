import { Shield, User, LogOut, MessageCircle } from 'lucide-react';
import { useAuth } from '@context/AuthContext';

export const Header: React.FC<{ onChatToggle: () => void }> = ({ onChatToggle }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-black text-white shadow-2xl border-b border-orange-500/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-orange-500 animate-pulse" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Career Connect</h1>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <button
                onClick={onChatToggle}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-black hover:bg-neutral-900 transition-all duration-200"
              >
                <MessageCircle className="h-5 w-5 text-white" />
                <span className="hidden sm:inline text-white">AI Assistant</span>
              </button>

              <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-black border border-neutral-800">
                <User className="h-5 w-5 text-white" />
                <span className="hidden sm:inline text-white font-medium">{user.name}</span>
              </div>

              <button
                type="button"
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};