import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, Fingerprint, Plus, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import FaceScanner from './FaceScanner';

const Dashboard = () => {
  const [credentials, setCredentials] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [targetCredId, setTargetCredId] = useState(null);
  
  // New credential state
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // UI state
  const [revealedPasswords, setRevealedPasswords] = useState({}); // { id: "actual_password" }
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    const token = localStorage.getItem('biometri_token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const res = await axios.get('http://127.0.0.1:8000/credentials', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCredentials(res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('biometri_token');
    navigate('/login');
  };

  const handleAddCredential = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('biometri_token');
    try {
      await axios.post('http://127.0.0.1:8000/credentials', {
        site_name: siteName,
        site_url: siteUrl,
        username,
        password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddModal(false);
      setSiteName(''); setSiteUrl(''); setUsername(''); setPassword('');
      fetchCredentials(); // refresh
    } catch (err) {
      console.error("Failed to add", err);
    }
  };

  const triggerReveal = (credId) => {
    if (revealedPasswords[credId]) {
      // Hide if already revealed
      setRevealedPasswords(prev => {
        const copy = { ...prev };
        delete copy[credId];
        return copy;
      });
    } else {
      // Show scan modal
      setTargetCredId(credId);
      setShowScanModal(true);
    }
  };

  const handleScanSuccess = async (descriptorArray) => {
    // In our simplified flow, we just verify the scan is successful by calling login endpoint.
    // In a real scenario, you'd send the token AND the face embedding to an explicit /verify endpoint.
    try {
      const response = await axios.post('http://127.0.0.1:8000/login', {
        // We need the username. But we don't store username in localStorage currently.
        // Actually, we can get it from decoding the JWT.
        username: JSON.parse(atob(localStorage.getItem('biometri_token').split('.')[1])).sub,
        face_embedding: descriptorArray
      });
      
      // Verification successful!
      setShowScanModal(false);
      
      // Reveal the password
      const cred = credentials.find(c => c.id === targetCredId);
      if (cred) {
        setRevealedPasswords(prev => ({ ...prev, [targetCredId]: cred.password }));
      }
      
      // Auto-hide after 15 seconds for security
      setTimeout(() => {
        setRevealedPasswords(prev => {
          const copy = { ...prev };
          delete copy[targetCredId];
          return copy;
        });
      }, 15000);

    } catch (err) {
      console.error("Verification failed");
      // FaceScanner handles its own error UI implicitly or we can show an alert
      alert("Biometric verification failed. Access Denied.");
      setShowScanModal(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div className="header">
        <div className="logo">
          <Fingerprint className="logo-icon glow-text" />
          <span className="glow-text">BIOMETRI VAULT</span>
        </div>
        <button onClick={handleLogout} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={16} /> END SESSION
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2><span className="mono" style={{ color: 'var(--primary)' }}>//</span> SECURED CREDENTIALS</h2>
        <button onClick={() => setShowAddModal(true)} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> ADD ENTRY
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '400px' }}>
        {credentials.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <p className="mono">NO CREDENTIALS FOUND IN VAULT.</p>
          </div>
        ) : (
          credentials.map(cred => {
            const isRevealed = !!revealedPasswords[cred.id];
            return (
              <div key={cred.id} className="vault-item">
                <div className="vault-item-info">
                  <h3>{cred.site_name}</h3>
                  <p className="mono">{cred.username} <span style={{ color: 'var(--primary)' }}>@</span> {cred.site_url}</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div className={`status-badge ${isRevealed ? 'unlocked' : 'locked'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {isRevealed ? <Unlock size={12} /> : <Lock size={12} />}
                    {isRevealed ? 'DECRYPTED' : 'ENCRYPTED'}
                  </div>
                  
                  <div className="mono" style={{ fontSize: '1.2rem', letterSpacing: '4px', width: '150px', textAlign: 'center' }}>
                    {isRevealed ? revealedPasswords[cred.id] : '••••••••'}
                  </div>

                  <button 
                    onClick={() => triggerReveal(cred.id)}
                    className="btn" 
                    style={{ padding: '0.5rem', borderColor: isRevealed ? 'var(--secondary)' : 'var(--primary)', color: isRevealed ? 'var(--secondary)' : 'var(--primary)' }}>
                    {isRevealed ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px' }}>
            <h2 className="glow-text" style={{ marginBottom: '1.5rem' }}>NEW ENCLAVE ENTRY</h2>
            <form onSubmit={handleAddCredential}>
              <div className="input-group">
                <label>System / Service Name</label>
                <input required value={siteName} onChange={e => setSiteName(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Address / URL</label>
                <input required value={siteUrl} onChange={e => setSiteUrl(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Identifier / Username</label>
                <input required value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Secret Asset / Password</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-danger" style={{ flex: 1 }}>CANCEL</button>
                <button type="submit" className="btn" style={{ flex: 1 }}>ENCRYPT & STORE</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScanModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
            <h2 className="glow-text" style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>AUTH REQUIRED</h2>
            <p className="mono" style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>BIOMETRIC VERIFICATION FOR DECRYPTION</p>
            
            <FaceScanner onScanSuccess={handleScanSuccess} label="Verifying clearance level..." />
            
            <button onClick={() => setShowScanModal(false)} className="btn btn-danger" style={{ marginTop: '2rem' }}>
              ABORT OPERATION
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
