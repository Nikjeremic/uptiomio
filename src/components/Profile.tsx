import React, { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Dialog } from 'primereact/dialog';
import { Password } from 'primereact/password';
import { profileAPI } from '../services/api';
import './Profile.css';

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
  swiftCode?: string;
  iban?: string;
  cardNumber?: string;
  // New payment instruction fields
  bankName?: string;
  // Correspondent banks (up to 5)
  correspondentBank1?: string;
  correspondentBank2?: string;
  correspondentBank3?: string;
  correspondentBank4?: string;
  correspondentBank5?: string;
  correspondentCountry1?: string;
  correspondentCountry2?: string;
  correspondentCountry3?: string;
  correspondentCountry4?: string;
  correspondentCountry5?: string;
  correspondentSwift1?: string;
  correspondentSwift2?: string;
  correspondentSwift3?: string;
  correspondentSwift4?: string;
  correspondentSwift5?: string;
  paymentInstructions?: string;
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
  signatureUrl: '',
  swiftCode: '',
  iban: '',
  cardNumber: '',
  // New payment instruction fields
  bankName: '',
  // Correspondent banks (up to 5)
  correspondentBank1: '',
  correspondentBank2: '',
  correspondentBank3: '',
  correspondentBank4: '',
  correspondentBank5: '',
  correspondentCountry1: '',
  correspondentCountry2: '',
  correspondentCountry3: '',
  correspondentCountry4: '',
  correspondentCountry5: '',
  correspondentSwift1: '',
  correspondentSwift2: '',
  correspondentSwift3: '',
  correspondentSwift4: '',
  correspondentSwift5: '',
  paymentInstructions: ''
};

const Profile: React.FC = () => {
  const [form, setForm] = useState<UserProfile>(defaultProfile);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleChange = (key: keyof UserProfile, value: string) => {
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
      signatureUrl: src.signatureUrl || '',
      swiftCode: src.swiftCode || '',
      iban: src.iban || '',
      cardNumber: src.cardNumber || '',
      // New payment fields
      bankName: src.bankName || '',
      correspondentBank1: src.correspondentBank1 || '',
      correspondentBank2: src.correspondentBank2 || '',
      correspondentBank3: src.correspondentBank3 || '',
      correspondentBank4: src.correspondentBank4 || '',
      correspondentBank5: src.correspondentBank5 || '',
      correspondentCountry1: src.correspondentCountry1 || '',
      correspondentCountry2: src.correspondentCountry2 || '',
      correspondentCountry3: src.correspondentCountry3 || '',
      correspondentCountry4: src.correspondentCountry4 || '',
      correspondentCountry5: src.correspondentCountry5 || '',
      correspondentSwift1: src.correspondentSwift1 || '',
      correspondentSwift2: src.correspondentSwift2 || '',
      correspondentSwift3: src.correspondentSwift3 || '',
      correspondentSwift4: src.correspondentSwift4 || '',
      correspondentSwift5: src.correspondentSwift5 || '',
      paymentInstructions: src.paymentInstructions || ''
    };
  };

  const saveProfile = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await profileAPI.update(buildUpdatePayload(form));
      setSuccess('Profile updated successfully');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    
    setChangingPassword(true);
    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Password changed successfully');
        setPasswordDialog(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (e: any) {
      setPasswordError('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const uploadFile = async (file: File, type: 'logo' | 'signature') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      throw error;
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'signature') => {
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingSignature;
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const url = await uploadFile(file, type);
      const key = type === 'logo' ? 'logoUrl' : 'signatureUrl';
      handleChange(key, url);
      setSuccess(`${type === 'logo' ? 'Logo' : 'Signature'} uploaded successfully`);
    } catch (e: any) {
      setError(`Failed to upload ${type}: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="profile-loading">
        <i className="pi pi-spin pi-spinner"></i>
        <div>Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Card title="Profile Settings" className="profile-card">
        {error && <Message severity="error" text={error} />}
        {success && <Message severity="success" text={success} />}

        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-grid-2">
            <div className="form-field">
              <label>Company Name</label>
              <InputText
                value={form.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Full Name</label>
              <InputText
                value={form.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Address Information</h3>
          <div className="form-field">
            <label>Address Line</label>
            <InputText
              value={form.addressLine}
              onChange={(e) => handleChange('addressLine', e.target.value)}
            />
          </div>

          <div className="form-grid-3">
            <div className="form-field">
              <label>City</label>
              <InputText
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>State</label>
              <InputText
                value={form.state}
                onChange={(e) => handleChange('state', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Postal Code</label>
              <InputText
                value={form.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Country</label>
              <InputText
                value={form.country}
                onChange={(e) => handleChange('country', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Phone</label>
              <InputText
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Media & Files</h3>
          <div className="form-grid-2">
            <div className="form-field">
              <label>Logo URL</label>
              <InputText
                value={form.logoUrl}
                onChange={(e) => handleChange('logoUrl', e.target.value)}
              />
              <div className="file-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'logo');
                  }}
                  className="file-input"
                />
                {uploadingLogo && <div className="upload-status">Uploading logo...</div>}
              </div>
            </div>
            <div className="form-field">
              <label>Signature URL</label>
              <InputText
                value={form.signatureUrl}
                onChange={(e) => handleChange('signatureUrl', e.target.value)}
              />
              <div className="file-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'signature');
                  }}
                  className="file-input"
                />
                {uploadingSignature && <div className="upload-status">Uploading signature...</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Payment Information</h3>
          <div className="form-grid-3">
            <div className="form-field">
              <label>Swift Code</label>
              <InputText
                value={form.swiftCode}
                onChange={(e) => handleChange('swiftCode', e.target.value)}
                placeholder="SWIFT code for international transfers"
              />
            </div>
            <div className="form-field">
              <label>IBAN</label>
              <InputText
                value={form.iban}
                onChange={(e) => handleChange('iban', e.target.value)}
                placeholder="International Bank Account Number"
              />
            </div>
            <div className="form-field">
              <label>Card Number</label>
              <InputText
                value={form.cardNumber}
                onChange={(e) => handleChange('cardNumber', e.target.value)}
                placeholder="Card number for payments"
              />
            </div>
          </div>
          
          <div className="form-grid-1">
            <div className="form-field">
              <label>Beneficiary Bank</label>
              <InputText
                value={form.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                placeholder="e.g., Raiffeisen banka ad Beograd"
              />
            </div>
          </div>

          <div className="form-section-sub">
            <h4>Correspondent Banks (up to 5)</h4>
            
            {/* Correspondent Bank 1 */}
            <div className="correspondent-bank-group">
              <h5>Correspondent Bank 1</h5>
              <div className="form-grid-3">
                <div className="form-field">
                  <label>Bank Name</label>
                  <InputText
                    value={form.correspondentBank1}
                    onChange={(e) => handleChange('correspondentBank1', e.target.value)}
                    placeholder="e.g., Raiffeisen Bank International AG"
                  />
                </div>
                <div className="form-field">
                  <label>SWIFT/BIC</label>
                  <InputText
                    value={form.correspondentSwift1}
                    onChange={(e) => handleChange('correspondentSwift1', e.target.value)}
                    placeholder="e.g., RZBAATWW"
                  />
                </div>
                <div className="form-field">
                  <label>Country</label>
                  <InputText
                    value={form.correspondentCountry1}
                    onChange={(e) => handleChange('correspondentCountry1', e.target.value)}
                    placeholder="e.g., Austria"
                  />
                </div>
              </div>
            </div>

            {/* Correspondent Bank 2 */}
            <div className="correspondent-bank-group">
              <h5>Correspondent Bank 2</h5>
              <div className="form-grid-3">
                <div className="form-field">
                  <label>Bank Name</label>
                  <InputText
                    value={form.correspondentBank2}
                    onChange={(e) => handleChange('correspondentBank2', e.target.value)}
                    placeholder="e.g., Deutsche Bank AG"
                  />
                </div>
                <div className="form-field">
                  <label>SWIFT/BIC</label>
                  <InputText
                    value={form.correspondentSwift2}
                    onChange={(e) => handleChange('correspondentSwift2', e.target.value)}
                    placeholder="e.g., DEUTDEFF"
                  />
                </div>
                <div className="form-field">
                  <label>Country</label>
                  <InputText
                    value={form.correspondentCountry2}
                    onChange={(e) => handleChange('correspondentCountry2', e.target.value)}
                    placeholder="e.g., Germany"
                  />
                </div>
              </div>
            </div>

            {/* Correspondent Bank 3 */}
            <div className="correspondent-bank-group">
              <h5>Correspondent Bank 3</h5>
              <div className="form-grid-3">
                <div className="form-field">
                  <label>Bank Name</label>
                  <InputText
                    value={form.correspondentBank3}
                    onChange={(e) => handleChange('correspondentBank3', e.target.value)}
                    placeholder="Bank name"
                  />
                </div>
                <div className="form-field">
                  <label>SWIFT/BIC</label>
                  <InputText
                    value={form.correspondentSwift3}
                    onChange={(e) => handleChange('correspondentSwift3', e.target.value)}
                    placeholder="SWIFT code"
                  />
                </div>
                <div className="form-field">
                  <label>Country</label>
                  <InputText
                    value={form.correspondentCountry3}
                    onChange={(e) => handleChange('correspondentCountry3', e.target.value)}
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>

            {/* Correspondent Bank 4 */}
            <div className="correspondent-bank-group">
              <h5>Correspondent Bank 4</h5>
              <div className="form-grid-3">
                <div className="form-field">
                  <label>Bank Name</label>
                  <InputText
                    value={form.correspondentBank4}
                    onChange={(e) => handleChange('correspondentBank4', e.target.value)}
                    placeholder="Bank name"
                  />
                </div>
                <div className="form-field">
                  <label>SWIFT/BIC</label>
                  <InputText
                    value={form.correspondentSwift4}
                    onChange={(e) => handleChange('correspondentSwift4', e.target.value)}
                    placeholder="SWIFT code"
                  />
                </div>
                <div className="form-field">
                  <label>Country</label>
                  <InputText
                    value={form.correspondentCountry4}
                    onChange={(e) => handleChange('correspondentCountry4', e.target.value)}
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>

            {/* Correspondent Bank 5 */}
            <div className="correspondent-bank-group">
              <h5>Correspondent Bank 5</h5>
              <div className="form-grid-3">
                <div className="form-field">
                  <label>Bank Name</label>
                  <InputText
                    value={form.correspondentBank5}
                    onChange={(e) => handleChange('correspondentBank5', e.target.value)}
                    placeholder="Bank name"
                  />
                </div>
                <div className="form-field">
                  <label>SWIFT/BIC</label>
                  <InputText
                    value={form.correspondentSwift5}
                    onChange={(e) => handleChange('correspondentSwift5', e.target.value)}
                    placeholder="SWIFT code"
                  />
                </div>
                <div className="form-field">
                  <label>Country</label>
                  <InputText
                    value={form.correspondentCountry5}
                    onChange={(e) => handleChange('correspondentCountry5', e.target.value)}
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-field">
            <label>Payment Instructions</label>
            <textarea
              value={form.paymentInstructions}
              onChange={(e) => handleChange('paymentInstructions', e.target.value)}
              placeholder="Additional payment instructions (e.g., 'Kindly be advised of the following instructions to be applied to EUR incoming payments...')"
              rows={4}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
        </div>

        <div className="profile-actions">
          <Button 
            label="Change Password" 
            icon="pi pi-key" 
            className="password-btn"
            onClick={() => setPasswordDialog(true)}
          />
          <Button 
            label="Save" 
            loading={loading} 
            onClick={saveProfile}
            className="save-btn"
          />
        </div>
      </Card>

      <Dialog 
        header="Change Password"
        visible={passwordDialog}
        onHide={() => setPasswordDialog(false)}
        className="password-dialog"
        style={{ width: '400px' }}
      >
        <div className="dialog-form">
          {passwordError && <Message severity="error" text={passwordError} />}
          
          <div className="dialog-field">
            <label>Current Password:</label>
            <Password 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              style={{ width: '100%' }}
            />
          </div>
          
          <div className="dialog-field">
            <label>New Password:</label>
            <Password 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              style={{ width: '100%' }}
            />
          </div>
          
          <div className="dialog-field">
            <label>Confirm New Password:</label>
            <Password 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={{ width: '100%' }}
            />
          </div>
          
          <div className="dialog-actions">
            <Button 
              label="Cancel" 
              severity="secondary" 
              onClick={() => setPasswordDialog(false)}
              outlined 
            />
            <Button 
              label="Change Password" 
              icon="pi pi-key"
              onClick={changePassword}
              loading={changingPassword}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Profile;
