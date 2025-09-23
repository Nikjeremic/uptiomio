import React from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import InvoiceView from './components/InvoiceView';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './App.css';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const invoiceId = params.get('invoiceId');
  if (invoiceId && user) {
    return <InvoiceView />;
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner">
            <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
          </div>
          <h3 className="loading-text">Loading</h3>
          <p className="loading-subtitle">Please wait</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return <Login />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
