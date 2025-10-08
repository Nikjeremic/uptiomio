import React, { useEffect, useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { invoiceAPI } from '../services/api';
import { Invoice } from '../types';
import { useAuth } from './AuthContext';
import UptimioLogo from '../Uptimio Logo.png';
import SignatureImg from '../Jeremic Nikola Signature.png';

function useQuery() {
  return useMemo(() => new URLSearchParams(window.location.search), []);
}

const a4Styles: React.CSSProperties = {
  width: '210mm',
  minHeight: '297mm',
  margin: '0 auto',
  background: '#fff',
  padding: '16mm',
  boxSizing: 'border-box',
  position: 'relative'
};

const InvoiceView: React.FC = () => {
  const query = useQuery();
  const invoiceId = query.get('invoiceId');
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      if (!invoiceId) { setError('Missing invoiceId'); return; }
      setLoading(true);
      try {
        const { data } = await invoiceAPI.getById(invoiceId);
        setInvoice(data);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    })();
  }, [invoiceId]);

  // During print, blank the document title to avoid it in header (if headers are enabled)
  useEffect(() => {
    const prevTitle = document.title;
    const before = () => { document.title = ' '; };
    const after = () => { document.title = prevTitle; };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
      document.title = prevTitle;
    };
  }, []);

  const total = invoice?.amount || 0;
  const isAdmin = user?.role === 'admin';

  return (
    <div className="invoice-view" style={{ padding: 24 }}>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .no-print { display: none !important; }
          .invoice-view { padding: 0 !important; }
          .p-card { border: 0 !important; box-shadow: none !important; }
          .p-card .p-card-body { padding: 0 !important; }
          .invoice-paper { box-shadow: none !important; height: auto !important; min-height: 297mm !important; margin-top: 0 !important; padding: 12mm 16mm 32mm 16mm !important; overflow: visible !important; border: 0 !important; }
        }
        .invoice-table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .invoice-table thead th { background: #f9fafb; color: #111827; font-weight: 600; font-size: 12.5px; padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
        .invoice-table tbody td { padding: 10px 12px; vertical-align: top; font-size: 12.5px; }
        .invoice-table tbody tr:nth-child(even) { background: #fcfcfd; }
        .invoice-table tfoot td { padding: 12px; background: #fafafa; font-size: 13px; border-top: 1px solid #e5e7eb; }
        .col-desc { width: 55%; }
        .col-qty { width: 10%; text-align: right; }
        .col-unit { width: 15%; text-align: right; }
        .col-amount { width: 20%; text-align: right; font-weight: 600; }
        .payment-info { margin-top: 12px; padding: 12px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; }
        .payment-info h4 { margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #374151; }
        .payment-details { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .payment-item { display: flex; flex-direction: column; }
        .payment-label { font-size: 11px; font-weight: 600; color: #6b7280; margin-bottom: 2px; }
        .payment-value { font-size: 12px; font-weight: 500; color: #111827; word-break: break-all; }
        @media (max-width: 768px) {
          .payment-details { grid-template-columns: 1fr; gap: 8px; }
        }
      `}</style>
      <Card>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Invoice</h2>
          <Button label="Print / Save PDF" icon="pi pi-print" onClick={() => window.print()} />
        </div>
        {loading && <p>Loading...</p>}
        {error && <Message severity="error" text={error} />}
        {invoice && (
          <div className="invoice-paper" style={{ marginTop: 16, ...a4Styles }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                {/* Uptimio logo above issuer name */}
                <img src={UptimioLogo} alt="Uptimio" style={{ height: 36, marginBottom: 6 }} />
                {invoice.issuerLogoUrl && <img src={invoice.issuerLogoUrl} alt="issuer logo" style={{ height: 36, marginBottom: 6, marginLeft: 8 }} />}
                {/* Invoice number - bold and above issuer name */}
                {invoice.invoiceNumberStr && <div style={{ color: '#6b7280', fontWeight: 700, marginBottom: 4 }}>{invoice.invoiceNumberStr}</div>}
                <div style={{ marginTop: 4, fontWeight: 600 }}>{invoice.issuerName}</div>
                {/* Removed issuerCompany from header by request */}
                {invoice.issuerAddress && <div>{invoice.issuerAddress}</div>}
                {/* Fixed contact info */}
                <div>+38162460696</div>
                <div>invoices@uptimio.com</div>
              </div>
              <div style={{ textAlign: 'right', marginTop: '24px' }}>
                <div style={{ fontWeight: 600 }}>Bill to</div>
                <div style={{ fontWeight: 700 }}>{invoice.clientName}</div>
                <div>{invoice.clientEmail}</div>
                {invoice.clientCompany && <div style={{ fontWeight: 600 }}>{invoice.clientCompany}</div>}
                {invoice.clientAddress && <div>{invoice.clientAddress}</div>}
                {invoice.clientCountry && <div>{invoice.clientCountry}</div>}
                {invoice.clientPhone && <div>{invoice.clientPhone}</div>}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th className="col-desc" style={{ textAlign: 'left' }}>Description</th>
                    <th className="col-qty">Qty/Hrs</th>
                    <th className="col-unit">Unit price</th>
                    <th className="col-amount">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="col-desc">
                        <div style={{ whiteSpace: 'pre-wrap' }}>{it.description}</div>
                      </td>
                      <td className="col-qty">{it.quantity}</td>
                      <td className="col-unit">{(it.unitPrice).toLocaleString('en-US', { style: 'currency', currency: invoice.currency })}</td>
                      <td className="col-amount">{(it.quantity * it.unitPrice).toLocaleString('en-US', { style: 'currency', currency: invoice.currency })}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right' }}>Total</td>
                    <td className="col-amount">{total.toLocaleString('en-US', { style: 'currency', currency: invoice.currency })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Due date - moved above payment method */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 600 }}>Due date: <span style={{ fontWeight: 700 }}>{new Date(invoice.dueDate).toLocaleDateString('en-US')}</span></div>
            </div>

            {/* Payment Information - ONLY FOR ADMIN USERS */}
            {isAdmin && ((invoice as any).issuerSwiftCode || (invoice as any).issuerIban || (invoice as any).issuerCardNumber) && (
              <div className="payment-info">
                <h4>Payment Information</h4>
                <div className="payment-details">
                  {(invoice as any).issuerSwiftCode && (
                    <div className="payment-item">
                      <div className="payment-label">SWIFT Code</div>
                      <div className="payment-value">{(invoice as any).issuerSwiftCode}</div>
                    </div>
                  )}
                  {(invoice as any).issuerIban && (
                    <div className="payment-item">
                      <div className="payment-label">IBAN</div>
                      <div className="payment-value">{(invoice as any).issuerIban}</div>
                    </div>
                  )}
                  {(invoice as any).issuerCardNumber && (
                    <div className="payment-item">
                      <div className="payment-label">Card Number</div>
                      <div className="payment-value">{(invoice as any).issuerCardNumber}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment method - inline format */}
            {(invoice as any).paymentMethod && (
              <div style={{ marginTop: 8 }}>
                <span style={{ fontWeight: 600 }}>Payment method: </span>
                <span>{(invoice as any).paymentMethod}</span>
              </div>
            )}

            {invoice.notes && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600 }}>Notes</div>
                <div>{invoice.notes}</div>
              </div>
            )}

            {/* Hard-coded signature at bottom of A4 */}
            <div style={{ position: 'absolute', left: '16mm', right: '16mm', bottom: '16mm' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
                {/* Left: your signature image with line underneath */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <img src={SignatureImg} alt="signature" style={{ height: 56 }} />
                  <div style={{ width: '70mm', borderBottom: '1px solid #374151', marginTop: 8 }} />
                </div>
                {/* Right: empty line for other party */}
                <div style={{ width: '70mm', borderBottom: '1px solid #374151' }} />
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default InvoiceView;
