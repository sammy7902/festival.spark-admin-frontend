import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, DollarSign, FileText, LogOut, X, FolderTree, Layers, Package } from 'lucide-react';
import { clearAuth, getAuthState } from '../../store/auth';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/earnings', label: 'Earnings', icon: DollarSign },
  { path: '/generate-bill', label: 'Generate Bill', icon: FileText },
  { path: '/categories', label: 'Categories', icon: FolderTree },
  { path: '/subcategories', label: 'Subcategories', icon: Layers },
  { path: '/items', label: 'Item Master', icon: Package },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const authState = getAuthState();

  const handleLogout = () => {
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <aside
        className={`w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } sm:translate-x-0`}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2 flex-1">
            <img src="/logo.png" alt="Festival Spark" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900">Festival Spark</h1>
              <p className="text-xs text-gray-500">Bill Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="sm:hidden p-2 text-gray-600 hover:text-gray-900"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onClose?.()}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm sm:text-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="text-sm sm:text-base">Logout</span>
          </Button>
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Made with <span className="text-red-500">♥</span> by<br />
              <span className="font-medium text-gray-500">Shivam Shah</span><br />
              for Festival Spark
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

