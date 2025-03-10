import React, { createContext, useContext, Fragment } from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabsContextType {
  selectedIndex: number;
  onChange: (index: number) => void;
}

const TabsContext = createContext<TabsContextType>({
  selectedIndex: 0,
  onChange: () => {},
});

interface TabGroupProps {
  selectedIndex: number;
  onChange: (index: number) => void;
  children: React.ReactNode;
  className?: string;
}

export function TabGroup({ selectedIndex, onChange, children, className = '' }: TabGroupProps) {
  return (
    <TabsContext.Provider value={{ selectedIndex, onChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabList({ children, className = '' }: TabListProps) {
  return (
    <div className={`flex ${className}`}>
      {children}
    </div>
  );
}

interface TabProps {
  children: React.ReactNode;
  className?: string | ((props: { selected: boolean }) => string);
  index?: number;
}

export function Tab({ children, className = '', index = 0 }: TabProps) {
  const { selectedIndex, onChange } = useContext(TabsContext);
  const isSelected = selectedIndex === index;

  const classes = typeof className === 'function' 
    ? className({ selected: isSelected })
    : className;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      className={classes}
      onClick={() => onChange(index)}
    >
      {children}
    </button>
  );
}

interface TabPanelsProps {
  children: React.ReactNode;
  className?: string;
}

export function TabPanels({ children, className = '' }: TabPanelsProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface TabPanelProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

export function TabPanel({ children, className = '', index = 0 }: TabPanelProps) {
  const { selectedIndex } = useContext(TabsContext);
  const isSelected = selectedIndex === index;

  if (!isSelected) return null;

  return (
    <div
      role="tabpanel"
      className={className}
    >
      {children}
    </div>
  );
}

// For backward compatibility
interface LegacyTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  className = '',
}: LegacyTabsProps) {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex space-x-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`
              py-2 px-3 border-b-2 text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
} 