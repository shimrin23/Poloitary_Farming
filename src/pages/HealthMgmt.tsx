import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { Modal } from '../components/Modal';

export const HealthMgmt: React.FC = () => {
  const { 
    batches, 
    vaccines, 
    medicalRecords, 
    usersList,
    currentUser,
    submitForApproval,
    addVaccineSchedule, 
    updateVaccineStatus, 
    addMedicalRecord, 
    deleteVaccineSchedule, 
    updateVaccineSchedule, 
    updateMedicalRecord,
    deleteMedicalRecord,
    updateMortalityLog,
    deleteMortalityLog
  } = useFarm();
  const isAdmin = currentUser?.role === 'Admin';

  const [subTab, setSubTab] = useState<'vaccines' | 'medical' | 'mortality'>('vaccines');
  const [isVaccineModalOpen, setIsVaccineModalOpen] = useState(false);
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
  
  // Admin Verification for Editing Vaccine Events
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [pendingEditVaccine, setPendingEditVaccine] = useState<any | null>(null);

  const handleStatusAction = (v: any, targetStatus: 'Completed' | 'Pending') => {
    if (!isAdmin) {
      submitForApproval('VaccineStatusUpdate', {
        vaccineId: v.id,
        vaccineName: v.vaccineName,
        batchId: v.batchId,
        status: targetStatus
      });
      alert(`✅ Immunization mark ${targetStatus === 'Completed' ? 'Done' : 'Revert'} submitted! It is now pending Admin approval.`);
    } else {
      updateVaccineStatus(v.id, targetStatus);
    }
  };

  const handleInitiateEditVaccine = (v: any) => {
    setPendingEditVaccine(v);
    setAdminPasswordInput('');
    setAdminAuthError('');
    setIsAdminAuthModalOpen(true);
  };

  const handleVerifyAdminAndExecute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pendingEditVaccine) return;

    const adminUser = usersList.find(u => u.role === 'Admin');
    const isPasswordCorrect = adminUser 
      ? adminUser.password === adminPasswordInput 
      : (adminPasswordInput === 'admin' || adminPasswordInput === '2001-02-23');

    if (!isPasswordCorrect) {
      setAdminAuthError('❌ Incorrect Admin Password. Access denied.');
      return;
    }

    try {
      handleOpenEditVaccine(pendingEditVaccine);
      setIsAdminAuthModalOpen(false);
      setPendingEditVaccine(null);
      setAdminPasswordInput('');
      setAdminAuthError('');
    } catch (err) {
      console.error('Vaccine edit verification failed:', err);
      setAdminAuthError('❌ Action failed. Please try again.');
    }
  };

  // Edit Vaccine States
  const [isEditVaccineModalOpen, setIsEditVaccineModalOpen] = useState(false);
  const [editingVaccineId, setEditingVaccineId] = useState('');
  const [editVaccineName, setEditVaccineName] = useState('');
  const [editVaccineBatchId, setEditVaccineBatchId] = useState('');
  const [editVaccineDate, setEditVaccineDate] = useState('');
  const [editVaccineStatus, setEditVaccineStatus] = useState<any>('Pending');

  const handleOpenEditVaccine = (v: any) => {
    setEditingVaccineId(v.id);
    setEditVaccineName(v.vaccineName);
    setEditVaccineBatchId(v.batchId);
    setEditVaccineDate(v.scheduledDate);
    setEditVaccineStatus(v.status);
    setIsEditVaccineModalOpen(true);
  };

  const handleEditVaccineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVaccineId) return;
    await updateVaccineSchedule(editingVaccineId, {
      vaccineName: editVaccineName,
      batchId: editVaccineBatchId,
      scheduledDate: editVaccineDate,
      status: editVaccineStatus
    });
    setIsEditVaccineModalOpen(false);
  };

  // Edit Medical Record States
  const [isEditMedicalModalOpen, setIsEditMedicalModalOpen] = useState(false);
  const [editingMedicalId, setEditingMedicalId] = useState('');
  const [editMedicalDate, setEditMedicalDate] = useState('');
  const [editMedicalBatchId, setEditMedicalBatchId] = useState('');
  const [editDisease, setEditDisease] = useState('');
  const [editMedicine, setEditMedicine] = useState('');
  const [editDosage, setEditDosage] = useState('');
  const [editMedicalCost, setEditMedicalCost] = useState<number>(0);

  const handleOpenEditMedical = (m: any) => {
    setEditingMedicalId(m.id);
    setEditMedicalDate(m.date);
    setEditMedicalBatchId(m.batchId);
    setEditDisease(m.disease);
    setEditMedicine(m.medicine);
    setEditDosage(m.dosage);
    setEditMedicalCost(m.cost);
    setIsEditMedicalModalOpen(true);
  };

  const handleEditMedicalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedicalId) return;
    await updateMedicalRecord(editingMedicalId, {
      date: editMedicalDate,
      batchId: editMedicalBatchId,
      disease: editDisease,
      medicine: editMedicine,
      dosage: editDosage,
      cost: Number(editMedicalCost)
    });
    setIsEditMedicalModalOpen(false);
  };

  // Edit Mortality Record States
  const [isEditMortalityModalOpen, setIsEditMortalityModalOpen] = useState(false);
  const [editMortalityId, setEditMortalityId] = useState('');
  const [editMortalityBatchId, setEditMortalityBatchId] = useState('');
  const [editMortalityOldQty, setEditMortalityOldQty] = useState<number>(0);
  const [editMortalityNewQty, setEditMortalityNewQty] = useState<number>(0);
  const [editMortalityReason, setEditMortalityReason] = useState('');
  const [editMortalityDate, setEditMortalityDate] = useState('');

  const handleOpenEditMortality = (log: any) => {
    setEditMortalityId(log.id);
    setEditMortalityBatchId(log.batchId);
    setEditMortalityOldQty(log.quantity);
    setEditMortalityNewQty(log.quantity);
    setEditMortalityReason(log.reason);
    setEditMortalityDate(log.date);
    setIsEditMortalityModalOpen(true);
  };

  const handleEditMortalitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMortalityId || !editMortalityBatchId) return;
    await updateMortalityLog(
      editMortalityId,
      editMortalityBatchId,
      editMortalityOldQty,
      Number(editMortalityNewQty),
      editMortalityReason,
      editMortalityDate
    );
    setIsEditMortalityModalOpen(false);
  };

  const [vaccineName, setVaccineName] = useState('Newcastle Disease');
  const [vaccineBatchId, setVaccineBatchId] = useState('');
  const [vaccineDate, setVaccineDate] = useState(new Date().toISOString().split('T')[0]);

  const [medicalDate, setMedicalDate] = useState(new Date().toISOString().split('T')[0]);
  const [medicalBatchId, setMedicalBatchId] = useState('');
  const [disease, setDisease] = useState('');
  const [medicine, setMedicine] = useState('');
  const [dosage, setDosage] = useState('');
  const [medicalCost, setMedicalCost] = useState<number>(0);

  const handleVaccineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaccineBatchId) return;

    const vaccinePayload = { vaccineName, batchId: vaccineBatchId, scheduledDate: vaccineDate };

    if (!isAdmin) {
      submitForApproval('VaccineSchedule', vaccinePayload);
      alert('✅ Vaccine schedule event submitted! It is now pending Admin approval.');
    } else {
      addVaccineSchedule(vaccinePayload);
    }

    setVaccineName('Newcastle Disease');
    setVaccineBatchId('');
    setIsVaccineModalOpen(false);
  };

  const handleMedicalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicalBatchId || !disease || !medicine) return;

    const medicalPayload = {
      date: medicalDate,
      batchId: medicalBatchId,
      disease,
      medicine,
      dosage,
      cost: Number(medicalCost)
    };

    if (!isAdmin) {
      submitForApproval('MedicalRecord', medicalPayload);
      alert('✅ Medical record submitted! It is now pending Admin approval.');
    } else {
      addMedicalRecord(medicalPayload);
    }

    setMedicalBatchId('');
    setDisease('');
    setMedicine('');
    setDosage('');
    setMedicalCost(0);
    setIsMedicalModalOpen(false);
  };

  const activeBatches = batches.filter(b => b.status === 'Active');

  const pendingVaccines = vaccines.filter(v => v.status === 'Pending').length;
  const completedVaccines = vaccines.filter(v => v.status === 'Completed').length;
  const totalMedCost = medicalRecords.reduce((s, m) => s + m.cost, 0);

  return (
    <div className="health-mgmt-page animate-fade-in">

      {/* ── Summary Stats ── */}
      <div className="health-stats-row">
        <div className="health-stat-card">
          <span className="health-stat-icon">💉</span>
          <div>
            <div className="health-stat-value">{vaccines.length}</div>
            <div className="health-stat-label">Total Vaccines</div>
          </div>
        </div>
        <div className="health-stat-card stat-warning">
          <span className="health-stat-icon">⏳</span>
          <div>
            <div className="health-stat-value">{pendingVaccines}</div>
            <div className="health-stat-label">Pending</div>
          </div>
        </div>
        <div className="health-stat-card stat-success">
          <span className="health-stat-icon">✅</span>
          <div>
            <div className="health-stat-value">{completedVaccines}</div>
            <div className="health-stat-label">Completed</div>
          </div>
        </div>
        <div className="health-stat-card">
          <span className="health-stat-icon">💊</span>
          <div>
            <div className="health-stat-value">Rs {totalMedCost.toFixed(2)}</div>
            <div className="health-stat-label">Medical Spend</div>
          </div>
        </div>
      </div>

      {/* ── Tab Bar + Action Buttons ── */}
      <div className="page-header-actions">
        <div className="filter-tabs">
          <button className={`tab-btn ${subTab === 'vaccines' ? 'active' : ''}`} onClick={() => setSubTab('vaccines')}>
            💉 Vaccination Schedule
          </button>
          <button className={`tab-btn ${subTab === 'medical' ? 'active' : ''}`} onClick={() => setSubTab('medical')}>
            💊 Medical Records
          </button>
          <button className={`tab-btn ${subTab === 'mortality' ? 'active' : ''}`} onClick={() => setSubTab('mortality')}>
            💀 Mortality Records
          </button>
        </div>
        <div className="action-buttons-group">
          {subTab === 'vaccines' && (
            <button className="btn btn-primary" onClick={() => setIsVaccineModalOpen(true)}>
              📅 Schedule Vaccine
            </button>
          )}
          {subTab === 'medical' && (
            <button className="btn btn-primary" onClick={() => setIsMedicalModalOpen(true)}>
              🩺 Add Medical Record
            </button>
          )}
        </div>
      </div>

      {/* ── Vaccines Tab ── */}
      {subTab === 'vaccines' && (
        <div className="glass-card">
          <div className="hm-card-header">
            <div>
              <h3>Immunization Log & Planner</h3>
              <p className="chart-subtitle">Preventative vaccine schedules per bird batch</p>
            </div>
            {pendingVaccines > 0 && (
              <div className="pending-alert-pill">
                ⏳ {pendingVaccines} vaccine{pendingVaccines > 1 ? 's' : ''} pending
              </div>
            )}
          </div>

          {vaccines.length === 0 ? (
            <div className="hm-empty-state">
              <div className="hm-empty-icon">💉</div>
              <p>No vaccine schedules yet.</p>
              <button className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={() => setIsVaccineModalOpen(true)}>
                📅 Schedule First Vaccine
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Vaccine Name</th>
                    <th>Batch ID</th>
                    <th>Scheduled Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...vaccines].sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate)).map(v => (
                    <tr key={v.id} className={v.status === 'Completed' ? 'row-completed' : ''}>
                      <td><strong>💉 {v.vaccineName}</strong></td>
                      <td><span className="batch-badge">{v.batchId}</span></td>
                      <td>{v.scheduledDate}</td>
                      <td>
                        <span className={`hm-status-pill ${v.status === 'Completed' ? 'status-done' : 'status-pending'}`}>
                          {v.status === 'Completed' ? '✅ Completed' : '⏳ Pending'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          {v.status === 'Pending' ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-xs-custom"
                              onClick={() => handleStatusAction(v, 'Completed')}
                            >
                              ✓ Mark Done
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs-custom"
                              onClick={() => handleStatusAction(v, 'Pending')}
                            >
                              ↺ Revert
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs-custom"
                              onClick={() => handleInitiateEditVaccine(v)}
                            >
                              ✏️ Edit
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
      )}

      {/* ── Medical Records Tab ── */}
      {subTab === 'medical' && (
        <div className="glass-card">
          <div className="hm-card-header">
            <div>
              <h3>Medical Record & Treatment Log</h3>
              <p className="chart-subtitle">{medicalRecords.length} treatments · Rs {totalMedCost.toFixed(2)} total spent</p>
            </div>
          </div>

          {medicalRecords.length === 0 ? (
            <div className="hm-empty-state">
              <div className="hm-empty-icon">🐔</div>
              <p>No diseases logged. Healthy flock!</p>
              <button className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={() => setIsMedicalModalOpen(true)}>
                🩺 Add First Record
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Batch ID</th>
                    <th>Disease</th>
                    <th>Medicine</th>
                    <th>Dosage</th>
                    <th>Cost</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...medicalRecords].sort((a, b) => b.date.localeCompare(a.date)).map(m => (
                    <tr key={m.id}>
                      <td>{m.date}</td>
                      <td><span className="batch-badge">{m.batchId}</span></td>
                      <td><span className="disease-tag">🦠 {m.disease}</span></td>
                      <td><span className="medicine-tag">💊 {m.medicine}</span></td>
                      <td className="dosage-cell">{m.dosage}</td>
                      <td><strong className="cost-highlight">Rs {m.cost.toFixed(2)}</strong></td>
                      <td>
                        {isAdmin ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs-custom"
                            onClick={() => handleOpenEditMedical(m)}
                          >
                            ✏️ Edit
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Mortality Tab ── */}
      {subTab === 'mortality' && (() => {
        const soldBatches = batches.filter(b => b.status === 'Sold');
        soldBatches.sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime());

        const totalDeadInactive = soldBatches.reduce((sum, b) => sum + b.mortalityLogs.reduce((s, m) => s + m.quantity, 0), 0);
        const totalInitialInactive = soldBatches.reduce((sum, b) => sum + b.initialQuantity, 0);
        const avgMortalityRate = totalInitialInactive > 0 ? ((totalDeadInactive / totalInitialInactive) * 100).toFixed(1) : '0.0';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Archived Batches Card */}
            <div className="glass-card">
              <div className="hm-card-header">
                <div>
                  <h3>Archived Bird Batches</h3>
                  <p className="chart-subtitle">Historical sold/closed batches and their mortality overview</p>
                </div>
              </div>

              {soldBatches.length === 0 ? (
                <div className="hm-empty-state">
                  <div className="hm-empty-icon">📦</div>
                  <p>No archived batches found.</p>
                </div>
              ) : (
                <>
                  {/* Mortality Summary Bar */}
                  <div className="sold-summary-bar" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>📦 Archived Batches</span>
                      <span style={{ fontSize: '1.35rem', fontWeight: 800 }}>{soldBatches.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>💀 Total Mortality</span>
                      <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-rose)' }}>{totalDeadInactive.toLocaleString()} birds</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>📈 Avg. Mortality Rate</span>
                      <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-amber)' }}>{avgMortalityRate}%</span>
                    </div>
                  </div>

                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Batch ID</th>
                          <th>Type</th>
                          <th>Arrival Date</th>
                          <th>Initial Birds</th>
                          <th>Mortality (💀 count)</th>
                          <th>Sold / Disposed</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {soldBatches.map(batch => {
                          const totalDead = batch.mortalityLogs.reduce((sum, m) => sum + m.quantity, 0);
                          const totalSold = batch.initialQuantity - totalDead;

                          return (
                            <tr key={batch.id}>
                              <td><span className="batch-badge">{batch.id}</span></td>
                              <td>
                                <span className={`badge ${batch.type === 'Broiler' ? 'badge-amber' : 'badge-emerald'}`}>
                                  {batch.type}
                                </span>
                              </td>
                              <td>{batch.arrivalDate}</td>
                              <td>{batch.initialQuantity.toLocaleString()}</td>
                              <td>
                                {totalDead > 0 ? (
                                  <span className="cost-highlight">💀 {totalDead}</span>
                                ) : '0'}
                              </td>
                              <td><strong>{totalSold.toLocaleString()} birds</strong></td>
                              <td>
                                <span className="badge badge-secondary" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                                  Archived
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Mortality Audit Logs Card */}
            <div className="glass-card">
              <div className="hm-card-header">
                <div>
                  <h3>Mortality Audit Records</h3>
                  <p className="chart-subtitle">Historical death logs for track analysis</p>
                </div>
              </div>

              {batches.flatMap(b => b.mortalityLogs).length === 0 ? (
                <div className="hm-empty-state">
                  <div className="hm-empty-icon">🛡️</div>
                  <p>No mortality audits logged. Healthy flock!</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Batch ID</th>
                        <th>Log Date</th>
                        <th>Quantity</th>
                        <th>Reason</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches
                        .flatMap(b => b.mortalityLogs.map(m => ({ batchId: b.id, ...m })))
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((log) => (
                          <tr key={log.id}>
                            <td><span className="batch-badge">{log.batchId}</span></td>
                            <td>{log.date}</td>
                            <td><span className="cost-highlight">💀 {log.quantity} birds</span></td>
                            <td>{log.reason}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs-custom"
                                onClick={() => handleOpenEditMortality(log)}
                              >
                                ✏️ Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Vaccine Modal ── */}
      <Modal
        isOpen={isVaccineModalOpen}
        onClose={() => setIsVaccineModalOpen(false)}
        title="💉 Schedule Vaccination Event"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsVaccineModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleVaccineSubmit}>Schedule</button>
          </>
        }
      >
        <form onSubmit={handleVaccineSubmit} className="hm-modal-form">
          <div className="form-group">
            <label className="form-label">Vaccine / Disease Target</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Fowl Pox, Newcastle Lasota"
              value={vaccineName}
              onChange={e => setVaccineName(e.target.value)}
              maxLength={128}
              required
            />
          </div>
          <div className="hm-form-row">
            <div className="form-group">
              <label className="form-label">Target Batch</label>
              <select className="form-control" value={vaccineBatchId} onChange={e => setVaccineBatchId(e.target.value)} required>
                <option value="">Select active batch...</option>
                {activeBatches.map(b => (
                  <option key={b.id} value={b.id}>{b.id} ({b.type} · {b.currentQuantity} birds)</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Scheduled Date</label>
              <input type="date" className="form-control" value={vaccineDate} onChange={e => setVaccineDate(e.target.value)} required />
            </div>
          </div>
          {vaccineBatchId && (
            <div className="hm-info-pill">
              📋 Scheduling <strong>{vaccineName}</strong> for batch <strong>{vaccineBatchId}</strong>
            </div>
          )}
        </form>
      </Modal>

      {/* ── Medical Record Modal ── */}
      <Modal
        isOpen={isMedicalModalOpen}
        onClose={() => setIsMedicalModalOpen(false)}
        title="🩺 Add Medical Record & Remedy"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsMedicalModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleMedicalSubmit}>Log Remedy</button>
          </>
        }
      >
        <form onSubmit={handleMedicalSubmit} className="hm-modal-form">
          <div className="hm-form-row">
            <div className="form-group">
              <label className="form-label">Treatment Date</label>
              <input type="date" className="form-control" value={medicalDate} onChange={e => setMedicalDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Target Batch</label>
              <select className="form-control" value={medicalBatchId} onChange={e => setMedicalBatchId(e.target.value)} required>
                <option value="">Select batch...</option>
                {activeBatches.map(b => (
                  <option key={b.id} value={b.id}>{b.id} ({b.type} · {b.currentQuantity} birds)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Disease Diagnosed</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Coccidiosis, Coryza, Bird Flu symptoms"
              value={disease}
              onChange={e => setDisease(e.target.value)}
              maxLength={128}
              required
            />
          </div>

          <div className="hm-form-row">
            <div className="form-group">
              <label className="form-label">Medicine / Remedy</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Amprolium, Tylosin"
                value={medicine}
                onChange={e => setMedicine(e.target.value)}
                maxLength={128}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Treatment Cost (Rs)</label>
              <input placeholder="100" type="number"
                step="0.01"
                min="0"
                className="form-control"
                value={medicalCost === 0 ? '' : medicalCost}
                onChange={e => setMedicalCost(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Dosage & Administration</label>
            <textarea
              className="form-control"
              placeholder="e.g. 5g per gallon of drinking water for 3 days"
              rows={2}
              value={dosage}
              onChange={e => setDosage(e.target.value)}
              maxLength={256}
              required
              style={{ resize: 'vertical' }}
            />
          </div>
        </form>
      </Modal>

      {/* ── Edit Vaccine Modal ── */}
      <Modal
        isOpen={isEditVaccineModalOpen}
        onClose={() => setIsEditVaccineModalOpen(false)}
        title="✏️ Edit Vaccine Event"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete the vaccine schedule for "${editVaccineName}"?`)) {
                  deleteVaccineSchedule(editingVaccineId);
                  setIsEditVaccineModalOpen(false);
                }
              }}
            >
              🗑️ Delete Schedule
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditVaccineModalOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleEditVaccineSubmit}>Save Changes</button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleEditVaccineSubmit} className="hm-modal-form">
          <div className="form-group">
            <label className="form-label">Vaccine / Disease Target</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Fowl Pox, Newcastle Lasota"
              value={editVaccineName}
              onChange={e => setEditVaccineName(e.target.value)}
              maxLength={128}
              required
            />
          </div>
          <div className="hm-form-row">
            <div className="form-group">
              <label className="form-label">Target Batch</label>
              <select className="form-control" value={editVaccineBatchId} onChange={e => setEditVaccineBatchId(e.target.value)} required>
                <option value="">Select active batch...</option>
                {activeBatches.map(b => (
                  <option key={b.id} value={b.id}>{b.id} ({b.type} · {b.currentQuantity} birds)</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Scheduled Date</label>
              <input type="date" className="form-control" value={editVaccineDate} onChange={e => setEditVaccineDate(e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={editVaccineStatus} onChange={e => setEditVaccineStatus(e.target.value as any)}>
              <option value="Pending">⏳ Pending</option>
              <option value="Completed">✅ Completed</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* ── Edit Medical Record Modal ── */}
      <Modal
        isOpen={isEditMedicalModalOpen}
        onClose={() => setIsEditMedicalModalOpen(false)}
        title="✏️ Edit Medical Record & Remedy"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this medical record?')) {
                  deleteMedicalRecord(editingMedicalId);
                  setIsEditMedicalModalOpen(false);
                }
              }}
            >
              🗑️ Delete Record
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditMedicalModalOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleEditMedicalSubmit}>Save Changes</button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleEditMedicalSubmit} className="hm-modal-form">
          <div className="hm-form-row">
            <div className="form-group">
              <label className="form-label">Treatment Date</label>
              <input type="date" className="form-control" value={editMedicalDate} onChange={e => setEditMedicalDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Target Batch</label>
              <select className="form-control" value={editMedicalBatchId} onChange={e => setEditMedicalBatchId(e.target.value)} required>
                <option value="">Select batch...</option>
                {activeBatches.map(b => (
                  <option key={b.id} value={b.id}>{b.id} ({b.type} · {b.currentQuantity} birds)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Disease Diagnosed</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Coccidiosis, Coryza, Bird Flu symptoms"
              value={editDisease}
              onChange={e => setEditDisease(e.target.value)}
              maxLength={128}
              required
            />
          </div>

          <div className="hm-form-row">
            <div className="form-group">
              <label className="form-label">Medicine / Remedy</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Amprolium, Tylosin"
                value={editMedicine}
                onChange={e => setEditMedicine(e.target.value)}
                maxLength={128}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Treatment Cost (Rs)</label>
              <input type="number"
                step="0.01"
                min="0"
                className="form-control"
                value={editMedicalCost === 0 ? '' : editMedicalCost}
                onChange={e => setEditMedicalCost(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Dosage & Administration</label>
            <textarea
              className="form-control"
              placeholder="e.g. 5g per gallon of drinking water for 3 days"
              rows={2}
              value={editDosage}
              onChange={e => setEditDosage(e.target.value)}
              maxLength={256}
              required
              style={{ resize: 'vertical' }}
            />
          </div>
        </form>
      </Modal>

      {/* ── Edit Mortality Audit Record Modal ── */}
      <Modal
        isOpen={isEditMortalityModalOpen}
        onClose={() => setIsEditMortalityModalOpen(false)}
        title={`Edit Mortality Record: Batch ${editMortalityBatchId}`}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-danger"
              onClick={async () => {
                if (window.confirm(`Are you sure you want to delete this mortality record (${editMortalityOldQty} birds)? This will restore ${editMortalityOldQty} birds back to Batch ${editMortalityBatchId}.`)) {
                  await deleteMortalityLog(editMortalityId, editMortalityBatchId, editMortalityOldQty);
                  setIsEditMortalityModalOpen(false);
                }
              }}
            >
              🗑️ Delete Record
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditMortalityModalOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleEditMortalitySubmit}>Save Record Changes</button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleEditMortalitySubmit} className="hm-modal-form">
          <div className="form-group">
            <label className="form-label">Batch Reference</label>
            <input
              type="text"
              className="form-control"
              value={editMortalityBatchId}
              disabled
            />
          </div>

          <div className="hm-form-row">
            <div className="form-group">
              <label className="form-label">Date of Event</label>
              <input
                type="date"
                className="form-control"
                value={editMortalityDate}
                onChange={e => setEditMortalityDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity Lost (Birds)</label>
              <input type="number"
                min="1"
                className="form-control"
                value={editMortalityNewQty === 0 ? '' : editMortalityNewQty}
                onChange={e => setEditMortalityNewQty(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Diagnosis</label>
            <textarea
              className="form-control"
              rows={3}
              value={editMortalityReason}
              onChange={e => setEditMortalityReason(e.target.value)}
              maxLength={500}
              required
              style={{ resize: 'vertical' }}
            />
          </div>
        </form>
      </Modal>

      {/* ── Admin Password Approval Modal for Editing Vaccine Event ── */}
      <Modal
        isOpen={isAdminAuthModalOpen}
        onClose={() => {
          setIsAdminAuthModalOpen(false);
          setPendingEditVaccine(null);
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
                setPendingEditVaccine(null);
                setAdminPasswordInput('');
                setAdminAuthError('');
              }}
            >
              Cancel
            </button>
            <button className="btn btn-success" type="button" onClick={handleVerifyAdminAndExecute}>
              🔑 Verify & Open Editor
            </button>
          </div>
        }
      >
        <form onSubmit={handleVerifyAdminAndExecute} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              🔒 Admin Password Required
            </p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Editing a vaccination schedule event requires administrator verification.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Admin Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter Admin Password"
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
        .health-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }
        @media (max-width: 900px) { .health-stats-row { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px)  { .health-stats-row { grid-template-columns: 1fr; } }

        .health-stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: var(--spacing-md) var(--spacing-lg);
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          backdrop-filter: var(--glass-blur);
          transition: border-color var(--transition-fast), transform var(--transition-fast);
        }
        .health-stat-card:hover { border-color: var(--border-color-hover); transform: translateY(-2px); }
        .health-stat-card.stat-warning { border-color: rgba(245,158,11,0.25); }
        .health-stat-card.stat-success { border-color: rgba(16,185,129,0.25); }
        .health-stat-icon { font-size: 1.75rem; }
        .health-stat-value { font-size: 1.35rem; font-weight: 700; color: var(--text-primary); }
        .health-stat-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 0.1rem; }

        .page-header-actions {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: var(--spacing-lg); gap: var(--spacing-md); flex-wrap: wrap;
        }
        .filter-tabs {
          display: flex; gap: var(--spacing-sm);
          background: rgba(22,31,48,0.4); padding: 0.25rem;
          border-radius: var(--radius-md); border: 1px solid var(--border-color); flex-wrap: wrap;
        }
        .tab-btn {
          background: none; border: none; color: var(--text-secondary);
          padding: 0.5rem 1rem; border-radius: var(--radius-sm); cursor: pointer;
          font-family: var(--font-family); font-weight: 600; font-size: 0.85rem;
          transition: all var(--transition-fast); white-space: nowrap;
        }
        .tab-btn.active { background: rgba(255,255,255,0.08); color: var(--text-primary); }
        .action-buttons-group { display: flex; gap: var(--spacing-sm); }

        .hm-card-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: var(--spacing-lg); gap: var(--spacing-md);
        }
        .hm-card-header h3 { margin: 0 0 0.25rem; }

        .pending-alert-pill {
          background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.25);
          color: var(--color-amber); border-radius: 999px; padding: 0.35rem 0.85rem;
          font-size: 0.78rem; font-weight: 600; white-space: nowrap;
        }

        .hm-status-pill {
          font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.65rem;
          border-radius: 999px; display: inline-block;
        }
        .status-done    { background: rgba(16,185,129,0.12); color: var(--color-emerald); }
        .status-pending { background: rgba(245,158,11,0.12); color: var(--color-amber); }

        .row-completed td { opacity: 0.6; }

        .btn-xs-custom { padding: 0.3rem 0.65rem; font-size: 0.72rem; font-weight: 600; border-radius: var(--radius-sm); }

        .disease-tag  { color: #fca5a5; font-weight: 500; }
        .medicine-tag { color: var(--color-cyan); font-size: 0.85rem; }
        .dosage-cell  { max-width: 200px; font-size: 0.8rem; color: var(--text-secondary); }
        .cost-highlight { color: var(--color-rose); }

        .batch-badge {
          background: rgba(255,255,255,0.05); border: 1px solid var(--border-color);
          padding: 0.2rem 0.5rem; border-radius: var(--radius-sm);
          font-weight: 700; font-family: monospace; font-size: 0.85rem;
        }

        .hm-empty-state { text-align: center; padding: var(--spacing-xl) 0; color: var(--text-muted); }
        .hm-empty-icon  { font-size: 2.5rem; margin-bottom: 0.5rem; }

        .hm-modal-form { display: flex; flex-direction: column; gap: var(--spacing-md); }
        .hm-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
        @media (max-width: 480px) { .hm-form-row { grid-template-columns: 1fr; } }

        .hm-info-pill {
          background: rgba(6,182,212,0.07); border: 1px solid rgba(6,182,212,0.2);
          border-radius: var(--radius-sm); padding: 0.5rem 0.85rem;
          font-size: 0.82rem; color: var(--text-secondary);
        }
        .hm-info-pill strong { color: var(--color-cyan); }
      `}</style>
    </div>
  );
};

