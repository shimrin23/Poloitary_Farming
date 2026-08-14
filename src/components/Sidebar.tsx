import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { Modal } from './Modal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { currentUser, logout, updateUserProfile, deleteUser } = useFarm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!editUsername.trim()) {
      setProfileError('Username cannot be empty');
      return;
    }

    if (newPassword) {
      if (!oldPassword) {
        setProfileError('Please enter your current password to set a new password');
        return;
      }
      if (newPassword.length < 4) {
        setProfileError('New password must be at least 4 characters');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setProfileError('Passwords do not match');
        return;
      }
    }

    setIsSavingProfile(true);
    setTimeout(() => {
      if (currentUser) {
        const result = updateUserProfile(
          currentUser.username,
          editUsername,
          newPassword || undefined,
          oldPassword || undefined
        );
        if (result.success) {
          setProfileSuccess(result.message);
          setNewPassword('');
          setConfirmNewPassword('');
          setOldPassword('');
          setTimeout(() => {
            setModalOpen(false);
            setProfileSuccess('');
          }, 1500);
        } else {
          setProfileError(result.message);
        }
      }
      setIsSavingProfile(false);
    }, 600);
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;
    const confirmDelete = window.confirm(
      `WARNING: Are you sure you want to permanently delete your account "${currentUser.username}"? This action cannot be undone and you will be signed out immediately.`
    );
    if (confirmDelete) {
      deleteUser(currentUser.username);
      logout();
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      )
    },
    {
      id: 'birds',
      label: 'Bird Batches',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" />
          <path d="M18 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4" />
          <circle cx="8" cy="12" r="2" />
        </svg>
      )
    },
    {
      id: 'feed',
      label: 'Feed Inventory',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
          <path d="M6 6h12" />
          <path d="M6 10h12" />
          <path d="M8 14h8" />
          <path d="M8 18h8" />
        </svg>
      )
    },
    {
      id: 'health',
      label: 'Health & Vaccines',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    },
    {
      id: 'eggs',
      label: 'Egg Production',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M2 12h20" />
        </svg>
      )
    },
    {
      id: 'sales',
      label: 'Sales & Invoices',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" x2="12" y1="2" y2="22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      adminOnly: true
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="12" x="2" y="6" rx="2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      ),
      adminOnly: true
    },
    {
      id: 'profit-loss',
      label: 'Profit & Loss',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
      adminOnly: true
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" x2="8" y1="13" y2="13" />
          <line x1="16" x2="8" y1="17" y2="17" />
          <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
      ),
      adminOnly: true
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      adminOnly: true
    },
    {
      id: 'invoices',
      label: 'Invoice Generator',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M12 18v-6" />
          <path d="m9 15 3 3 3-3" />
        </svg>
      ),
      adminOnly: true
    }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly && currentUser?.role !== 'Admin') {
      return false;
    }
    return true;
  });

  return (
    <>
      {isOpen && (
        <div className="sidebar-backdrop no-print" onClick={() => setIsOpen(false)} />
      )}
      <aside className={`sidebar no-print ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div className="logo-icon">🐔</div>
            <div className="logo-text">
              <h2>AKSHA POULTRY FARMS</h2>
              <span>Premium Poultry Products</span>
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={() => setIsOpen(false)} aria-label="Close menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-menu">
          {filteredMenuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile clickable" onClick={() => { setEditUsername(currentUser?.username || ''); setOldPassword(''); setNewPassword(''); setConfirmNewPassword(''); setModalOpen(true); }} title="Edit Profile">
            <div className="user-avatar">
              {currentUser?.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="username">{currentUser?.username}</span>
              <span className="user-role">{currentUser?.role}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={logout} title="Sign Out">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
          </button>
        </div>

      <style>{`
        .sidebar {
          width: 260px;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          background: var(--sidebar-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          z-index: 100;
          transition: width var(--transition-normal), background var(--transition-normal), border-color var(--transition-normal);
        }

        .sidebar-logo {
          padding: 1.75rem var(--spacing-lg);
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          border-bottom: 1px solid var(--border-color);
        }

        .logo-icon {
          font-size: 1.8rem;
        }

        .logo-text h2 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.1;
        }

        .logo-text span {
          font-size: 0.7rem;
          color: var(--color-emerald);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .sidebar-menu {
          flex: 1;
          padding: var(--spacing-lg) var(--spacing-sm);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          overflow-y: auto;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-family: var(--font-family);
          font-size: 0.95rem;
          font-weight: 500;
          border-radius: var(--radius-md);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
        }

        .menu-item svg {
          opacity: 0.7;
          transition: opacity var(--transition-fast);
        }

        .menu-item:hover {
          background: var(--glass-button-bg);
          color: var(--text-primary);
        }

        .menu-item:hover svg {
          opacity: 1;
        }

        .menu-item.active {
          background: var(--color-emerald-glow);
          color: var(--color-emerald);
          border: 1px solid rgba(16, 185, 129, 0.15);
        }

        .menu-item.active svg {
          opacity: 1;
          color: var(--color-emerald);
        }

        .sidebar-footer {
          padding: var(--spacing-lg);
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--glass-bg);
          transition: background-color var(--transition-normal), border-color var(--transition-normal);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .user-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-emerald) 0%, #047857 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .username {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-role {
          font-size: 0.72rem;
          color: var(--text-secondary);
        }

        .btn-logout {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .btn-logout:hover {
          color: var(--color-rose);
          background: var(--color-rose-glow);
        }

        .sidebar-backdrop {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(5, 8, 15, 0.65);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 999;
          animation: fadeIn var(--transition-fast) ease-out;
        }

        .sidebar-close-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: var(--radius-sm);
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .sidebar-close-btn:hover {
          color: var(--text-primary);
          background: var(--glass-button-hover);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 1024px) {
          .sidebar {
            width: 80px;
          }
          
          .logo-text, .user-info, .sidebar-logo .logo-icon {
            display: none;
          }

          .sidebar-logo {
            justify-content: center;
            padding: 1.5rem 0;
            font-size: 1.8rem;
          }

          .sidebar-logo::before {
            content: "🐔";
          }

          .menu-item span {
            display: none;
          }

          .menu-item {
            justify-content: center;
            padding: 0.75rem;
          }

          .sidebar-footer {
            flex-direction: column;
            gap: var(--spacing-md);
            justify-content: center;
            padding: var(--spacing-md) 0;
          }

          .btn-logout {
            padding: 0.5rem;
          }
        }

        @media (max-width: 768px) {
          .sidebar-backdrop {
            display: block;
          }

          .sidebar-close-btn {
            display: inline-flex;
          }

          .sidebar {
            display: flex !important;
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 260px !important;
            transform: translateX(-100%);
            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), background-color var(--transition-normal) !important;
            z-index: 1000;
            background: var(--bg-secondary);
            box-shadow: 10px 0 30px rgba(0, 0, 0, 0.5);
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .logo-text, .user-info, .sidebar-logo .logo-icon, .menu-item span {
            display: block !important;
          }

          .sidebar-logo {
            display: flex !important;
            justify-content: space-between !important;
            width: 100%;
            padding: 1.5rem var(--spacing-lg) !important;
          }

          .sidebar-logo::before {
            content: none !important;
          }

          .menu-item {
            justify-content: flex-start !important;
            padding: 0.75rem 1rem !important;
          }

          .sidebar-footer {
            flex-direction: row !important;
            justify-content: space-between !important;
            padding: var(--spacing-lg) !important;
            width: 100%;
          }
        }

        /* Clickable Profile & Settings Overlay */
        .user-profile.clickable {
          cursor: pointer;
          border-radius: var(--radius-md);
          padding: 4px;
          margin-left: -4px;
          transition: all var(--transition-fast);
        }

        .user-profile.clickable:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .user-profile.clickable:hover .user-avatar {
          filter: brightness(1.1);
        }

        .user-avatar {
          position: relative;
        }


        .login-error-alert {
          background: var(--color-rose-glow);
          color: var(--color-rose);
          border: 1px solid rgba(244, 63, 94, 0.15);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.82rem;
          font-weight: 500;
          animation: fadeIn var(--transition-fast) ease-out;
        }

        .login-success-alert {
          background: var(--color-emerald-glow);
          color: var(--color-emerald);
          border: 1px solid rgba(16, 185, 129, 0.15);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.82rem;
          font-weight: 500;
          animation: fadeIn var(--transition-fast) ease-out;
        }
      `}</style>
    </aside>

    <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setProfileError(''); setProfileSuccess(''); setOldPassword(''); setNewPassword(''); setConfirmNewPassword(''); }} title="Edit Profile">
      <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
        {profileError && <div className="login-error-alert" style={{ marginBottom: 0 }}>{profileError}</div>}
        {profileSuccess && <div className="login-success-alert" style={{ marginBottom: 0 }}>{profileSuccess}</div>}
        
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label className="form-label" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Username</label>
          <input
            type="text"
            className="form-control"
            value={editUsername}
            onChange={e => setEditUsername(e.target.value)}
            required
            disabled={isSavingProfile}
          />
        </div>
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label className="form-label" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Role</label>
          <input
            type="text"
            className="form-control"
            value={currentUser?.role || ''}
            disabled
            style={{ opacity: 0.6 }}
          />
        </div>
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label className="form-label" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Current Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Required if setting a new password"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            disabled={isSavingProfile}
          />
        </div>
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label className="form-label" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>New Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Min 4 characters (leave blank to keep current)"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            disabled={isSavingProfile}
          />
        </div>
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label className="form-label" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Confirm New Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Re-enter password (leave blank to keep current)"
            value={confirmNewPassword}
            onChange={e => setConfirmNewPassword(e.target.value)}
            disabled={isSavingProfile}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-sm)', padding: '0.7rem' }} disabled={isSavingProfile}>
          {isSavingProfile ? <span className="spinner-loader"></span> : 'Update Profile'}
        </button>

        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)' }}>
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={handleDeleteAccount}
            style={{ width: '100%', padding: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            disabled={isSavingProfile}
          >
            🗑 Delete Account
          </button>
        </div>
      </form>
    </Modal>
  </>
  );
};

