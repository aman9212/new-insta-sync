import React from 'react';
import { BellIcon, SearchIcon, UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Simple admin top navigation bar.
 * Includes brand logo, global search placeholder, and user avatar.
 */
const Navbar: React.FC = () => {
  return (
    <header className="flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 shadow-sm">
      {/* Logo / Brand */}
      <Link to="/admin" className="text-xl font-semibold text-gray-800 dark:text-gray-200">
        CreatorX Admin
      </Link>

      {/* Global search placeholder */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="pl-8 pr-4 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
        {/* Notification bell */}
        <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        {/* User avatar placeholder */}
        <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
