import React, { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { profileAPI } from '../services/api';

// Define a strong type for the profile document we edit
type UserProfile = {
  userId?: string;
  companyName: string;
  fullName: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  logoUrl?: string;
  signatureUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  _id?: string;
};

const defaultProfile: UserProfile = {
  companyName: '',
  fullName: '',
  addressLine: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  phone: '',
  logoUrl: '',
  signatureUrl: ''
};

const Profile: React.FC = () => {
  const [form, setForm] = useState<UserProfile>(defaultProfile);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await profileAPI.get();
        setForm({ ...defaultProfile, ...(res.data || {}) });
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load profile');
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  const set = (key: keyof UserProfile, value: any) => {
    setError('');
    setSuccess('');
    setForm((f) => ({ ...f, [key]: value } as UserProfile));
  };

  const buildUpdatePayload = (src: UserProfile) => {
    // Only send editable fields; backend will upsert and set updatedAt
    return {
      companyName: src.companyName || '',
      fullName: src.fullName || '',
      addressLine: src.addressLine || '',
      city: src.city || '',
      state: src.state || '',
      postalCode: src.postalCode || '',
      country: src.country || '',
      phone: src.phone || '',
      logoUrl: src.logoUrl || '',
      signatureUrl: src.signatureUrl || ''
    };
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const payload = buildUpdatePayload(form);
      const { data } = await profileAPI.update(payload);
      setForm({ ...defaultProfile, ...(data || {}) });
      setSuccess('Profile saved successfully.');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const onUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true); setError(''); setSuccess('');
    try {
      const { data } = await profileAPI.uploadLogo(file);
      setForm((f) => ({ ...(f || defaultProfile), logoUrl: data.url }));
      setSuccess('Logo uploaded.');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const onUploadSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSignature(true); setError(''); setSuccess('');
    try {
      const { data } = await profileAPI.uploadSignature(file);
      setForm((f) => ({ ...(f || defaultProfile), signatureUrl: data.url }));
      setSuccess('Signature uploaded.');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to upload signature');
    } finally {
      setUploadingSignature(false);
      e.target.value = '';
    }
  };

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {form.logoUrl ? (
          <img src={form.logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span className="pi pi-building" style={{ color: '#9ca3af' }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600 }}>{form.companyName || 'Business Profile'}</div>
        <div style={{ color: '#6b7280', fontSize: 12 }}>{form.fullName || 'Set your details below'}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <label className="p-button p-component" style={{ cursor: uploadingLogo ? 'not-allowed' : 'pointer', padding: '0.5rem 0.75rem' }}>
          <span className="pi pi-upload" style={{ marginRight: 8 }} /> Upload logo
          <input type="file" accept="image/*" onChange={onUploadLogo} disabled={initialLoading || uploadingLogo || loading} style={{ display: 'none' }} />
        </label>
        <label className="p-button p-component p-button-outlined" style={{ cursor: uploadingSignature ? 'not-allowed' : 'pointer', padding: '0.5rem 0.75rem' }}>
          <span className="pi pi-pencil" style={{ marginRight: 8 }} /> Upload signature
          <input type="file" accept="image/*" onChange={onUploadSignature} disabled={initialLoading || uploadingSignature || loading} style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  );

  return (
    <div className="profile-container">
      <Card header={header}>
        <p style={{ marginTop: 0, color: '#6b7280' }}>These details will appear on your invoices (currency: USD).</p>
        <form onSubmit={onSave} className="profile-form">
          <div className="p-fluid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Full name</label>
              <InputText disabled={initialLoading || loading} value={form.fullName || ''} onChange={(e) => set('fullName', e.target.value)} />
            </div>
            <div className="field">
              <label>Company name</label>
              <InputText disabled={initialLoading || loading} value={form.companyName || ''} onChange={(e) => set('companyName', e.target.value)} />
            </div>
            <div className="field" style={{ gridColumn: '1 / span 2' }}>
              <label>Address</label>
              <InputText disabled={initialLoading || loading} value={form.addressLine || ''} onChange={(e) => set('addressLine', e.target.value)} />
            </div>
            <div className="field">
              <label>City</label>
              <InputText disabled={initialLoading || loading} value={form.city || ''} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="field">
              <label>State/Province</label>
              <InputText disabled={initialLoading || loading} value={form.state || ''} onChange={(e) => set('state', e.target.value)} />
            </div>
            <div className="field">
              <label>Postal code</label>
              <InputText disabled={initialLoading || loading} value={form.postalCode || ''} onChange={(e) => set('postalCode', e.target.value)} />
            </div>
            <div className="field">
              <label>Country</label>
              <InputText disabled={initialLoading || loading} value={form.country || ''} onChange={(e) => set('country', e.target.value)} />
            </div>
            <div className="field">
              <label>Phone</label>
              <InputText disabled={initialLoading || loading} value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
            </div>
            {form.signatureUrl && (
              <div className="field" style={{ gridColumn: '1 / span 2' }}>
                <label>Signature preview</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={form.signatureUrl} alt="signature" style={{ height: 48 }} />
            </div>
              </div>
            )}
          </div>

          {error && <Message severity="error" text={error} />}
          {success && <Message severity="success" text={success} />}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button type="submit" label="Save profile" loading={loading || initialLoading} disabled={loading || initialLoading} />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Profile; 