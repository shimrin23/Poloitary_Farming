import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { Modal } from '../components/Modal';

export const EmployeeMgmt: React.FC = () => {
  const { 
    usersList, 
    approveUser, 
    updateUserRole, 
    deleteUser, 
    currentUser,
    pendingSubmissions,
    approveSubmission,
    rejectSubmission,
    deletePendingSubmission
  } = useFarm();
  const [searchTerm, setSearchTerm] = useState('');

  // Submission Queue Filter Tab ('pending' | 'approved' | 'rejected' | 'all')
  const [submissionTab, setSubmissionTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [submissionTypeFilter, setSubmissionTypeFilter] = useState<string>('all');
  const [rejectModalSubId, setRejectModalSubId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Admin Verification for Role Switch
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [roleSwitchTarget, setRoleSwitchTarget] = useState<{ username: string; targetRole: 'Admin' | 'Employee' } | null>(null);

  const handleInitiateRoleSwitch = (username: string, targetRole: 'Admin' | 'Employee') => {
    setRoleSwitchTarget({ username, targetRole });
    setAdminPasswordInput('');
    setAdminAuthError('');
    setIsAdminAuthModalOpen(true);
  };

  const handleVerifyAndSwitchRole = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roleSwitchTarget) return;

    const adminUser = usersList.find(u => u.role === 'Admin');
    const isPasswordCorrect = adminUser ? adminUser.password === adminPasswordInput : (adminPasswordInput === 'admin' || adminPasswordInput === '2001-02-23');

    if (!isPasswordCorrect) {
      setAdminAuthError('❌ Incorrect Admin Password. Access denied.');
      return;
    }

    updateUserRole(roleSwitchTarget.username, roleSwitchTarget.targetRole);
    setIsAdminAuthModalOpen(false);
    setRoleSwitchTarget(null);
    setAdminPasswordInput('');
    setAdminAuthError('');
  };

  const handleConfirmReject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!rejectModalSubId) return;
    rejectSubmission(rejectModalSubId, rejectReasonInput.trim() || 'Declined by Administrator');
    setRejectModalSubId(null);
    setRejectReasonInput('');
  };

  // Helper to format submission data
  const renderSubmissionDetails = (sub: any) => {
    const { type, data } = sub;
    switch (type) {
      case 'EggCollection':
        return (
          <div>
            <strong>🥚 Egg Collection:</strong> {data.collectedQty} collected · <span className="color-rose">{data.damagedQty} damaged</span> · <span className="color-emerald"><b>{data.netQty} usable net</b></span> (Date: {data.date})
          </div>
        );
      case 'Mortality':
        return (
          <div>
            <strong>💀 Bird Mortality:</strong> <span className="color-rose"><b>{data.quantity} birds</b></span> lost in Batch <b>{data.batchId}</b> · Reason: <em>{data.reason}</em> (Date: {data.date})
          </div>
        );
      case 'FeedConsumption':
        return (
          <div>
            <strong>🌾 Feed Consumed:</strong> <b>{data.quantityKg} kg</b> of {data.feedType} fed to Batch <b>{data.batchId}</b> (Date: {data.date})
          </div>
        );
      case 'FeedPurchase':
        return (
          <div>
            <strong>🛒 Feed Purchase:</strong> <b>{data.quantityKg} kg</b> of {data.feedType} @ Rs {data.cost?.toLocaleString()} from {data.vendor} (Date: {data.date})
          </div>
        );
      case 'VaccineSchedule':
        return (
          <div>
            <strong>💉 Vaccine Event:</strong> <b>{data.vaccineName}</b> scheduled for Batch <b>{data.batchId}</b> on {data.scheduledDate}
          </div>
        );
      case 'VaccineStatusUpdate':
        return (
          <div>
            <strong>💉 Immunization Status:</strong> Mark <b>{data.vaccineName}</b> for Batch <b>{data.batchId}</b> as <span className={data.status === 'Completed' ? 'color-emerald' : 'color-amber'}><b>{data.status}</b></span>
          </div>
        );
      case 'MedicalRecord':
        return (
          <div>
            <strong>🩺 Medical Remedy:</strong> Batch <b>{data.batchId}</b> · Disease: <em>{data.disease}</em> · Remedy: <b>{data.medicine}</b> ({data.dosage}) · Cost: Rs {data.cost} (Date: {data.date})
          </div>
        );
      case 'BirdBatch':
        return (
          <div>
            <strong>🐥 New Bird Batch:</strong> Batch <b>{data.id}</b> ({data.type}) · {data.initialQuantity} birds @ Rs {data.purchasePrice}/bird (Arrival: {data.arrivalDate})
          </div>
        );
      default:
        return <div>{JSON.stringify(data)}</div>;
    }
  };

  // Filtered Submissions
  const filteredSubmissions = pendingSubmissions.filter(sub => {
    if (submissionTab !== 'all' && sub.status.toLowerCase() !== submissionTab) return false;
    if (submissionTypeFilter !== 'all' && sub.type !== submissionTypeFilter) return false;
    return true;
  });

  // Statistics
  const totalUsers = usersList.length;
  const pendingUsers = usersList.filter(u => !u.approved);
  const approvedUsers = usersList.filter(u => u.approved);
  const activeAdmins = approvedUsers.filter(u => u.role === 'Admin').length;
  const activeEmployees = approvedUsers.filter(u => u.role === 'Employee').length;
  const pendingSubsCount = pendingSubmissions.filter(s => s.status === 'Pending').length;

  const filteredApproved = approvedUsers.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="employee-page animate-fade-in">
      {/* 1. Statistics Cards */}
      <div className="grid-cols-4 stat-grid">
        <div className="glass-card stat-card border-indigo">
          <div className="stat-icon">👥</div>
          <div className="stat-data">
            <span className="stat-label">Total Registered</span>
            <h3 className="stat-value">{totalUsers}</h3>
            <span className="stat-subtext">Accounts in database</span>
          </div>
        </div>

        <div className="glass-card stat-card border-emerald">
          <div className="stat-icon">👑</div>
          <div className="stat-data">
            <span className="stat-label">Active Staff</span>
            <h3 className="stat-value">{activeEmployees} Emp · {activeAdmins} Adm</h3>
            <span className="stat-subtext">Registered team</span>
          </div>
        </div>

        <div className="glass-card stat-card border-amber">
          <div className="stat-icon">⌛</div>
          <div className="stat-data">
            <span className="stat-label">Pending Accounts</span>
            <h3 className="stat-value color-amber">{pendingUsers.length}</h3>
            <span className="stat-subtext">Require registration approval</span>
          </div>
        </div>

        <div className="glass-card stat-card border-cyan">
          <div className="stat-icon">📋</div>
          <div className="stat-data">
            <span className="stat-label">Pending Farm Logs</span>
            <h3 className="stat-value color-cyan">{pendingSubsCount}</h3>
            <span className="stat-subtext">Awaiting admin review</span>
          </div>
        </div>
      </div>

      {/* 2. Employee Farm Activity & Submission Approvals Queue */}
      <div className="glass-card table-section" style={{ border: pendingSubsCount > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : undefined }}>
        <div className="section-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h4 style={{ margin: 0 }}>📋 Employee Farm Submissions & Approval Queue</h4>
              {pendingSubsCount > 0 && (
                <span className="badge badge-amber">{pendingSubsCount} Pending Review</span>
              )}
            </div>
            <p className="subtitle" style={{ margin: '0.25rem 0 0 0' }}>
              Logs and records added by farm employees remain pending until approved by an administrator
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Status Filter Tabs */}
            <div className="sub-queue-tabs">
              <button
                type="button"
                className={`queue-tab-btn ${submissionTab === 'pending' ? 'active tab-pending' : ''}`}
                onClick={() => setSubmissionTab('pending')}
              >
                <span>⏳ Pending</span>
                <span className="count-pill amber">
                  {pendingSubmissions.filter(s => s.status === 'Pending').length}
                </span>
              </button>
              <button
                type="button"
                className={`queue-tab-btn ${submissionTab === 'approved' ? 'active tab-approved' : ''}`}
                onClick={() => setSubmissionTab('approved')}
              >
                <span>✅ Approved</span>
                <span className="count-pill emerald">
                  {pendingSubmissions.filter(s => s.status === 'Approved').length}
                </span>
              </button>
              <button
                type="button"
                className={`queue-tab-btn ${submissionTab === 'rejected' ? 'active tab-rejected' : ''}`}
                onClick={() => setSubmissionTab('rejected')}
              >
                <span>❌ Rejected</span>
                <span className="count-pill rose">
                  {pendingSubmissions.filter(s => s.status === 'Rejected').length}
                </span>
              </button>
              <button
                type="button"
                className={`queue-tab-btn ${submissionTab === 'all' ? 'active tab-all' : ''}`}
                onClick={() => setSubmissionTab('all')}
              >
                <span>All Logs</span>
                <span className="count-pill neutral">
                  {pendingSubmissions.length}
                </span>
              </button>
            </div>

            {/* Type Selector */}
            <select
              className="form-control"
              value={submissionTypeFilter}
              onChange={e => setSubmissionTypeFilter(e.target.value)}
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem', height: '34px' }}
            >
              <option value="all">All Record Types</option>
              <option value="EggCollection">🥚 Egg Collections</option>
              <option value="Mortality">💀 Mortality Logs</option>
              <option value="FeedConsumption">🌾 Feed Consumption</option>
              <option value="FeedPurchase">🛒 Feed Purchases</option>
              <option value="VaccineSchedule">💉 Vaccine Events</option>
              <option value="VaccineStatusUpdate">💉 Vaccine Status Updates</option>
              <option value="MedicalRecord">🩺 Medical Records</option>
              <option value="BirdBatch">🐥 Bird Batches</option>
            </select>
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <div className="empty-icon">
              {submissionTab === 'pending' ? '✨' : '📁'}
            </div>
            <h5>
              {submissionTab === 'pending'
                ? 'No Pending Submissions'
                : `No ${submissionTab} submissions found`}
            </h5>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              {submissionTab === 'pending'
                ? 'All employee farm logs have been reviewed and processed!'
                : 'Submissions matching this filter will appear here.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Submitted By & Date</th>
                  <th>Record Type</th>
                  <th>Submission Details</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map(sub => (
                  <tr key={sub.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong>@{sub.submittedBy}</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${
                        sub.type === 'EggCollection' ? 'employee' :
                        sub.type === 'Mortality' ? 'admin' :
                        sub.type === 'FeedPurchase' || sub.type === 'FeedConsumption' ? 'employee' :
                        'admin'
                      }`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                        {sub.type === 'EggCollection' ? '🥚 Egg Log' :
                         sub.type === 'Mortality' ? '💀 Mortality' :
                         sub.type === 'FeedConsumption' ? '🌾 Feed Use' :
                         sub.type === 'FeedPurchase' ? '🛒 Feed Buy' :
                         sub.type === 'VaccineSchedule' ? '💉 Vaccine' :
                         sub.type === 'VaccineStatusUpdate' ? '💉 Vaccine Done/Revert' :
                         sub.type === 'MedicalRecord' ? '🩺 Remedy' : '🐥 Bird Batch'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {renderSubmissionDetails(sub)}
                      {sub.status === 'Rejected' && sub.rejectionReason && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-rose)', marginTop: '0.25rem' }}>
                          Reason: {sub.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${sub.status === 'Pending' ? 'badge-amber' : sub.status === 'Approved' ? 'badge-emerald' : 'badge-rose'}`}>
                        {sub.status === 'Pending' ? '⏳ Pending Review' : sub.status === 'Approved' ? '✅ Approved' : '❌ Rejected'}
                      </span>
                      {sub.reviewedBy && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          by @{sub.reviewedBy}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell">
                        {sub.status === 'Pending' ? (
                          <>
                            <button
                              type="button"
                              className="btn-action approve"
                              onClick={async () => {
                                try {
                                  await approveSubmission(sub.id);
                                } catch (err: any) {
                                  alert(`Failed to approve: ${err?.message || err}`);
                                }
                              }}
                              title="Approve & Apply to Live Inventory"
                            >
                              ✔ Approve
                            </button>
                            <button
                              type="button"
                              className="btn-action reject"
                              onClick={() => {
                                setRejectModalSubId(sub.id);
                                setRejectReasonInput('');
                              }}
                              title="Reject Submission"
                            >
                              ✖ Reject
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="btn-action delete"
                            onClick={() => deletePendingSubmission(sub.id)}
                            title="Remove from history"
                          >
                            🗑️ Dismiss
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Pending Registration Approvals Section */}
      <div className="glass-card table-section">
        <div className="section-header">
          <div>
            <h4>Pending Registration Requests</h4>
            <p className="subtitle">New users waiting for access authorization</p>
          </div>
          {pendingUsers.length > 0 && (
            <span className="badge badge-amber">{pendingUsers.length} Pending</span>
          )}
        </div>

        {pendingUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h5>All Caught Up!</h5>
            <p>There are no pending account approval requests at the moment.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee Details</th>
                  <th>Requested Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(user => (
                  <tr key={user.username}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar-small">
                          {(user.fullName || user.username).substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="user-name" style={{ fontWeight: 650 }}>{user.fullName || user.username}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className="status-dot pending"></span> Pending Approval
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell">
                        <button
                          className="btn-action approve"
                          onClick={() => approveUser(user.username)}
                          title="Approve Account"
                        >
                          ✔ Approve
                        </button>
                        <button
                          className="btn-action reject"
                          onClick={() => deleteUser(user.username)}
                          title="Reject Account"
                        >
                          ✖ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Rejection Reason */}
      <Modal
        isOpen={Boolean(rejectModalSubId)}
        onClose={() => setRejectModalSubId(null)}
        title="❌ Reject Farm Submission"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setRejectModalSubId(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={handleConfirmReject}>
              Confirm Rejection
            </button>
          </div>
        }
      >
        <form onSubmit={handleConfirmReject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Please state the reason for rejecting this employee submission (optional):
          </p>
          <div className="form-group">
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Discrepancy in bird count, incorrect feed type selected..."
              value={rejectReasonInput}
              onChange={e => setRejectReasonInput(e.target.value)}
              autoFocus
            />
          </div>
        </form>
      </Modal>

      {/* 4. Approved Users Section */}
      <div className="glass-card table-section">
        <div className="section-header search-row">
          <div>
            <h4>Authorized Users</h4>
            <p className="subtitle">Manage system access roles and credentials</p>
          </div>
          <div className="search-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" x2="16.65" y1="21" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredApproved.length === 0 ? (
          <div className="empty-state">
            <p>No authorized users match your search criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee Details</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApproved.map(user => {
                  const isSelf = currentUser?.username.toLowerCase() === user.username.toLowerCase();
                  return (
                    <tr key={user.username}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar-small">
                            {(user.fullName || user.username).substring(0, 2).toUpperCase()}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="user-name" style={{ fontWeight: 650 }}>{user.fullName || user.username} {isSelf && <span className="self-tag">(You)</span>}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{user.username}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className="status-dot approved"></span> Active
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="actions-cell">
                          <button
                            className="btn-action toggle-role"
                            onClick={() => handleInitiateRoleSwitch(user.username, user.role === 'Admin' ? 'Employee' : 'Admin')}
                            disabled={isSelf}
                            title="Switch user role (Requires Admin Password)"
                          >
                            🔄 Switch to {user.role === 'Admin' ? 'Employee' : 'Admin'}
                          </button>
                          <button
                            className="btn-action delete"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
                                deleteUser(user.username);
                              }
                            }}
                            disabled={isSelf}
                            title="Delete User"
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Admin Password Approval Modal for Switching Roles ── */}
      <Modal
        isOpen={isAdminAuthModalOpen}
        onClose={() => {
          setIsAdminAuthModalOpen(false);
          setRoleSwitchTarget(null);
          setAdminPasswordInput('');
          setAdminAuthError('');
        }}
        title="🔐 Security Verification: Admin Approval Required"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', width: '100%' }}>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                setIsAdminAuthModalOpen(false);
                setRoleSwitchTarget(null);
                setAdminPasswordInput('');
                setAdminAuthError('');
              }}
            >
              Cancel
            </button>
            <button className="btn btn-primary" type="button" onClick={handleVerifyAndSwitchRole}>
              🔑 Verify & Switch Role
            </button>
          </div>
        }
      >
        <form onSubmit={handleVerifyAndSwitchRole} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              🔒 Admin Password Required
            </p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Changing @{roleSwitchTarget?.username}'s access role to <strong>{roleSwitchTarget?.targetRole}</strong> requires administrator authorization.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Admin Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter Admin password..."
              value={adminPasswordInput}
              onChange={e => {
                setAdminPasswordInput(e.target.value);
                setAdminAuthError('');
              }}
              autoFocus
              required
            />
          </div>

          {adminAuthError && (
            <div style={{ color: 'var(--color-rose)', fontSize: '0.82rem', fontWeight: 600 }}>
              {adminAuthError}
            </div>
          )}
        </form>
      </Modal>

      <style>{`
        .employee-page {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .stat-grid {
          margin-bottom: var(--spacing-sm);
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          padding: var(--spacing-lg);
          border-left: 4px solid var(--border-color);
        }

        .stat-card.border-indigo { border-left-color: var(--color-indigo); }
        .stat-card.border-emerald { border-left-color: var(--color-emerald); }
        .stat-card.border-cyan { border-left-color: var(--color-cyan); }
        .stat-card.border-amber { border-left-color: var(--color-amber); }

        .stat-icon {
          font-size: 2rem;
          width: 50px;
          height: 50px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.03);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-data {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0.1rem 0;
        }

        .stat-subtext {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .color-amber {
          color: var(--color-amber) !important;
        }

        .table-section {
          padding: var(--spacing-lg) !important;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: var(--spacing-md);
        }

        .section-header h4 {
          font-size: 1.1rem;
          font-weight: 650;
          color: var(--text-primary);
        }

        .section-header .subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .search-row {
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          background: rgba(0, 0, 0, 0.15);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.4rem 0.8rem;
          width: 100%;
          max-width: 280px;
        }

        .search-box input {
          background: none;
          border: none;
          color: var(--text-primary);
          font-family: var(--font-family);
          font-size: 0.85rem;
          width: 100%;
          outline: none;
        }

        .empty-state {
          padding: var(--spacing-xl) 0;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .empty-icon {
          font-size: 2.2rem;
          margin-bottom: var(--spacing-sm);
        }

        .empty-state h5 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xs);
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .avatar-small {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-indigo) 0%, #4338ca 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.72rem;
          color: #ffffff;
        }

        .user-name {
          font-weight: 550;
          color: var(--text-primary);
        }

        .self-tag {
          font-size: 0.7rem;
          color: var(--color-emerald);
          font-style: italic;
          margin-left: 4px;
        }

        .role-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-sm);
        }

        .role-badge.admin {
          background: var(--color-indigo-glow);
          color: var(--color-indigo);
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .role-badge.employee {
          background: var(--color-emerald-glow);
          color: var(--color-emerald);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 6px;
        }

        .status-dot.approved { background: var(--color-emerald); }
        .status-dot.pending { background: var(--color-amber); }

        .actions-cell {
          display: flex;
          gap: var(--spacing-sm);
          justify-content: flex-end;
        }

        .btn-action {
          border: none;
          font-family: var(--font-family);
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.35rem 0.7rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .btn-action.approve {
          background: var(--color-emerald-glow);
          color: var(--color-emerald);
          border: 1px solid rgba(16, 185, 129, 0.15);
        }

        .btn-action.approve:hover {
          background: var(--color-emerald);
          color: #ffffff;
        }

        .btn-action.reject, .btn-action.delete {
          background: var(--color-rose-glow);
          color: var(--color-rose);
          border: 1px solid rgba(244, 63, 94, 0.15);
        }

        .btn-action.reject:hover, .btn-action.delete:hover:not(:disabled) {
          background: var(--color-rose);
          color: #ffffff;
        }

        .btn-action.toggle-role {
          background: var(--glass-button-bg);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .btn-action.toggle-role:hover:not(:disabled) {
          background: var(--glass-button-hover);
          color: var(--text-primary);
          border-color: var(--border-color-hover);
        }

        .btn-action:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .sub-queue-tabs {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(15, 23, 42, 0.65);
          padding: 4px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          backdrop-filter: blur(8px);
        }

        .queue-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-sm);
          font-family: var(--font-family);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .queue-tab-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.06);
        }

        .queue-tab-btn.active {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }

        .queue-tab-btn.active.tab-pending {
          background: rgba(245, 158, 11, 0.15);
          border-color: rgba(245, 158, 11, 0.35);
          color: #fbbf24;
        }

        .queue-tab-btn.active.tab-approved {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.35);
          color: #34d399;
        }

        .queue-tab-btn.active.tab-rejected {
          background: rgba(244, 63, 94, 0.15);
          border-color: rgba(244, 63, 94, 0.35);
          color: #fb7185;
        }

        .count-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 19px;
          height: 19px;
          padding: 0 5px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          line-height: 1;
        }

        .count-pill.amber {
          background: rgba(245, 158, 11, 0.25);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .count-pill.emerald {
          background: rgba(16, 185, 129, 0.25);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .count-pill.rose {
          background: rgba(244, 63, 94, 0.25);
          color: #f43f5e;
          border: 1px solid rgba(244, 63, 94, 0.3);
        }

        .count-pill.neutral {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
      `}</style>
    </div>
  );
};
