import React, { useEffect, useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { profileAPI, userAPI } from '../services/api';

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

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h2 style={{ margin: 0 }}>Profiles</h2>
        <p style={{ margin: '4px 0 0 0' }}>Manage all user profiles</p>
      </div>
      <Button label="Refresh" icon="pi pi-refresh" onClick={fetchUsers} />
    </div>
  );

  return (
    <div className="admin-profiles" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && <Message severity="error" text={error} />}
      {success && <Message severity="success" text={success} />}
      <Card header={header}>
        <DataTable value={users} loading={loading} paginator rows={10} rowsPerPageOptions={[5, 10, 25]} emptyMessage="No users">
          <Column field="name" header="Name" />
          <Column field="email" header="Email" />
          <Column field="role" header="Role" />
          <Column header="Actions" body={(row) => (
            <div style={{ display: 'flex', gap: 8 }}>
            <Button label="Edit" icon="pi pi-pencil" size="small" onClick={() => openEdit(row)} />
              <Button label="Delete" icon="pi pi-trash" size="small" severity="danger" outlined onClick={() => askDelete(row)} />
            </div>
          )} />
        </DataTable>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span className="pi pi-user" style={{ color: '#9ca3af' }} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{editUser?.name}</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>{editUser?.email}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <label className="p-button p-component" style={{ cursor: uploadingLogo ? 'not-allowed' : 'pointer', padding: '0.5rem 0.75rem' }}>
                <span className="pi pi-upload" style={{ marginRight: 8 }} /> Upload logo
                <input type="file" accept="image/*" onChange={uploadLogoForUser} disabled={uploadingLogo} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div 
            className="p-fluid" 
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            <div className="field">
            <label>Full name</label>
            <InputText value={profile.fullName || ''} onChange={(e) => setProfile((p: any) => ({ ...p, fullName: e.target.value }))} />
          </div>
            <div className="field">
            <label>Company</label>
            <InputText value={profile.companyName || ''} onChange={(e) => setProfile((p: any) => ({ ...p, companyName: e.target.value }))} />
          </div>
            <div className="field" style={{ gridColumn: '1 / span 2' }}>
            <label>Address</label>
            <InputText value={profile.addressLine || ''} onChange={(e) => setProfile((p: any) => ({ ...p, addressLine: e.target.value }))} />
          </div>
            <div className="field">
            <label>City</label>
            <InputText value={profile.city || ''} onChange={(e) => setProfile((p: any) => ({ ...p, city: e.target.value }))} />
          </div>
            <div className="field">
            <label>State/Province</label>
            <InputText value={profile.state || ''} onChange={(e) => setProfile((p: any) => ({ ...p, state: e.target.value }))} />
          </div>
            <div className="field">
            <label>Postal code</label>
            <InputText value={profile.postalCode || ''} onChange={(e) => setProfile((p: any) => ({ ...p, postalCode: e.target.value }))} />
          </div>
            <div className="field">
            <label>Country</label>
            <InputText value={profile.country || ''} onChange={(e) => setProfile((p: any) => ({ ...p, country: e.target.value }))} />
          </div>
            <div className="field">
            <label>Phone</label>
            <InputText value={profile.phone || ''} onChange={(e) => setProfile((p: any) => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button label="Close" severity="secondary" onClick={() => setEditUser(null)} outlined />
            <Button label="Save" loading={saving} onClick={saveProfile} />
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