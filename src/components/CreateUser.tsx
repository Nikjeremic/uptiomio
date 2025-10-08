import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { userAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CreateUser: React.FC = () => {
  const { user } = useAuth();
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
  const [swiftCode, setSwiftCode] = useState('');
  const [iban, setIban] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  const isAdmin = user?.role === 'admin';

  const roleOptions = [
    { label: 'User', value: 'user' },
    { label: 'Administrator', value: 'admin' },
  ];

  const validateEmail = (value: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return pattern.test(value);
  };

  const handleChange = (key: string, value: string) => {
    setError('');
    setSuccess('');
    if (key === 'email' && emailError) setEmailError('');
    
    switch (key) {
      case 'name': setName(value); break;
      case 'email': setEmail(value); break;
      case 'password': setPassword(value); break;
      case 'role': setRole(value as 'user' | 'admin'); break;
      case 'companyName': setCompanyName(value); break;
      case 'fullName': setFullName(value); break;
      case 'addressLine': setAddressLine(value); break;
      case 'city': setCity(value); break;
      case 'state': setState(value); break;
      case 'postalCode': setPostalCode(value); break;
      case 'country': setCountry(value); break;
      case 'phone': setPhone(value); break;
      case 'logoUrl': setLogoUrl(value); break;
      case 'swiftCode': setSwiftCode(value); break;
      case 'iban': setIban(value); break;
      case 'cardNumber': setCardNumber(value); break;
    }
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
      const profile = { 
        companyName, 
        fullName: fullName || name, 
        addressLine, 
        city, 
        state, 
        postalCode, 
        country, 
        phone, 
        logoUrl,
        // Only include payment info if current user is admin
        ...(isAdmin && {
          swiftCode,
          iban,
          cardNumber
        })
      };
      await userAPI.createUser(name, email, password, role, profile);
      setSuccess('User created successfully. Verification email sent.');
      
      // Reset form
      setName(''); setFullName(''); setEmail(''); setPassword(''); setRole('user');
      setCompanyName(''); setAddressLine(''); setCity(''); setState(''); 
      setPostalCode(''); setCountry(''); setPhone(''); setLogoUrl('');
      if (isAdmin) {
        setSwiftCode(''); setIban(''); setCardNumber('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card title="Create New User">
        {error && <Message severity="error" text={error} style={{ marginBottom: '20px' }} />}
        {success && <Message severity="success" text={success} style={{ marginBottom: '20px' }} />}

        <form onSubmit={handleSubmit}>
          {/* Basic User Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label>Account Display Name</label>
              <InputText
                value={name}
                onChange={(e) => handleChange('name', e.target.value)}
                style={{ width: '100%' }}
                placeholder="e.g. John Doe"
                required
              />
            </div>
            <div>
              <label>Full Name (on invoice)</label>
              <InputText
                value={fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                style={{ width: '100%' }}
                placeholder="e.g. John Doe"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label>Email</label>
              <InputText
                type="email"
                value={email}
                onChange={(e) => handleChange('email', e.target.value)}
                style={{ width: '100%' }}
                placeholder="e.g. john@example.com"
                required
              />
              {emailError && <small style={{ color: 'red', fontSize: '12px' }}>{emailError}</small>}
            </div>
            <div>
              <label>Password</label>
              <Password
                value={password}
                onChange={(e) => handleChange('password', e.target.value)}
                style={{ width: '100%' }}
                feedback={false}
                toggleMask
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Role</label>
            <Dropdown
              value={role}
              options={roleOptions}
              onChange={(e) => handleChange('role', e.value)}
              style={{ width: '100%' }}
              placeholder="Choose role"
            />
          </div>

          {/* Company Information */}
          <div style={{ marginBottom: '20px' }}>
            <label>Company Name</label>
            <InputText
              value={companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              style={{ width: '100%' }}
              placeholder="Company name"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Address Line</label>
            <InputText
              value={addressLine}
              onChange={(e) => handleChange('addressLine', e.target.value)}
              style={{ width: '100%' }}
              placeholder="Street, number"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label>City</label>
              <InputText
                value={city}
                onChange={(e) => handleChange('city', e.target.value)}
                style={{ width: '100%' }}
                placeholder="City"
              />
            </div>
            <div>
              <label>State</label>
              <InputText
                value={state}
                onChange={(e) => handleChange('state', e.target.value)}
                style={{ width: '100%' }}
                placeholder="State"
              />
            </div>
            <div>
              <label>Postal Code</label>
              <InputText
                value={postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                style={{ width: '100%' }}
                placeholder="ZIP/Postal"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label>Country</label>
              <InputText
                value={country}
                onChange={(e) => handleChange('country', e.target.value)}
                style={{ width: '100%' }}
                placeholder="Country"
              />
            </div>
            <div>
              <label>Phone</label>
              <InputText
                value={phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                style={{ width: '100%' }}
                placeholder="+1 ..."
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Logo URL</label>
            <InputText
              value={logoUrl}
              onChange={(e) => handleChange('logoUrl', e.target.value)}
              style={{ width: '100%' }}
              placeholder="https://..."
            />
          </div>

          {/* Payment Information - ONLY FOR ADMIN USERS */}
          {isAdmin && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label>Swift Code</label>
                <InputText
                  value={swiftCode}
                  onChange={(e) => handleChange('swiftCode', e.target.value)}
                  style={{ width: '100%' }}
                  placeholder="SWIFT code for international transfers"
                />
              </div>
              <div>
                <label>IBAN</label>
                <InputText
                  value={iban}
                  onChange={(e) => handleChange('iban', e.target.value)}
                  style={{ width: '100%' }}
                  placeholder="International Bank Account Number"
                />
              </div>
              <div>
                <label>Card Number</label>
                <InputText
                  value={cardNumber}
                  onChange={(e) => handleChange('cardNumber', e.target.value)}
                  style={{ width: '100%' }}
                  placeholder="Card number for payments"
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              label="Create User" 
              icon="pi pi-user-plus"
              loading={loading} 
              onClick={handleSubmit}
            />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateUser;
