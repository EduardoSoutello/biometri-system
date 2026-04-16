import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import FaceScanner from './FaceScanner';
import { Fingerprint, ShieldAlert } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [step, setStep] = useState(1); // 1: Username, 2: Face Scan
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleNext = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg("Username is required");
      return;
    }
    setErrorMsg("");
    setStep(2);
  };

  const handleFaceScan = async (descriptorArray) => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/login', {
        username: username,
        face_embedding: descriptorArray
      });
      
      const token = response.data.access_token;
      localStorage.setItem('biometri_token', token);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Authentication Failed. Unauthorized biometrics.");
      setStep(1); // Go back to try again smoothly? No, remain on step 1 to show error.
    }
  };

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Fingerprint size={48} className="logo-icon glow-text" style={{ marginBottom: '1rem', display: 'inline-block' }} />
          <h1 className="glow-text">BIOMETRI SYSTEM</h1>
          <p className="mono" style={{ color: 'var(--text-muted)' }}>SECURE VAULT ACCESS</p>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(255,0,60,0.1)', border: '1px solid var(--border-error)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)' }}>
            <ShieldAlert size={20} />
            <span className="mono">{errorMsg}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleNext}>
            <div className="input-group">
              <label>System Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="Enter classification ID..."
              />
            </div>
            <button type="submit" className="btn" style={{ width: '100%' }}>Initiate Sequence</button>
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link to="/register" className="mono" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>[ Initialize New User ]</Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <div>
            <FaceScanner onScanSuccess={handleFaceScan} label="Awaiting Biometric Data..." />
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button 
                onClick={() => setStep(1)} 
                className="btn" 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                [ Cancel ]
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
