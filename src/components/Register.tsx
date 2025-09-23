import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Dropdown } from 'primereact/dropdown';
import { useAuth } from './AuthContext';
import './Register.css';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const roleOptions = [
    { label: 'Korisnik', value: 'user' },
    { label: 'Administrator', value: 'admin' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password, role);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="register-logo">
            <i className="pi pi-user-plus text-6xl text-primary"></i>
          </div>
          <h1 className="register-title">Kreiraj nalog</h1>
          <p className="register-subtitle">Registruj se u Uptiomio sistem</p>
        </div>

        <Card className="register-form-card">
          <form onSubmit={handleSubmit} className="register-form">
            <div className="field">
              <label htmlFor="name" className="field-label">Ime i prezime</label>
              <InputText
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field-input"
                placeholder="Unesite vaše ime"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="email" className="field-label">Email adresa</label>
              <InputText
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
                placeholder="Unesite vaš email"
                required
              />
            </div>
            
            <div className="field">
              <label htmlFor="password" className="field-label">Lozinka</label>
              <Password
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
                placeholder="Kreirajte lozinku"
                required
                feedback={false}
                toggleMask
              />
            </div>

            <div className="field">
              <label htmlFor="role" className="field-label">Uloga</label>
              <Dropdown
                id="role"
                value={role}
                options={roleOptions}
                onChange={(e) => setRole(e.value)}
                className="field-input"
                placeholder="Izaberite ulogu"
              />
            </div>

            {error && (
              <Message severity="error" text={error} className="error-message" />
            )}

            <Button
              type="submit"
              label="Kreiraj nalog"
              className="register-button"
              loading={loading}
              size="large"
            />
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
