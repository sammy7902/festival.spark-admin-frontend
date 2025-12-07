import { Menu } from 'lucide-react';
import { getAuthState } from '../../store/auth';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const authState = getAuthState();
  const user = authState.user;

  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 left-0 sm:left-64 right-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3 sm:gap-0">
        <button
          onClick={onMenuClick}
          className="sm:hidden p-2 text-gray-600 hover:text-gray-900"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Welcome back</h2>
          <p className="text-xs sm:text-sm text-gray-500">{user?.name || 'User'}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[200px]">
            {user?.email}
          </p>
          <p className="text-xs text-gray-500 capitalize">{user?.role || 'admin'}</p>
        </div>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <span className="text-xs sm:text-sm font-medium text-gray-700">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
      </div>
    </header>
  );
};

