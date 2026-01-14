import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  BanknotesIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  TrophyIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const location = useLocation();

  // Navigation items
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Accounts', href: '/accounts', icon: BanknotesIcon },
    { name: 'Transactions', href: '/transactions', icon: ArrowsRightLeftIcon },
    { name: 'Budgets', href: '/budgets', icon: ChartBarIcon },
    { name: 'Goals', href: '/goals', icon: TrophyIcon },
    { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  // Check if current route matches
  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex flex-col w-64 bg-indigo-700 min-h-screen">
      {/* Logo Section */}
      <div className="flex items-center justify-center h-16 bg-indigo-800">
        <h1 className="text-xl font-bold text-white">FinCopilot</h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${
                  active
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
                }
              `}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Section (Optional) */}
      <div className="px-4 py-4 border-t border-indigo-600">
        <p className="text-xs text-indigo-300 text-center">
          FinCopilot v1.0
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
