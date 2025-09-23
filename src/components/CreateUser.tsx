import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { userAPI } from '../services/api';
import './CreateUser.css';

const CreateUser: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  const roleOptions = [
    { label: 'User', value: 'user' },
    { label: 'Administrator', value: 'admin' },
  ];

  const validateEmail = (value: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return pattern.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEmailError('');

    if (!validateEmail(email)) {
      setEmailError('Enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const profile = { companyName, fullName: fullName || name, addressLine, city, state, postalCode, country, phone, logoUrl };
      await userAPI.createUser(name, email, password, role, profile);
      setSuccess('User created successfully. Verification email sent.');
      setName(''); setFullName(''); setEmail(''); setPassword(''); setRole('user');
      setCompanyName(''); setAddressLine(''); setCity(''); setState(''); setPostalCode(''); setCountry(''); setPhone(''); setLogoUrl('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-user">
      <div className="cu-header">
        <div className="cu-header-icon">
          <i className="pi pi-user-plus"></i>
        </div>
        <div className="cu-header-text">
          <h2>Create user</h2>
          <p>Add a new user or administrator</p>
        </div>
      </div>

      <Card className="cu-card">
        <form onSubmit={handleSubmit} className="cu-form">
          <div className="cu-grid">
            <div className="cu-col">
              <label htmlFor="name" className="cu-label">Account display name</label>
              <InputText id="name" value={name} onChange={(e) => setName(e.target.value)} className="cu-input" placeholder="e.g. John Doe" required />
            </div>

            <div className="cu-col">
              <label htmlFor="fullName" className="cu-label">Full name (on invoice)</label>
              <InputText id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="cu-input" placeholder="e.g. John Doe" />
            </div>

            <div className="cu-col">
              <label htmlFor="email" className="cu-label">Email</label>
              <InputText 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }} 
                className={`cu-input ${emailError ? 'cu-input-error' : ''}`} 
                placeholder="e.g. john@example.com" 
                required 
              />
              {emailError && <small className="cu-error-text">{emailError}</small>}
            </div>

            <div className="cu-col">
              <label htmlFor="password" className="cu-label">Password</label>
              <Password id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="cu-input" feedback={false} toggleMask placeholder="Enter password" required />
            </div>

            <div className="cu-col">
              <label htmlFor="role" className="cu-label">Role</label>
              <Dropdown id="role" value={role} options={roleOptions} onChange={(e) => setRole(e.value)} className="cu-input" placeholder="Choose role" />
            </div>

            <div className="cu-col">
              <label className="cu-label">Company</label>
              <InputText value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="cu-input" placeholder="Company name" />
            </div>

            <div className="cu-col">
              <label className="cu-label">Address</label>
              <InputText value={addressLine} onChange={(e) => setAddressLine(e.target.value)} className="cu-input" placeholder="Street, number" />
            </div>

            <div className="cu-col">
              <label className="cu-label">City</label>
              <InputText value={city} onChange={(e) => setCity(e.target.value)} className="cu-input" placeholder="City" />
            </div>

            <div className="cu-col">
              <label className="cu-label">State/Province</label>
              <InputText value={state} onChange={(e) => setState(e.target.value)} className="cu-input" placeholder="State" />
            </div>

            <div className="cu-col">
              <label className="cu-label">Postal code</label>
              <InputText value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="cu-input" placeholder="ZIP/Postal" />
            </div>

            <div className="cu-col">
              <label className="cu-label">Country</label>
              <InputText value={country} onChange={(e) => setCountry(e.target.value)} className="cu-input" placeholder="Country" />
            </div>

            <div className="cu-col">
              <label className="cu-label">Phone</label>
              <InputText value={phone} onChange={(e) => setPhone(e.target.value)} className="cu-input" placeholder="+1 ..." />
            </div>

            <div className="cu-col">
              <label className="cu-label">Logo URL</label>
              <InputText value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="cu-input" placeholder="https://..." />
            </div>
          </div>

          <div className="cu-messages">
            {error && <Message severity="error" text={error} className="cu-message" />}
            {success && <Message severity="success" text={success} className="cu-message" />}
          </div>

          <div className="cu-actions">
            <Button type="submit" label="Create user" icon="pi pi-check" className="cu-submit" loading={loading} />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateUser; 