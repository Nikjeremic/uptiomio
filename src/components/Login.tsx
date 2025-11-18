import React, { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useAuth } from './AuthContext';
import logo from '../Uptimio Logo.png';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { login } = useAuth();

  // Check for email verification redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get('verified');
    const message = params.get('message');

    if (verified === 'success') {
      setVerificationMessage({ type: 'success', text: 'Email successfully verified! You can now log in.' });
      // Clean URL
      window.history.replaceState({}, '', '/');
    } else if (verified === 'error') {
      setVerificationMessage({ type: 'error', text: message || 'Email verification failed.' });
      // Clean URL
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container minimal">
      <Card className="login-form-card minimal-card">
        <div className="logo-wrap">
          <img src={logo} alt="Uptimio" className="brand-logo" />
          <h1 className="brand-title">Payment Services
          </h1>
        </div>

        {verificationMessage && (
          <Message 
            severity={verificationMessage.type === 'success' ? 'success' : 'error'} 
            text={verificationMessage.text} 
            style={{ marginBottom: '1rem' }}
          />
        )}

        <form onSubmit={handleSubmit} className="login-form compact">
          <div className="field">
            <label htmlFor="email" className="field-label">Email</label>
            <InputText
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input"
              required
            />
          </div>
          
          <div className="field">
            <label htmlFor="password" className="field-label">Password</label>
            <Password
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              inputClassName="field-input"
              required
              feedback={false}
            />
          </div>

          {error && (
            <Message severity="error" text={error} className="error-message" />
          )}

          <Button
            type="submit"
            label="Login"
            className="login-button"
            loading={loading}
          />
        </form>
      </Card>
    </div>
  );
};

export default Login;
