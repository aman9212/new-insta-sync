import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, BarChart2Icon, SettingsIcon, UsersIcon, FileTextIcon, ActivityIcon } from 'lucide-react';

/**
 * Admin sidebar navigation.
 * Uses NavLink to highlight the active route.
 */
const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: <HomeIcon className="w-5 h-5" /> },
    { to: '/admin/analytics', label: 'Analytics', icon: <BarChart2Icon className="w-5 h-5" /> },
    { to: '/admin/users', label: 'Users', icon: <UsersIcon className="w-5 h-5" /> },
    { to: '/admin/content', label: 'Content', icon: <FileTextIcon className="w-5 h-5" /> },
    { to: '/admin/tracking', label: 'Tracking Engine', icon: <ActivityIcon className="w-5 h-5" /> },
    { to: '/admin/settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <nav className="flex-1 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 ${
                isActive ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
              }`
            }
          >
            {item.icon}
            <span className="ml-3">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
