import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import FaceScanner from './FaceScanner';
import { Fingerprint, UserPlus } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
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
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/register`, {
        username: username,
        face_embedding: descriptorArray
      });
      
      const token = response.data.access_token;
      localStorage.setItem('biometri_token', token);
      setSuccessMsg("Biometric Profile Successfully Registered.");
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Registration failed.");
      setStep(1);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <UserPlus size={48} className="logo-icon glow-text" style={{ marginBottom: '1rem', display: 'inline-block' }} />
          <h1 className="glow-text">NEW PROFILE ENROLLMENT</h1>
          <p className="mono" style={{ color: 'var(--text-muted)' }}>REGISTER BIOMETRIC ID</p>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(255,0,60,0.1)', border: '1px solid var(--border-error)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: 'var(--secondary)' }}>
            <span className="mono">{errorMsg}</span>
          </div>
        )}
        
        {successMsg && (
          <div style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid var(--border-active)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            <span className="mono">{successMsg}</span>
          </div>
        )}

        {step === 1 && !successMsg && (
          <form onSubmit={handleNext}>
            <div className="input-group">
              <label>Desired System Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="Ex: agent_smith"
              />
            </div>
            <button type="submit" className="btn" style={{ width: '100%' }}>Proceed to Biometric Scan</button>
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
               <Link to="/login" className="mono" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>[ Back to Login Phase ]</Link>
            </div>
          </form>
        )}

        {step === 2 && !successMsg && (
          <div>
            <FaceScanner onScanSuccess={handleFaceScan} label="Capturing Facial Geometry..." />
             <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button 
                onClick={() => setStep(1)} 
                className="btn" 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                [ Cancel Operation ]
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
