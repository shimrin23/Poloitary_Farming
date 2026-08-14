import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import type { UserRole } from '../context/FarmContext';

export const Login: React.FC = () => {
  const { login, usersList, registerUser, verifyAndResetPassword } = useFarm();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  
  // Login & Signup Form fields
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Admin');
  
  // Security Question fields for Signup & Reset
  const [securityQuestion, setSecurityQuestion] = useState('What is the name of your farm?');
  const [securityAnswer, setSecurityAnswer] = useState('');
  
  // Password Reset state
  const [resetUsername, setResetUsername] = useState('');
  const [resetDob, setResetDob] = useState('');
  const [activeQuestion, setActiveQuestion] = useState('');
  const [userAnswerInput, setUserAnswerInput] = useState('');

  // Notification states
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const securityQuestionOptions = [
    'What is the name of your farm?',
    'What is your birthplace / hometown?',
    'What was your first pet’s name?',
    'What is your emergency contact phone number?'
  ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const matchedUser = usersList.find(
        u => u.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (matchedUser && matchedUser.password === password) {
        if (!matchedUser.approved) {
          setError('Your account is pending admin approval. Please check back later.');
        } else {
          const success = login(matchedUser.username, matchedUser.role);
          if (!success) {
            setError('Failed to create session. Please try again.');
          }
        }
      } else {
        setError('Invalid username or password.');
      }
      setIsLoading(false);
    }, 600);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedUser = username.trim();
    const trimmedName = fullName.trim();
    const trimmedDob = dob.trim();
    const trimmedAnswer = securityAnswer.trim();

    if (!trimmedUser || !trimmedName || !trimmedDob || !password || !confirmPassword || !trimmedAnswer) {
      setError('Please fill in all employee details (Full Name, Date of Birth, Credentials, and Security Answer).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = registerUser({
        username: trimmedUser,
        password,
        role,
        approved: false,
        fullName: trimmedName,
        dob: trimmedDob,
        securityQuestion,
        securityAnswer: trimmedAnswer
      });

      if (result.success) {
        setSuccessMsg(result.message);
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setDob('');
        setSecurityAnswer('');
      } else {
        setError(result.message);
      }
      setIsLoading(false);
    }, 600);
  };

  const handleVerifyAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedUser = resetUsername.trim();
    if (!trimmedUser) {
      setError('Please enter your username');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const matchedUser = usersList.find(
        u => u.username.toLowerCase() === trimmedUser.toLowerCase()
      );

      if (matchedUser) {
        setActiveQuestion(matchedUser.securityQuestion || 'What is the name of your farm?');
        setSuccessMsg(`Account verified for "${matchedUser.username}". Enter your DOB and security answer to reset your password.`);
        setMode('reset');
        setPassword('');
        setConfirmPassword('');
        setResetDob('');
        setUserAnswerInput('');
      } else {
        setError(`No account found with username "${trimmedUser}".`);
      }
      setIsLoading(false);
    }, 600);
  };

  const handleResetWithAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!resetDob.trim() || !userAnswerInput.trim() || !password || !confirmPassword) {
      setError('Please fill in all verification fields (DOB, Security Answer, and New Password).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = verifyAndResetPassword(resetUsername, resetDob, userAnswerInput, password);
      if (result.success) {
        setSuccessMsg(result.message);
        switchMode('login');
      } else {
        setError(result.message);
      }
      setIsLoading(false);
    }, 600);
  };

  const switchMode = (newMode: 'login' | 'signup' | 'forgot' | 'reset') => {
    setError('');
    setSuccessMsg('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setDob('');
    setSecurityAnswer('');
    setUserAnswerInput('');
    setResetUsername('');
    setResetDob('');
    setMode(newMode);
  };

  return (
    <div className="login-container">
      <div className="login-bg-glows">
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
      </div>

      <div className={`login-card glass-card ${mode === 'signup' ? 'signup-card' : ''}`}>
        <div className="login-header">
          <div className="login-logo">🐔</div>
          <h2>AKSHA POULTRY FARMS</h2>
          <p>Poultry Farm Management System</p>
        </div>

        {error && <div className="login-error-alert">{error}</div>}
        {successMsg && <div className="login-success-alert">{successMsg}</div>}

        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <h3 className="form-section-title">Sign In</h3>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={isLoading}
                maxLength={64}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                <button
                  type="button"
                  className="link-btn"
                  style={{ fontSize: '0.75rem', color: '#059669', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                  onClick={() => switchMode('forgot')}
                  disabled={isLoading}
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                maxLength={64}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary login-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="spinner-loader"></span>
              ) : (
                'Access Dashboard'
              )}
            </button>

            <div className="auth-footer-links">
              <span>Don't have an account? </span>
              <button
                type="button"
                className="text-link"
                onClick={() => switchMode('signup')}
                disabled={isLoading}
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="login-form">
            <h3 className="form-section-title">Create Account</h3>

            <div className="role-selector">
              <button
                type="button"
                className={`role-btn ${role === 'Admin' ? 'active admin' : ''}`}
                onClick={() => setRole('Admin')}
                disabled={isLoading}
              >
                👑 Register Admin
              </button>
              <button
                type="button"
                className={`role-btn ${role === 'Employee' ? 'active employee' : ''}`}
                onClick={() => setRole('Employee')}
                disabled={isLoading}
              >
                🧑‍🌾 Register Employee
              </button>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Full Name / Employee Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  disabled={isLoading}
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth (DOB)</label>
                <input
                  type="date"
                  className="form-control"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={isLoading}
                maxLength={64}
                required
              />
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Min 4 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                  maxLength={64}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  maxLength={64}
                  required
                />
              </div>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Security Question</label>
                <select
                  className="form-control"
                  value={securityQuestion}
                  onChange={e => setSecurityQuestion(e.target.value)}
                  disabled={isLoading}
                >
                  {securityQuestionOptions.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Security Answer</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your secret answer"
                  value={securityAnswer}
                  onChange={e => setSecurityAnswer(e.target.value)}
                  disabled={isLoading}
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary login-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="spinner-loader"></span>
              ) : (
                'Register Account'
              )}
            </button>

            <div className="auth-footer-links">
              <span>Already have an account? </span>
              <button
                type="button"
                className="text-link"
                onClick={() => switchMode('login')}
                disabled={isLoading}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleVerifyAccountSubmit} className="login-form">
            <h3 className="form-section-title">Reset Password</h3>
            <p className="form-section-desc">Enter your username to begin identity verification.</p>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter registered username"
                value={resetUsername}
                onChange={e => setResetUsername(e.target.value)}
                disabled={isLoading}
                maxLength={64}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary login-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="spinner-loader"></span>
              ) : (
                'Find Account'
              )}
            </button>

            <div className="auth-footer-links">
              <button
                type="button"
                className="text-link"
                onClick={() => switchMode('login')}
                disabled={isLoading}
              >
                ← Return to Sign In
              </button>
            </div>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetWithAnswerSubmit} className="login-form">
            <h3 className="form-section-title">Identity & Security Verification</h3>
            <p className="form-section-desc">Account: <strong>{resetUsername}</strong></p>

            <div className="form-group">
              <label className="form-label">Date of Birth (DOB)</label>
              <input
                type="date"
                className="form-control"
                value={resetDob}
                onChange={e => setResetDob(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Security Question</label>
              <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 }}>
                ❓ {activeQuestion}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Security Answer</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your security answer"
                value={userAnswerInput}
                onChange={e => setUserAnswerInput(e.target.value)}
                disabled={isLoading}
                maxLength={100}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Min 4 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                maxLength={64}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                maxLength={64}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary login-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="spinner-loader"></span>
              ) : (
                'Verify & Reset Password'
              )}
            </button>

            <div className="auth-footer-links">
              <button
                type="button"
                className="text-link"
                onClick={() => switchMode('login')}
                disabled={isLoading}
              >
                ← Return to Sign In
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .login-container {
          width: 100vw;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f0fdf4 0%, #e2e8f0 45%, #ecfdf5 100%);
          position: relative;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 2.5rem 1rem;
          box-sizing: border-box;
          font-family: var(--font-family);
        }

        .login-bg-glows {
          position: fixed;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .login-bg-glows .glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.25;
        }

        .glow-1 {
          width: 450px;
          height: 450px;
          background: #34d399;
          top: -120px;
          left: -100px;
        }

        .glow-2 {
          width: 550px;
          height: 550px;
          background: #818cf8;
          bottom: -160px;
          right: -120px;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 2.25rem !important;
          z-index: 10;
          border-radius: 20px !important;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.12), 0 0 25px rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          transition: all 0.3s ease;
          margin: auto;
        }

        .login-card.signup-card {
          max-width: 580px;
          padding: 2rem !important;
        }

        .form-row-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .login-header {
          text-align: center;
          margin-bottom: 1.75rem;
        }

        .login-logo {
          font-size: 3.2rem;
          margin-bottom: 0.25rem;
          filter: drop-shadow(0 4px 12px rgba(16, 185, 129, 0.3));
        }

        .login-header h2 {
          font-size: 1.65rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.03em;
        }

        .login-header p {
          font-size: 0.85rem;
          color: #475569;
          margin-top: 0.2rem;
          font-weight: 500;
        }

        .form-section-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1rem;
          text-align: center;
        }

        .form-section-desc {
          font-size: 0.82rem;
          color: #64748b;
          margin-bottom: 1rem;
          text-align: center;
          line-height: 1.4;
        }

        .login-card .form-label {
          color: #1e293b;
          font-weight: 600;
          font-size: 0.88rem;
        }

        .login-card .form-control {
          background: #ffffff !important;
          color: #0f172a !important;
          border: 1.5px solid #cbd5e1 !important;
          font-size: 0.95rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          transition: all 0.2s ease;
        }

        .login-card .form-control::placeholder {
          color: #94a3b8 !important;
          opacity: 1;
        }

        .login-card .form-control:focus {
          border-color: #059669 !important;
          background: #ffffff !important;
          color: #0f172a !important;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.18) !important;
        }

        .login-card input:-webkit-autofill,
        .login-card input:-webkit-autofill:hover,
        .login-card input:-webkit-autofill:focus,
        .login-card input:-webkit-autofill:active {
          -webkit-text-fill-color: #0f172a !important;
          -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .role-selector {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
          background: #f1f5f9;
          padding: 0.3rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .role-btn {
          flex: 1;
          background: none;
          border: none;
          color: #64748b;
          padding: 0.55rem;
          border-radius: 8px;
          font-family: var(--font-family);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .role-btn:hover {
          color: #0f172a;
        }

        .role-btn.active {
          color: #ffffff;
        }

        .role-btn.active.admin {
          background: #4f46e5;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        .role-btn.active.employee {
          background: #059669;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
        }

        .login-error-alert {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          padding: 0.75rem;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 600;
          margin-bottom: 1rem;
          animation: slideUp 0.2s ease-out;
        }

        .login-success-alert {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
          padding: 0.75rem;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 600;
          margin-bottom: 1rem;
          animation: slideUp 0.2s ease-out;
        }

        .login-submit-btn {
          width: 100%;
          padding: 0.8rem;
          font-size: 1rem;
          font-weight: 600;
          margin-top: 0.5rem;
          background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;
          color: #ffffff !important;
          border: none !important;
          border-radius: 10px !important;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35) !important;
          transition: all 0.2s ease;
        }

        .login-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45) !important;
        }

        .auth-footer-links {
          display: flex;
          justify-content: center;
          gap: 0.25rem;
          font-size: 0.85rem;
          color: #475569;
          margin-top: 1.25rem;
        }

        .text-link {
          background: none;
          border: none;
          color: #059669;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          font-family: var(--font-family);
          font-size: 0.85rem;
          transition: color 0.2s ease;
        }

        .text-link:hover {
          color: #047857;
          text-decoration: underline;
        }

        /* Spinner Loader */
        .spinner-loader {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 560px) {
          .login-container {
            padding: 1.25rem 0.75rem;
          }
          .login-card {
            padding: 1.5rem 1.2rem !important;
            margin: 0.5rem auto;
            max-width: 100%;
            border-radius: 16px !important;
          }
          .login-card.signup-card {
            padding: 1.5rem 1.2rem !important;
          }
          .form-row-2col {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .role-selector {
            flex-direction: column;
            gap: 0.3rem;
          }
        }
      `}</style>
    </div>
  );
};
