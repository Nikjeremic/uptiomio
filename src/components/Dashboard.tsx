import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Badge } from 'primereact/badge';
import { useAuth } from './AuthContext';
import InvoiceList from './InvoiceList';
import CreateInvoice from './CreateInvoice';
import CreateUser from './CreateUser';
import Profile from './Profile';
import AdminProfiles from './AdminProfiles';
import './Dashboard.css';
import logo from '../Uptimio Logo.png';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-section">
              <img src={logo} alt="Uptimio" className="app-logo" />
            </div>
          </div>
          
          <div className="header-right">
            <div className="user-info">
              <Avatar 
                icon="pi pi-user" 
                className="user-avatar"
                size="large"
              />
              <div className="user-details">
                <span className="user-name">{user?.name}</span>
                <Badge 
                  value={user?.role === 'admin' ? 'Administrator' : 'User'} 
                  severity={user?.role === 'admin' ? 'info' : 'success'}
                  className="role-badge"
                />
              </div>
            </div>
            <Button
              label="Sign out"
              icon="pi pi-sign-out"
              severity="secondary"
              className="logout-button"
              onClick={logout}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="content-wrapper">
          <TabView 
            activeIndex={activeIndex} 
            onTabChange={(e) => setActiveIndex(e.index)}
            className="main-tabs"
          >
            <TabPanel 
              header={
                <div className="tab-header">
                  <i className="pi pi-file-o"></i>
                  <span>Invoices</span>
                </div>
              }
            >
              <InvoiceList isAdmin={isAdmin} />
            </TabPanel>
            
            {isAdmin && (
              <TabPanel 
                header={
                  <div className="tab-header">
                    <i className="pi pi-plus"></i>
                    <span>Create invoice</span>
                  </div>
                }
              >
                <CreateInvoice />
              </TabPanel>
            )}

            {isAdmin && (
              <TabPanel 
                header={
                  <div className="tab-header">
                    <i className="pi pi-users"></i>
                    <span>Profiles</span>
                  </div>
                }
              >
                <AdminProfiles />
              </TabPanel>
            )}

            {isAdmin && (
              <TabPanel 
                header={
                  <div className="tab-header">
                    <i className="pi pi-user-plus"></i>
                    <span>Create user</span>
                  </div>
                }
              >
                <CreateUser />
              </TabPanel>
            )}

            <TabPanel 
              header={
                <div className="tab-header">
                  <i className="pi pi-briefcase"></i>
                  <span>Profile</span>
                </div>
              }
            >
              <Profile />
            </TabPanel>
          </TabView>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
