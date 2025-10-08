import React, { useEffect, useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { profileAPI, userAPI } from '../services/api';
import './AdminProfiles.css';

const AdminProfiles: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [editUser, setEditUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; user: any | null }>({ open: false, user: null });
  const [deleting, setDeleting] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);
  const [resetDialog, setResetDialog] = useState<{ open: boolean; user: any | null }>({ open: false, user: null });
  const [customPassword, setCustomPassword] = useState<string>('');
  const [useCustomPassword, setUseCustomPassword] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState(false);

  const fetchUsers = useMemo(() => async () => {
    try {
      setLoading(true);
      const { data } = await userAPI.getAllUsers();
      setUsers(data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const openEdit = async (user: any) => {
    setError(''); setSuccess('');
    setEditUser(user);
    try {
      const { data } = await profileAPI.getByUserId(user._id || user.id);
      setProfile(data);
    } catch {
      setProfile({ userId: user._id || user.id, fullName: user.name, companyName: '', addressLine: '', city: '', state: '', postalCode: '', country: '', phone: '', logoUrl: '' });
    }
  };

  const saveProfile = async () => {
    if (!editUser) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const { data } = await profileAPI.updateByUserId(editUser._id || editUser.id, profile);
      setProfile(data);
      setSuccess('Profile saved');
      await fetchUsers();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const uploadLogoForUser = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!editUser || !file) return;
    setUploadingLogo(true); setError(''); setSuccess('');
    try {
      const { data } = await profileAPI.uploadLogoForUser(editUser._id || editUser.id, file);
      setProfile((p: any) => ({ ...(p || {}), logoUrl: data.url }));
      setSuccess('Logo uploaded');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const askDelete = (user: any) => {
    setDeleteConfirm({ open: true, user });
  };

  const openResetDialog = (user: any) => {
    setResetDialog({ open: true, user });
    setCustomPassword('');
    setUseCustomPassword(false);
  };

  const resetPassword = async () => {
    if (!resetDialog.user) return;
    setResetting(true); setError(''); setSuccess('');
    try {
      const password = useCustomPassword ? customPassword : Math.random().toString(36).slice(-8);
      const response = await userAPI.resetPassword(
        resetDialog.user._id || resetDialog.user.id, 
        useCustomPassword ? password : undefined
      );
      setSuccess(`Password reset successfully. New password: ${response.data.tempPassword}`);
      setResetDialog({ open: false, user: null });
    } catch (e: any) {
      setError('Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.user) return;
    setDeleting(true); setError(''); setSuccess('');
    try {
      await userAPI.deleteUser(deleteConfirm.user._id || deleteConfirm.user.id);
      setSuccess('User deleted');
      setDeleteConfirm({ open: false, user: null });
      await fetchUsers();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };
  const verificationBodyTemplate = (rowData: any) => {
    return (
      <div className="verification-cell">
        {rowData.isVerified ? (
          <i 
            className="pi pi-check-circle" 
            style={{ color: '#22c55e', fontSize: '16px' }} 
            title="Verified"
          />
        ) : (
          <i 
            className="pi pi-exclamation-triangle" 
            style={{ color: '#f59e0b', fontSize: '16px' }} 
            title="Not verified"
          />
        )}
        <Tag 
          value={rowData.isVerified ? 'Verified' : 'Unverified'} 
          severity={rowData.isVerified ? 'success' : 'warning'}
          style={{ fontSize: '11px' }}
        />
      </div>
    );
  };

  const renderMobileCards = () => {
    if (loading) {
      return (
        <div className="mobile-users-container">
          {[1, 2, 3].map((i) => (
            <div key={i} className="user-card loading">
              <div className="user-card-skeleton"></div>
            </div>
          ))}
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="mobile-empty-state">
          <i className="pi pi-users"></i>
          <h3>No users found</h3>
          <p>No users are registered in the system</p>
        </div>
      );
    }

    return (
      <div className="mobile-users-container">
        {users.map((user) => (
          <div key={user._id || user.id} className="user-card">
            <div className="user-card-header">
              <div className="user-info">
                <div className="user-info-avatar">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="user-info-details">
                  <h3 className="user-info-name">{user.name}</h3>
                  <p className="user-info-email">{user.email}</p>
                </div>
              </div>
            </div>
            
            <div className="user-card-body">
              <div className="user-details-grid">
                <div className="user-detail-row">
                  <i className="pi pi-user"></i>
                  <span className="label">Role:</span>
                  <span className="value">
                    <Tag 
                      value={user.role} 
                      severity={user.role === 'admin' ? 'info' : 'success'}
                      style={{ fontSize: '11px' }}
                    />
                  </span>
                </div>
                <div className="user-detail-row">
                  <i className={user.isVerified ? "pi pi-check-circle" : "pi pi-exclamation-triangle"}></i>
                  <span className="label">Status:</span>
                  <span className="value">
                    <Tag 
                      value={user.isVerified ? 'Verified' : 'Unverified'} 
                      severity={user.isVerified ? 'success' : 'warning'}
                      style={{ fontSize: '11px' }}
                    />
                  </span>
                </div>
              </div>
              
              <div className="user-card-actions">
                <Button
                  label="Edit"
                  icon="pi pi-pencil"
                  className="user-action-btn edit-btn"
                  onClick={() => openEdit(user)}
                  size="small"
                />
                <Button
                  label="Reset"
                  icon="pi pi-key"
                  className="user-action-btn reset-btn"
                  onClick={() => openResetDialog(user)}
                  size="small"
                  outlined
                />
                <Button
                  label="Delete"
                  icon="pi pi-trash"
                  className="user-action-btn delete-btn"
                  onClick={() => askDelete(user)}
                  size="small"
                  outlined
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };


  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
      <div>
        <h2 style={{ margin: 0 }}>Profiles</h2>
        <p style={{ margin: '4px 0 0 0' }}>Manage all user profiles</p>
      </div>
      <Button 
        label="Refresh" 
        icon="pi pi-refresh" 
        onClick={fetchUsers}
        className="refresh-button"
      />
    </div>
  );

  return (
    <div className="admin-profiles">
      {error && <Message severity="error" text={error} />}
      {success && <Message severity="success" text={success} />}
      <Card header={header}>
        {isMobile ? (
          renderMobileCards()
        ) : (
          <DataTable value={users} loading={loading} paginator rows={10} rowsPerPageOptions={[5, 10, 25]} emptyMessage="No users">
            <Column field="name" header="Name" />
            <Column field="email" header="Email" />
            <Column field="role" header="Role" />
            <Column header="Verification" body={verificationBodyTemplate} />
            <Column header="Actions" body={(row) => (
              <div className="action-buttons">
                <Button label="Edit" icon="pi pi-pencil" size="small" onClick={() => openEdit(row)} />
                <Button label="Reset Password" icon="pi pi-key" size="small" severity="warning" outlined onClick={() => openResetDialog(row)} />
                <Button label="Delete" icon="pi pi-trash" size="small" severity="danger" outlined onClick={() => askDelete(row)} />
              </div>
            )} />
          </DataTable>
        )}
      </Card>

      <Dialog 
        header={editUser ? `Edit profile: ${editUser.name}` : ''} 
        visible={!!editUser} 
        modal 
        draggable={false}
        breakpoints={{ '960px': '60vw', '640px': '90vw' }}
        style={{ width: '50rem', maxWidth: '95vw' }}
        contentStyle={{ paddingTop: 0 }}
        onHide={() => setEditUser(null)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="user-info-header">
            <div className="user-avatar">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span className="pi pi-user" style={{ color: '#9ca3af' }} />
              )}
            </div>
            <div className="user-details">
              <div className="user-name">{editUser?.name}</div>
              <div className="user-email">{editUser?.email}</div>
            </div>
            <label className="upload-button">
              <span className="pi pi-upload" style={{ marginRight: 8 }} /> Upload logo
              <input type="file" accept="image/*" onChange={uploadLogoForUser} disabled={uploadingLogo} style={{ display: 'none' }} />
            </label>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>Full name</label>
              <InputText value={profile.fullName || ''} onChange={(e) => setProfile((p: any) => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div className="form-field">
              <label>Company</label>
              <InputText value={profile.companyName || ''} onChange={(e) => setProfile((p: any) => ({ ...p, companyName: e.target.value }))} />
            </div>
            <div className="form-field full-width">
              <label>Address</label>
              <InputText value={profile.addressLine || ''} onChange={(e) => setProfile((p: any) => ({ ...p, addressLine: e.target.value }))} />
            </div>
            <div className="form-field">
              <label>City</label>
              <InputText value={profile.city || ''} onChange={(e) => setProfile((p: any) => ({ ...p, city: e.target.value }))} />
            </div>
            <div className="form-field">
              <label>State/Province</label>
              <InputText value={profile.state || ''} onChange={(e) => setProfile((p: any) => ({ ...p, state: e.target.value }))} />
            </div>
            <div className="form-field">
              <label>Postal code</label>
              <InputText value={profile.postalCode || ''} onChange={(e) => setProfile((p: any) => ({ ...p, postalCode: e.target.value }))} />
            </div>
            <div className="form-field">
              <label>Country</label>
              <InputText value={profile.country || ''} onChange={(e) => setProfile((p: any) => ({ ...p, country: e.target.value }))} />
            </div>
            <div className="form-field">
              <label>Phone</label>
              <InputText value={profile.phone || ''} onChange={(e) => setProfile((p: any) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="form-field">
              <label>SWIFT Code</label>
              <InputText value={profile.swiftCode || ''} onChange={(e) => setProfile((p: any) => ({ ...p, swiftCode: e.target.value }))} placeholder="SWIFT code for international transfers" />
            </div>
            <div className="form-field">
              <label>IBAN</label>
              <InputText value={profile.iban || ''} onChange={(e) => setProfile((p: any) => ({ ...p, iban: e.target.value }))} placeholder="International Bank Account Number" />
            </div>
            <div className="form-field">
              <label>Card Number</label>
              <InputText value={profile.cardNumber || ''} onChange={(e) => setProfile((p: any) => ({ ...p, cardNumber: e.target.value }))} placeholder="Card number for payments" />
            </div>
          </div>

          <div className="dialog-actions">
            <Button label="Close" severity="secondary" onClick={() => setEditUser(null)} outlined />
            <Button label="Save" loading={saving} onClick={saveProfile} />
          </div>
        </div>
      </Dialog>

      <Dialog 
        header={`Reset Password: ${resetDialog.user?.name || ''}`}
        visible={resetDialog.open}
        onHide={() => setResetDialog({ open: false, user: null })}
        style={{ width: '400px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <input 
                type="radio" 
                checked={!useCustomPassword} 
                onChange={() => setUseCustomPassword(false)}
              />
              Generate random password
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="radio" 
                checked={useCustomPassword} 
                onChange={() => setUseCustomPassword(true)}
              />
              Set custom password
            </label>
          </div>
          
          {useCustomPassword && (
            <div>
              <label>Custom Password:</label>
              <InputText 
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                placeholder="Enter custom password"
                type="password"
              />
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button 
              label="Cancel" 
              severity="secondary" 
              onClick={() => setResetDialog({ open: false, user: null })}
              outlined 
            />
            <Button 
              label="Reset Password" 
              icon="pi pi-key"
              onClick={resetPassword}
              loading={resetting}
              disabled={useCustomPassword && !customPassword.trim()}
            />
          </div>
        </div>
      </Dialog>

      <Dialog 
        header={deleteConfirm.user ? `Delete user: ${deleteConfirm.user.name}` : 'Delete user'}
        visible={deleteConfirm.open}
        style={{ width: '28rem' }}
        onHide={() => setDeleteConfirm({ open: false, user: null })}
      >
        <p>Are you sure you want to delete this user? This will remove their profile as well.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <Button label="Cancel" severity="secondary" onClick={() => setDeleteConfirm({ open: false, user: null })} />
          <Button label="Delete" icon="pi pi-trash" severity="danger" loading={deleting} onClick={confirmDelete} />
        </div>
      </Dialog>
    </div>
  );
};

export default AdminProfiles; 