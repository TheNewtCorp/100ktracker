import React from 'react';
import { User, Watch, BarChart3, CreditCard } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export type TabId = 'general' | 'watches' | 'metrics' | 'cards';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<any>;
  badge?: number;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, onTabChange }) => {
  const { theme } = useTheme();

  return (
    <div className={`border-b ${theme === 'light' ? 'border-gray-200' : 'border-champagne-gold/10'}`}>
      <nav className='flex space-x-8 px-6' aria-label='Tabs'>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? theme === 'light'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-champagne-gold text-champagne-gold'
                  : theme === 'light'
                    ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    : 'border-transparent text-platinum-silver/60 hover:text-platinum-silver hover:border-champagne-gold/30'
              }`}
            >
              <div
                className={`mr-2 ${
                  isActive
                    ? theme === 'light'
                      ? 'text-blue-600'
                      : 'text-champagne-gold'
                    : theme === 'light'
                      ? 'text-gray-400 group-hover:text-gray-500'
                      : 'text-platinum-silver/40 group-hover:text-platinum-silver/60'
                }`}
              >
                <Icon size={20} />
              </div>
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full ${
                    theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-obsidian-black text-platinum-silver/80'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabNavigation;
