import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { useAuth } from './AuthContext';
import Sidebar from './Sidebar';
import InvoiceList from './InvoiceList';
import CreateInvoice from './CreateInvoice';
import CreateUser from './CreateUser';
import Profile from './Profile';
import SelfTaxCalculator from './SelfTaxCalculator';
import AdminProfiles from './AdminProfiles';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      const tablet = window.innerWidth <= 1024 && window.innerWidth > 768;
      setIsMobile(mobile);
      
      // Auto-collapse sidebar on mobile, keep user preference on tablet/desktop
      if (mobile) {
        setIsSidebarCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return <InvoiceList isAdmin={isAdmin} />;
      case 1:
        return isAdmin ? <CreateInvoice /> : null;
      case 2:
        return isAdmin ? <AdminProfiles /> : null;
      case 3:
        return isAdmin ? <CreateUser /> : null;
      case 4:
        return <Profile />;
      case 5:
        return <SelfTaxCalculator />;
      default:
        return <InvoiceList isAdmin={isAdmin} />;
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />
      
      <div className={`main-content ${isSidebarCollapsed && !isMobile ? 'sidebar-collapsed' : ''}`}>
        {/* Mobile Menu Button */}
        {isMobile && (
          <div className="mobile-header">
            <Button
              icon="pi pi-bars"
              className="mobile-menu-button"
              onClick={() => setIsMobileOpen(true)}
              text
              rounded
            />
            <h2 className="mobile-title">Uptimio</h2>
          </div>
        )}
        
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
