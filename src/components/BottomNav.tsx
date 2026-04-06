import React from 'react';
import classNames from 'classnames';
import { Home, Coffee, Heart, Book, AlarmClock, User } from 'lucide-react';
import './BottomNav.css';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showSupportTab?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, showSupportTab = true }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'meals', icon: Coffee, label: 'Meals' },
    { id: 'wellness', icon: Heart, label: 'Wellness' },
    { id: 'notes', icon: Book, label: 'Notes' },
    { id: 'study', icon: AlarmClock, label: 'Study' },
  ];

  if (showSupportTab) {
    tabs.push({ id: 'you', icon: User, label: 'You' });
  }

  return (
    <div className="bottom-nav-container">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            className={classNames('nav-item', { active: isActive })}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            <div className="nav-icon-wrapper">
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="nav-label">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
