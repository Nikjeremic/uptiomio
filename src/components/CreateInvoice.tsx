import React, { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { invoiceAPI, profileAPI, userAPI } from '../services/api';
import './CreateInvoice.css';

interface ItemRow { description: string; quantity: number | null; unitPrice: number | null; }

interface UserOption { label: string; value: string; email: string; }

const CreateInvoice: React.FC = () => {
  const [clientUserId, setClientUserId] = useState<string | null>(null);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCountry, setClientCountry] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [items, setItems] = useState<ItemRow[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await userAPI.getAllUsers();
        const opts = data.map((u: any) => ({ label: `${u.name} (${u.email})`, value: u._id || u.id, email: u.email }));
        setUserOptions(opts);
      } catch (e) {
        // ignore silently
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!clientUserId) return;
      try {
        const { data } = await profileAPI.getByUserId(clientUserId);
        setClientName(data.fullName || '');
        setClientEmail(userOptions.find((o) => o.value === clientUserId)?.email || '');
        setClientCompany(data.companyName || '');
        setClientAddress(data.addressLine || '');
        setClientCountry(data.country || '');
        setClientPhone(data.phone || '');
      } catch (e) {
        // if missing profile, keep manual entry
      }
    })();
  }, [clientUserId, userOptions]);

  const paymentMethods = [
    { label: 'Payoneer', value: 'Payoneer' },
    { label: 'Western Union', value: 'Western Union' },
    { label: 'Zelle', value: 'Zelle' },
    { label: 'Credit Card', value: 'Credit Card' },
    { label: 'Authorize.net', value: 'Authorize.net' },
    { label: 'Paypal', value: 'Paypal' }
  ];

  const addItem = () => setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const setItem = (idx: number, key: keyof ItemRow, value: any) => setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [key]: value } : it));

  const total = items.reduce((sum, it) => sum + ((it.quantity || 0) * (it.unitPrice || 0)), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let reminderHour: number | undefined = undefined;
      let reminderMinute: number | undefined = undefined;
      if (reminderEnabled && reminderTime instanceof Date) {
        reminderHour = reminderTime.getHours();
        reminderMinute = reminderTime.getMinutes();
      }

      await invoiceAPI.createInvoice({
        clientName,
        clientEmail,
        clientCompany,
        clientAddress,
        clientCountry,
        clientPhone,
        items: items.map(i => ({ description: i.description, quantity: i.quantity || 0, unitPrice: i.unitPrice || 0 })),
        currency: 'USD',
        notes,
        description,
        dueDate,
        paymentMethod,
        reminderEnabled,
        reminderIntervalDays: reminderEnabled ? 1 : 7,
        ...(reminderHour !== undefined && reminderMinute !== undefined ? { reminderHour, reminderMinute } : {})
      });

      setSuccess('Invoice created successfully.');
      // Reset form
      setClientUserId(null);
      setClientName('');
      setClientEmail('');
      setClientCompany('');
      setClientAddress('');
      setClientCountry('');
      setClientPhone('');
      setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
      setNotes('');
      setDescription('');
      setDueDate(null);
      setPaymentMethod('');
      setReminderEnabled(false);
      setReminderTime(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-invoice-container">
      <Card className="create-invoice-card">
        <div className="card-header">
          <div className="header-icon">
            <i className="pi pi-plus-circle"></i>
          </div>
          <div className="header-text">
            <h2 className="card-title">Create new invoice</h2>
            <p className="card-subtitle">Add line items for delivered services</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="invoice-form">
          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">Client (existing user)</label>
              <Dropdown value={clientUserId} options={userOptions} onChange={(e) => setClientUserId(e.value)} placeholder="Select client (optional)" filter className="form-input" />
            </div>

            <div className="form-group">
              <label htmlFor="clientName" className="form-label">
                <i className="pi pi-user"></i>
                Client name
              </label>
              <InputText
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="form-input"
                placeholder="Enter client full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="clientEmail" className="form-label">
                <i className="pi pi-envelope"></i>
                Client email
              </label>
              <InputText
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="form-input"
                placeholder="Enter client email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Client company</label>
              <InputText value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} className="form-input" placeholder="Optional" />
            </div>

            <div className="form-group">
              <label className="form-label">Client address</label>
              <InputText value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className="form-input" placeholder="Optional" />
            </div>

            <div className="form-group">
              <label className="form-label">Client country</label>
              <InputText value={clientCountry} onChange={(e) => setClientCountry(e.target.value)} className="form-input" placeholder="Optional" />
            </div>

            <div className="form-group">
              <label className="form-label">Client phone</label>
              <InputText value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="form-input" placeholder="Optional" />
            </div>

            <div className="form-group">
              <label htmlFor="dueDate" className="form-label">
                <i className="pi pi-calendar"></i>
                Due date
              </label>
              <Calendar
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.value as Date)}
                className="form-input"
                placeholder="Select date"
                required
                showIcon
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Items (services)</label>
              <div className="items-list">
                {items.map((it, idx) => (
                  <div className="item-row" key={idx}>
                    <InputText placeholder="Description" value={it.description} onChange={(e) => setItem(idx, 'description', e.target.value)} className="item-input" />
                    <InputNumber placeholder="Qty" value={it.quantity} onValueChange={(e) => setItem(idx, 'quantity', e.value ?? 0)} className="item-input" min={0} />
                    <InputNumber placeholder="Unit price" value={it.unitPrice} onValueChange={(e) => setItem(idx, 'unitPrice', e.value ?? 0)} className="item-input" mode="currency" currency="USD" locale="en-US" min={0} />
                    <Button type="button" icon="pi pi-trash" severity="danger" outlined onClick={() => removeItem(idx)} disabled={items.length === 1} />
                  </div>
                ))}
                <div>
                  <Button type="button" icon="pi pi-plus" label="Add item" onClick={addItem} outlined />
                </div>
              </div>
            </div>

            <div className="form-group full-width">
              <label className="form-label">Invoice description (optional)</label>
              <InputTextarea value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} className="form-input" placeholder="Summary or reference" rows={3} />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Notes (optional)</label>
              <InputTextarea value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} className="form-input" placeholder="Payment notes, bank details, etc." rows={3} />
            </div>

            <div className="form-group full-width">
              <label htmlFor="paymentMethod" className="form-label">
                <i className="pi pi-credit-card"></i>
                Suggested payment method
              </label>
              <Dropdown
                id="paymentMethod"
                value={paymentMethod}
                options={paymentMethods}
                onChange={(e) => setPaymentMethod(e.value)}
                className="form-input"
                placeholder="Optional"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Enable daily reminders</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <InputSwitch checked={reminderEnabled} onChange={(e) => setReminderEnabled(!!e.value)} />
                <span style={{ color: '#6b7280' }}>Send every day at</span>
                <Calendar value={reminderTime} onChange={(e) => setReminderTime(e.value as Date)} timeOnly hourFormat="24" showIcon disabled={!reminderEnabled} />
              </div>
            </div>
          </div>

          {error && (
            <Message severity="error" text={error} className="form-message" />
          )}

          {success && (
            <Message severity="success" text={success} className="form-message" />
          )}

          <div className="form-actions" style={{ justifyContent: 'space-between' }}>
            <div className="total">Total: {total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
            <Button
              type="submit"
              label="Create invoice"
              icon="pi pi-plus"
              className="submit-button"
              loading={loading}
              size="large"
            />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateInvoice;
