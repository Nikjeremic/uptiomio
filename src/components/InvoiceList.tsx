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
  const [paymentMethod, setPaymentMethod] = useState('');
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; invoice: Invoice | null }>({ open: false, invoice: null });
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const paymentMethods = [
    { label: 'Payoneer', value: 'Payoneer' },
    { label: 'Western Union', value: 'Western Union' },
    { label: 'Zelle', value: 'Zelle' },
    { label: 'Credit Card', value: 'Credit Card' },
    { label: 'Authorize.net', value: 'Authorize.net' },
    { label: 'Paypal', value: 'Paypal' }
  ];

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

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentMethod('');
    setShowPaymentDialog(true);
  };

  const confirmPayment = async () => {
    if (!selectedInvoice || !paymentMethod) return;

    try {
      await invoiceAPI.markAsPaid(selectedInvoice._id, paymentMethod);
      setShowPaymentDialog(false);
      fetchInvoices(search.trim() || undefined);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to mark as paid');
    }
  };

  const askDeleteInvoice = (invoice: Invoice) => {
    setDeleteDialog({ open: true, invoice });
  };

  const confirmDeleteInvoice = async () => {
    if (!deleteDialog.invoice) return;
    setDeleting(true);
    try {
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
      <div className="payment-method">
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
        <Button
          icon="pi pi-check-circle"
          className={iconBtnClass}
          onClick={() => !rowData.isPaid && handlePayInvoice(rowData)}
          aria-label={rowData.isPaid ? 'Paid' : 'Mark as paid'}
          tooltip={rowData.isPaid ? 'Paid' : 'Mark as paid'}
          style={{ color: rowData.isPaid ? paidColor : grayColor }}
        />
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

      <Dialog
        header="Mark as paid"
        visible={showPaymentDialog}
        style={{ width: '25rem' }}
        onHide={() => setShowPaymentDialog(false)}
        className="payment-dialog"
      >
        <div className="payment-form">
          <div className="field">
            <label htmlFor="paymentMethod" className="field-label">Payment method</label>
            <Dropdown
              id="paymentMethod"
              value={paymentMethod}
              options={paymentMethods}
              onChange={(e) => setPaymentMethod(e.value)}
              className="field-input"
              placeholder="Choose method"
            />
          </div>
          <div className="dialog-actions">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setShowPaymentDialog(false)}
            />
            <Button
              label="Confirm"
              onClick={confirmPayment}
              disabled={!paymentMethod}
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
