import { Shield, User, LogOut, MessageCircle } from 'lucide-react';
import { useAuth } from '@context/AuthContext';

export const Header: React.FC<{ onChatToggle: () => void }> = ({ onChatToggle }) => {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-orange-500/30 bg-black text-white shadow-2xl backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 animate-pulse text-orange-500" />
            <h1 className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-xl font-bold text-transparent">
              Career Connect
            </h1>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <button
                onClick={onChatToggle}
                className="flex items-center space-x-2 rounded-xl bg-black px-3 py-2 transition-all duration-200 hover:bg-neutral-900"
              >
                <MessageCircle className="h-5 w-5 text-white" />
                <span className="hidden text-white sm:inline">AI Assistant</span>
              </button>

              <div className="flex items-center space-x-2 rounded-xl border border-neutral-800 bg-black px-3 py-2">
                <User className="h-5 w-5 text-white" />
                <span className="hidden font-medium text-white sm:inline">{user.name}</span>
              </div>

              <button
                type="button"
                onClick={logout}
                className="flex cursor-pointer items-center space-x-2 rounded-xl bg-red-600 px-3 py-2 transition-all duration-200 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
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
