import React from 'react';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import 'primeicons/primeicons.css';
import { Badge } from 'primereact/badge';
import { useAuth } from './AuthContext';
import logo from '../Uptimio Logo.png';
import './Sidebar.css';

interface SidebarProps {
  activeTab: number;
  onTabChange: (index: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  isCollapsed, 
  onToggleCollapse,
  isMobileOpen,
  onMobileClose
}) => {
  const { user, logout } = useAuth();

  const isAdmin = user?.role === 'admin';

  const menuItems = [
    {
      id: 0,
      label: 'Invoices',
      icon: 'pi pi-file-o',
      adminOnly: false
    },
    {
      id: 1,
      label: 'Create Invoice',
      icon: 'pi pi-plus',
      adminOnly: true
    },
    {
      id: 2,
      label: 'Profiles',
      icon: 'pi pi-users',
      adminOnly: true
    },
    {
      id: 3,
      label: 'Create User',
      icon: 'pi pi-user-plus',
      adminOnly: true
    },
    {
      id: 4,
      label: 'Profile',
      icon: 'pi pi-briefcase',
      adminOnly: false
    },
    {
      id: 5,
      label: 'Samooporezivanje',
      icon: 'pi pi-percentage',
      adminOnly: false
    }
  ];

  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  const handleTabChange = (index: number) => {
    onTabChange(index);
    // Close mobile sidebar when item is selected
    if (window.innerWidth <= 768) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={onMobileClose} />
      )}
      
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo-section">
            <img src={logo} alt="Uptimio" className="app-logo" />
          </div>
          <div className="header-buttons">
            <Button
              icon={isCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'}
              className="collapse-button"
              onClick={onToggleCollapse}
              text
              rounded
            />
            {/* Mobile Close Button */}
            <Button
              icon="pi pi-times"
              className="mobile-close-button"
              onClick={onMobileClose}
              text
              rounded
              aria-label="Close sidebar"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {filteredMenuItems.map((item) => (
            <Button
              key={item.id}
              label={!isCollapsed ? item.label : ''}
              icon={item.icon}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleTabChange(item.id)}
              text
              data-tooltip={isCollapsed ? item.label : ''}
            />
          ))}
        </nav>

        {/* User Info */}
        <div className="sidebar-footer">
          <div className="user-info">
            <Avatar 
              icon="pi pi-user" 
              className="user-avatar"
              size="large"
            />
            {!isCollapsed && (
              <div className="user-details">
                <span className="user-name">{user?.name}</span>
                <Badge 
                  value={user?.role === 'admin' ? 'Admin' : 'User'} 
                  severity={user?.role === 'admin' ? 'info' : 'success'}
                  className="role-badge"
                />
              </div>
            )}
          </div>
          <Button
            label={!isCollapsed ? 'Sign out' : ''}
            icon="pi pi-sign-out"
            className="logout-button"
            onClick={logout}
            text
            data-tooltip={isCollapsed ? 'Sign out' : ''}
          />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
