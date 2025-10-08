import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { invoiceAPI } from '../services/api';
import { Invoice } from '../types';
import './InvoiceList.css';

interface InvoiceListProps {
  isAdmin: boolean;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ isAdmin }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; invoice: Invoice | null }>({ open: false, invoice: null });
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderDialog, setReminderDialog] = useState<{ open: boolean; invoice: Invoice | null }>({ open: false, invoice: null });
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const fetchInvoices = useCallback(async (q?: string) => {
    try {
      setLoading(true);
      const response = isAdmin ? await invoiceAPI.getAllInvoices(q) : await invoiceAPI.getMyInvoices(q);
      setInvoices(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    const t = setTimeout(() => fetchInvoices(search.trim() || undefined), 300);
    return () => clearTimeout(t);
  }, [search, fetchInvoices]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentDialog(true);
  };

  const confirmPayment = async () => {
    if (!selectedInvoice) return;
    
    try {
      await invoiceAPI.markAsPaid(selectedInvoice._id!, 'Manual');
      setSuccess('Invoice marked as paid successfully');
      setShowPaymentDialog(false);
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to mark invoice as paid');
    }
  };

  const askDeleteInvoice = (invoice: Invoice) => {
    setDeleteDialog({ open: true, invoice });
  };

  const openReminderDialog = (invoice: Invoice) => {
    setReminderDialog({ open: true, invoice });
  };

  const sendManualReminder = async () => {
    if (!reminderDialog.invoice) return;
    setSendingReminder(true); setError(''); setSuccess('');
    try {
      const response = await fetch(`/api/invoices/${reminderDialog.invoice._id}/send-reminder`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Reminder sent successfully');
        setReminderDialog({ open: false, invoice: null });
      } else {
        setError(data.message || 'Failed to send reminder');
      }
    } catch (e: any) {
      setError('Failed to send reminder');
    } finally {
      setSendingReminder(false);
    }
  };

  const confirmDeleteInvoice = async () => {
    if (!deleteDialog.invoice) return;
    setDeleting(true);
    try {
      if (!deleteDialog.invoice._id) return;
      await invoiceAPI.deleteById(deleteDialog.invoice._id);
      
      setDeleteDialog({ open: false, invoice: null });
      await fetchInvoices(search.trim() || undefined);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const statusBodyTemplate = (rowData: Invoice) => {
    return (
      <Tag
        value={rowData.isPaid ? 'Paid' : 'Unpaid'}
        severity={rowData.isPaid ? 'success' : 'danger'}
        className="status-tag"
      />
    );
  };

  const paymentMethodBodyTemplate = (rowData: Invoice) => {
    if (!rowData.paymentMethod) return <span className="text-500">-</span>;
    return (
      <div className="flex align-items-center gap-2">
        <i className={`pi ${rowData.paymentMethod === 'Payoneer' ? 'pi-credit-card' : 'pi-send'}`}></i>
        <span>{rowData.paymentMethod}</span>
      </div>
    );
  };

  const actionBodyTemplate = (rowData: Invoice) => {
    const paidColor = '#22c55e'; // green
    const grayColor = '#9ca3af'; // gray
    const iconBtnClass = 'p-button-rounded p-button-text p-button-plain p-button-sm';
    
    

    return (
      <div style={{ display: 'flex', gap: 4 }}>
        <Button
          icon="pi pi-eye"
          className={iconBtnClass}
          onClick={() => {
            const base = window.location.origin + window.location.pathname;
            const url = `${base}?invoiceId=${rowData._id}`;
            window.open(url, '_blank');
          }}
          aria-label="View"
          tooltip="View"
        />
        {isAdmin && (
          <Button
            icon="pi pi-check-circle"
            className={iconBtnClass}
            onClick={() => !rowData.isPaid && handlePayInvoice(rowData)}
            aria-label={rowData.isPaid ? "Paid" : "Mark as paid"}
            tooltip={rowData.isPaid ? "Paid" : "Mark as paid"}
            style={{ color: rowData.isPaid ? paidColor : grayColor }}
          />
        )}
        {isAdmin && (
          <Button
            icon="pi pi-send"
            className={iconBtnClass}
            onClick={() => openReminderDialog(rowData)}
            aria-label="Send reminder"
            tooltip="Send reminder"
            loading={sendingReminder}
            severity="warning"
          />
        )}
        
        {isAdmin && (
          <Button
            icon="pi pi-trash"
            className={iconBtnClass}
            onClick={() => setDeleteDialog({ open: true, invoice: rowData })}
            aria-label="Delete"
            tooltip="Delete"
          />
        )}
      </div>
    );
  };

  const amountBodyTemplate = (rowData: Invoice) => {
    return (
      <div className="amount-cell">
        <span className="amount-value">{formatCurrency(rowData.amount, (rowData as any).currency || 'USD')}</span>
      </div>
    );
  };

  const dueDateBodyTemplate = (rowData: Invoice) => {
    const dueDate = new Date(rowData.dueDate);
    const today = new Date();
    const isOverdue = dueDate < today && !rowData.isPaid;
    
    return (
      <div className={`due-date ${isOverdue ? 'overdue' : ''}`}>
        <i className="pi pi-calendar"></i>
        <span>{formatDate(rowData.dueDate)}</span>
        {isOverdue && <i className="pi pi-exclamation-triangle text-red-500 ml-2"></i>}
      </div>
    );
  };

  const renderMobileCards = () => {
    if (loading) {
      return (
        <div className="mobile-cards-container">
          {[1, 2, 3].map((i) => (
            <div key={i} className="invoice-card loading">
              <div className="card-skeleton"></div>
            </div>
          ))}
        </div>
      );
    }

    if (invoices.length === 0) {
      return (
        <div className="mobile-empty-state">
          <i className="pi pi-file-o"></i>
          <h3>No invoices found</h3>
          <p>No invoices match your search criteria</p>
        </div>
      );
    }

    return (
      <div className="mobile-cards-container">
        {invoices.map((invoice) => {
          const dueDate = new Date(invoice.dueDate);
          const today = new Date();
          const isOverdue = dueDate < today && !invoice.isPaid;
          
          return (
            <Card key={invoice._id} className="invoice-card">
              <div className="card-header">
                <div className="invoice-info">
                  <h3 className="invoice-number">#{invoice.invoiceNumberStr}</h3>
                  <Tag
                    value={invoice.isPaid ? 'Paid' : 'Unpaid'}
                    severity={invoice.isPaid ? 'success' : 'danger'}
                    className="status-tag"
                  />
                </div>
                <div className="amount-display">
                  {formatCurrency(invoice.amount, (invoice as any).currency || 'USD')}
                </div>
              </div>
              
              <div className="card-body">
                <div className="client-info">
                  <div className="info-row">
                    <i className="pi pi-user"></i>
                    <span className="label">Client:</span>
                    <span className="value">{invoice.clientName}</span>
                  </div>
                  <div className="info-row">
                    <i className="pi pi-envelope"></i>
                    <span className="label">Email:</span>
                    <span className="value">{invoice.clientEmail}</span>
                  </div>
                  <div className="info-row">
                    <i className="pi pi-calendar"></i>
                    <span className="label">Due Date:</span>
                    <span className={`value ${isOverdue ? 'overdue' : ''}`}>
                      {formatDate(invoice.dueDate)}
                      {isOverdue && <i className="pi pi-exclamation-triangle ml-1"></i>}
                    </span>
                  </div>
                  {invoice.paymentMethod && (
                    <div className="info-row">
                      <i className={`pi ${invoice.paymentMethod === 'Payoneer' ? 'pi-credit-card' : 'pi-send'}`}></i>
                      <span className="label">Payment:</span>
                      <span className="value">{invoice.paymentMethod}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="card-actions">
                <Button
                  icon="pi pi-eye"
                  className="action-btn"
                  onClick={() => {
                    const base = window.location.origin + window.location.pathname;
                    const url = `${base}?invoiceId=${invoice._id}`;
                    window.open(url, '_blank');
                  }}
                  tooltip="View Invoice"
                  text
                  rounded
                />
                
                {isAdmin && (
                  <Button
                    icon={invoice.isPaid ? "pi pi-check-circle" : "pi pi-check"}
                    className="action-btn"
                    onClick={() => !invoice.isPaid && handlePayInvoice(invoice)}
                    tooltip={invoice.isPaid ? "Already Paid" : "Mark as Paid"}
                    text
                    rounded
                    disabled={invoice.isPaid}
                  />
                )}
                
                {isAdmin && (
                  <Button
                    icon="pi pi-send"
                    className="action-btn"
                    onClick={() => openReminderDialog(invoice)}
                    tooltip="Send Reminder"
                    text
                    rounded
                  />
                )}
                
                {isAdmin && (
                  <Button
                    icon="pi pi-trash"
                    className="action-btn delete-btn"
                    onClick={() => setDeleteDialog({ open: true, invoice })}
                    tooltip="Delete Invoice"
                    text
                    rounded
                  />
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="invoice-list-container">
      <div className="list-header">
        <div className="header-info">
          <h2 className="list-title">
            <i className="pi pi-file-o"></i>
            {isAdmin ? 'All invoices' : 'My invoices'}
          </h2>
          <div style={{ marginTop: 8 }}>
            <span className="p-input-icon-left" style={{ display: 'inline-flex' }}>
              <i className="pi pi-search" />
              <InputText
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by invoice ID, client name, email"
                style={{ width: 360 }}
              />
            </span>
          </div>
          <p className="list-subtitle">
            {invoices.length} total
          </p>
        </div>
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          className="refresh-button"
          onClick={() => fetchInvoices(search.trim() || undefined)}
        />
      </div>

      {error && (
        <Message severity="error" text={error} className="error-message" />
      )}

      {isMobile ? (
        renderMobileCards()
      ) : (
        <Card className="invoices-card">
          <DataTable
            value={invoices}
            loading={loading}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            emptyMessage="No invoices"
            className="invoices-table"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
          >
            <Column field="invoiceNumberStr" header="Invoice ID" className="client-column" />
            <Column field="clientName" header="Client" className="client-column" />
            <Column field="clientEmail" header="Email" className="email-column" />
            <Column field="amount" header="Amount" body={amountBodyTemplate} className="amount-column" />
            <Column field="dueDate" header="Due date" body={dueDateBodyTemplate} className="due-date-column" />
            <Column field="isPaid" header="Status" body={statusBodyTemplate} className="status-column" />
            <Column field="paymentMethod" header="Payment method" body={paymentMethodBodyTemplate} className="payment-column" />
            <Column header="Actions" body={actionBodyTemplate} className="action-column" />
          </DataTable>
        </Card>
      )}

      <Dialog
        header="Mark as paid"
        visible={showPaymentDialog}
        style={{ width: '25rem' }}
        onHide={() => setShowPaymentDialog(false)}
        className="payment-dialog"
      >
        <div className="payment-form">
          <p>Are you sure you want to mark this invoice as paid?</p>
          <div className="dialog-actions">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setShowPaymentDialog(false)}
            />
            <Button
              label="Confirm"
              onClick={confirmPayment}
            />
          </div>
        </div>
      </Dialog>

      <Dialog 
        header={`Send Payment Reminder`}
        visible={reminderDialog.open}
        onHide={() => setReminderDialog({ open: false, invoice: null })}
        style={{ width: '500px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reminderDialog.invoice && (
            <div>
              <p><strong>Invoice #:</strong> {reminderDialog.invoice.invoiceNumber}</p>
              <p><strong>Client:</strong> {reminderDialog.invoice.clientName}</p>
              <p><strong>Amount:</strong> ${reminderDialog.invoice.amount}</p>
              <p><strong>Due Date:</strong> {new Date(reminderDialog.invoice.dueDate).toLocaleDateString()}</p>
            </div>
          )}
          
          <p>Are you sure you want to send a payment reminder for this invoice?</p>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button 
              label="Cancel" 
              severity="secondary" 
              onClick={() => setReminderDialog({ open: false, invoice: null })}
              outlined 
            />
            <Button 
              label="Send Reminder" 
              icon="pi pi-send"
              onClick={sendManualReminder}
              loading={sendingReminder}
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        header={deleteDialog.invoice ? `Delete invoice` : 'Delete invoice'}
        visible={deleteDialog.open}
        style={{ width: '28rem' }}
        onHide={() => setDeleteDialog({ open: false, invoice: null })}
      >
        <p>Are you sure you want to delete this invoice?</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <Button label="Cancel" severity="secondary" onClick={() => setDeleteDialog({ open: false, invoice: null })} />
          <Button label="Delete" icon="pi pi-trash" severity="danger" loading={deleting} onClick={confirmDeleteInvoice} />
        </div>
      </Dialog>
    </div>
  );
};

export default InvoiceList;
