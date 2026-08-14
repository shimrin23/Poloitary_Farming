import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import type { BirdType } from '../context/FarmContext';
import { Modal } from '../components/Modal';

export const BirdMgmt: React.FC = () => {
  const {
    batches,
    usersList,
    addBatch,
    logMortality,
    updateMortalityLog,
    deleteMortalityLog,
    deleteBatch,
    sellBatch,
    sales,
    updateBatch,
    currentUser,
    submitForApproval
  } = useFarm();
  const isAdmin = currentUser?.role === 'Admin';

  // Admin Verification for Selling Bird Batches
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [pendingSellBatchId, setPendingSellBatchId] = useState<string | null>(null);

  const handleInitiateSell = (batchId?: string) => {
    setPendingSellBatchId(batchId || '');
    setAdminPasswordInput('');
    setAdminAuthError('');
    setIsAdminAuthModalOpen(true);
  };

  const handleVerifyAdminAndExecute = async (ev?: React.FormEvent) => {
    if (ev) ev.preventDefault();

    const adminUser = usersList.find(u => u.role === 'Admin');
    const isPasswordCorrect = adminUser 
      ? adminUser.password === adminPasswordInput 
      : (adminPasswordInput === 'admin' || adminPasswordInput === '2001-02-23');

    if (!isPasswordCorrect) {
      setAdminAuthError('❌ Incorrect Admin Password. Access denied.');
      return;
    }

    setSellBatchId(pendingSellBatchId || '');
    setSellQty(0);
    setSellUnitPrice(0);
    setSellWeightKg(0);
    setSellPricePerKg(0);
    setSellCustomer('');
    setSellContact('');
    setAdditionalCharges([]);
    setIsSellModalOpen(true);

    setIsAdminAuthModalOpen(false);
    setPendingSellBatchId(null);
    setAdminPasswordInput('');
    setAdminAuthError('');
  };

  // Tab Filter ('All' | 'Broiler' | 'Layer' | 'Archived' | 'MortalityAudit')
  const [filter, setFilter] = useState<'All' | 'Broiler' | 'Layer' | 'Archived' | 'MortalityAudit'>('All');

  // Modals Open State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isMortalityModalOpen, setIsMortalityModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditMortalityModalOpen, setIsEditMortalityModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  // Form Fields - Add Batch
  const [newBatchId, setNewBatchId] = useState('');
  const [newType, setNewType] = useState<BirdType>('Broiler');
  const [newArrivalDate, setNewArrivalDate] = useState(new Date().toISOString().split('T')[0]);
  const [newQty, setNewQty] = useState<number>(0);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newQtyKg, setNewQtyKg] = useState<number>(0);
  const [newPricePerKg, setNewPricePerKg] = useState<number>(0);

  // Form Fields - Edit Batch
  const [editingBatchId, setEditingBatchId] = useState('');
  const [editType, setEditType] = useState<BirdType>('Broiler');
  const [editArrivalDate, setEditArrivalDate] = useState('');
  const [editInitialQty, setEditInitialQty] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editQtyKg, setEditQtyKg] = useState<number>(0);
  const [editPricePerKg, setEditPricePerKg] = useState<number>(0);

  // Form Fields - Edit Mortality Audit
  const [editMortalityId, setEditMortalityId] = useState('');
  const [editMortalityBatchId, setEditMortalityBatchId] = useState('');
  const [editMortalityOldQty, setEditMortalityOldQty] = useState<number>(0);
  const [editMortalityNewQty, setEditMortalityNewQty] = useState<number>(0);
  const [editMortalityReason, setEditMortalityReason] = useState('');
  const [editMortalityDate, setEditMortalityDate] = useState('');

  const handleOpenEdit = (batch: any) => {
    setEditingBatchId(batch.id);
    setEditType(batch.type);
    setEditArrivalDate(batch.arrivalDate);
    setEditInitialQty(batch.initialQuantity);
    setEditPrice(batch.purchasePrice);
    setEditQtyKg(batch.initialQuantityKg || 0);
    setEditPricePerKg(batch.purchasePricePerKg || 0);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatchId) return;
    const batch = batches.find(b => b.id === editingBatchId);
    const oldInitial = batch ? batch.initialQuantity : Number(editInitialQty);
    const oldCurrent = batch ? batch.currentQuantity : Number(editInitialQty);
    const diff = Number(editInitialQty) - oldInitial;
    const newCurrent = Math.max(0, oldCurrent + diff);
    const newStatus = newCurrent === 0 ? 'Sold' : 'Active';

    const calculatedPrice = editType === 'Broiler' && editInitialQty
      ? (Number(editQtyKg) * Number(editPricePerKg)) / Number(editInitialQty)
      : Number(editPrice);

    await updateBatch(editingBatchId, {
      type: editType,
      arrivalDate: editArrivalDate,
      initialQuantity: Number(editInitialQty),
      currentQuantity: newCurrent,
      purchasePrice: calculatedPrice,
      status: newStatus,
      initialQuantityKg: editType === 'Broiler' ? Number(editQtyKg) : undefined,
      purchasePricePerKg: editType === 'Broiler' ? Number(editPricePerKg) : undefined
    });
    setIsEditModalOpen(false);
  };

  const handleOpenEditMortality = (log: any, batchId: string) => {
    setEditMortalityId(log.id);
    setEditMortalityBatchId(batchId);
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

  const handleDeleteMortality = async (id: string, batchId: string, qty: number) => {
    if (window.confirm(`Are you sure you want to delete this mortality record (${qty} birds)? This will restore ${qty} birds back to Batch ${batchId}.`)) {
      await deleteMortalityLog(id, batchId, qty);
    }
  };

  // Form Fields - Sell Batch
  const [sellBatchId, setSellBatchId] = useState('');
  const [sellQty, setSellQty] = useState<number>(0);
  const [sellUnitPrice, setSellUnitPrice] = useState<number>(0);
  const [sellWeightKg, setSellWeightKg] = useState<number>(0);
  const [sellPricePerKg, setSellPricePerKg] = useState<number>(0);
  const [sellCustomer, setSellCustomer] = useState('');
  const [sellContact, setSellContact] = useState('');
  const [sellAmountPaid, setSellAmountPaid] = useState<number>(0);
  const [isSellAmountPaidCustom, setIsSellAmountPaidCustom] = useState<boolean>(false);
  const [_sellTransport] = useState<number>(0);
  const [_sellOther] = useState<number>(0);

  // Dynamic Additional Charges for Bird Sale
  const [additionalCharges, setAdditionalCharges] = useState<{ id: string; name: string; amount: number }[]>([]);

  const handleAddCharge = () => {
    setAdditionalCharges(prev => [
      ...prev,
      { id: `chg-${Date.now()}`, name: '', amount: 0 }
    ]);
  };

  const handleUpdateCharge = (id: string, field: 'name' | 'amount', value: any) => {
    setAdditionalCharges(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleRemoveCharge = (id: string) => {
    setAdditionalCharges(prev => prev.filter(c => c.id !== id));
  };

  // Form Fields - Log Mortality
  const [mortalityQty, setMortalityQty] = useState<number>(0);
  const [mortalityReason, setMortalityReason] = useState('');
  const [mortalityDate, setMortalityDate] = useState(new Date().toISOString().split('T')[0]);

  // Utility to calculate bird age in days
  const calculateAgeDays = (arrivalDateStr: string): number => {
    const arrival = new Date(arrivalDateStr);
    const today = new Date();
    const diffMs = today.getTime() - arrival.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchId.trim()) return;

    const calculatedPrice = newType === 'Broiler' && newQty
      ? (Number(newQtyKg) * Number(newPricePerKg)) / Number(newQty)
      : Number(newPrice);

    const batchPayload = {
      id: newBatchId.toUpperCase(),
      type: newType,
      arrivalDate: newArrivalDate,
      initialQuantity: Number(newQty),
      purchasePrice: calculatedPrice,
      initialQuantityKg: newType === 'Broiler' ? Number(newQtyKg) : undefined,
      purchasePricePerKg: newType === 'Broiler' ? Number(newPricePerKg) : undefined
    };

    if (!isAdmin) {
      submitForApproval('BirdBatch', batchPayload);
      alert('✅ Bird Batch registration submitted! It is now pending Admin approval.');
    } else {
      addBatch(batchPayload);
    }

    // Reset and Close
    setNewBatchId('');
    setNewQty(0);
    setNewPrice(0);
    setNewQtyKg(0);
    setNewPricePerKg(0);
    setIsAddModalOpen(false);
  };

  const handleMortalitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) {
      alert("Please select a batch first.");
      return;
    }

    const mortalityPayload = {
      batchId: selectedBatchId,
      quantity: Number(mortalityQty),
      reason: mortalityReason,
      date: mortalityDate
    };

    if (!isAdmin) {
      submitForApproval('Mortality', mortalityPayload);
      alert('✅ Mortality log submitted! It is now pending Admin approval.');
    } else {
      logMortality(selectedBatchId, Number(mortalityQty), mortalityReason, mortalityDate);
    }

    // Reset and Close
    setMortalityQty(0);
    setMortalityReason('');
    setIsMortalityModalOpen(false);
  };

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellBatchId || !sellCustomer.trim() || sellQty <= 0) return;
    const batch = batches.find(b => b.id === sellBatchId);
    if (batch && batch.currentQuantity < sellQty) {
      alert(`Insufficient birds. Only ${batch?.currentQuantity ?? 0} remaining in Batch ${sellBatchId}.`);
      return;
    }

    const isBroiler = batch?.type === 'Broiler';
    const subtotal = isBroiler
      ? Number(sellWeightKg) * Number(sellPricePerKg)
      : Number(sellQty) * Number(sellUnitPrice);

    const computedTransport = additionalCharges
      .filter(c => c.name.toLowerCase().includes('transport') || c.name.toLowerCase().includes('freight'))
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const computedOther = additionalCharges
      .filter(c => !c.name.toLowerCase().includes('transport') && !c.name.toLowerCase().includes('freight'))
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const computedTotal = subtotal + computedTransport + computedOther;
    const finalPaid = isSellAmountPaidCustom ? sellAmountPaid : computedTotal;

    sellBatch(
      sellBatchId,
      sellQty,
      isBroiler ? subtotal / sellQty : sellUnitPrice,
      sellCustomer,
      sellContact,
      isBroiler ? sellWeightKg : undefined,
      isBroiler ? sellPricePerKg : undefined,
      subtotal,
      finalPaid,
      computedTransport,
      computedOther,
      customerOldBalance
    );

    // Reset and Close
    setIsSellModalOpen(false);
    setSellBatchId('');
    setSellQty(0);
    setSellUnitPrice(0);
    setSellWeightKg(0);
    setSellPricePerKg(0);
    setSellCustomer('');
    setSellContact('');
    setSellAmountPaid(0);
    setIsSellAmountPaidCustom(false);
    setAdditionalCharges([]);
  };

  // Dynamically compute the customer's outstanding balance
  const customerOldBalance = React.useMemo(() => {
    if (!sellCustomer.trim()) return 0;
    return sales
      .filter(s => s.customerName.trim().toLowerCase() === sellCustomer.trim().toLowerCase())
      .reduce((sum, s) => sum + (s.totalAmount - (s.amountPaid ?? 0)), 0);
  }, [sales, sellCustomer]);

  const activeBatches = batches.filter(b => b.status === 'Active' && b.currentQuantity > 0);
  const archivedBatches = batches.filter(b => b.status === 'Sold' || b.currentQuantity === 0);
  const selectedSellBatch = activeBatches.find(b => b.id === sellBatchId);

  // Active Filtered Batches
  const activeDisplayBatches = filter === 'All'
    ? activeBatches
    : batches.filter(b => b.status === 'Active' && b.type === (filter as any));

  // Flattened Mortality Audit Records across all batches
  const allMortalityAuditLogs = React.useMemo(() => {
    const logsList: Array<{
      id: string;
      batchId: string;
      batchType: BirdType;
      date: string;
      quantity: number;
      reason: string;
    }> = [];

    batches.forEach(b => {
      (b.mortalityLogs || []).forEach(m => {
        logsList.push({
          id: m.id,
          batchId: b.id,
          batchType: b.type,
          date: m.date,
          quantity: m.quantity,
          reason: m.reason
        });
      });
    });

    return logsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [batches]);

  return (
    <div className="bird-mgmt-page animate-fade-in">
      <div className="page-header-actions">
        <div className="filter-tabs">
          <button
            className={`tab-btn ${filter === 'All' ? 'active' : ''}`}
            onClick={() => setFilter('All')}
          >
            📋 All Batches ({activeBatches.length})
          </button>
          <button
            className={`tab-btn ${filter === 'Broiler' ? 'active' : ''}`}
            onClick={() => setFilter('Broiler')}
          >
            🥩 Broiler Batches ({batches.filter(b => b.status === 'Active' && b.type === 'Broiler').length})
          </button>
          <button
            className={`tab-btn ${filter === 'Layer' ? 'active' : ''}`}
            onClick={() => setFilter('Layer')}
          >
            🥚 Layer Batches ({batches.filter(b => b.status === 'Active' && b.type === 'Layer').length})
          </button>
          <button
            className={`tab-btn ${filter === 'Archived' ? 'active' : ''}`}
            onClick={() => setFilter('Archived')}
          >
            📦 Archived / Sold ({archivedBatches.length})
          </button>
          <button
            className={`tab-btn ${filter === 'MortalityAudit' ? 'active' : ''}`}
            onClick={() => setFilter('MortalityAudit')}
          >
            💀 Mortality Audit ({allMortalityAuditLogs.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isAdmin && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => handleInitiateSell()}
              >
                🐔 Sell Bird Batch
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setNewType(filter === 'Layer' ? 'Layer' : 'Broiler');
                  setIsAddModalOpen(true);
                }}
              >
                ➕ Add Bird Batch
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── All Batches / Broiler / Layer Tables ── */}
      {(filter === 'All' || filter === 'Broiler' || filter === 'Layer') && (
        <div className="glass-card table-section">
          {activeDisplayBatches.length === 0 ? (
            <div className="empty-state">
              <p>No active bird batches found for "{filter}". Click "Add Bird Batch" to register a new flock.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Batch ID</th>
                    <th>Type</th>
                    <th>Arrival Date</th>
                    <th>Age (Days)</th>
                    <th>Initial Birds</th>
                    {isAdmin && <th>Weight / Price</th>}
                    <th>Sold Birds</th>
                    <th>Mortality</th>
                    <th>Current Qty</th>
                    {isAdmin && <th>Cost/Bird</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDisplayBatches.map(batch => {
                    const totalDead = batch.mortalityLogs.reduce((sum, m) => sum + m.quantity, 0);
                    const totalSold = sales.filter(s => s.type === 'Bird' && s.batchId === batch.id).reduce((sum, s) => sum + s.quantity, 0);
                    return (
                      <tr key={batch.id}>
                        <td><span className="batch-badge">{batch.id}</span></td>
                        <td>
                          <span className={`role-badge ${batch.type === 'Broiler' ? 'admin' : 'employee'}`}>
                            {batch.type === 'Broiler' ? '🥩 Broiler' : '🥚 Layer'}
                          </span>
                        </td>
                        <td>{batch.arrivalDate}</td>
                        <td><b>{calculateAgeDays(batch.arrivalDate)} days</b></td>
                        <td>{batch.initialQuantity.toLocaleString()}</td>
                        {isAdmin && (
                          <td>
                            {batch.type === 'Broiler' && batch.initialQuantityKg
                              ? `${batch.initialQuantityKg.toLocaleString()} kg @ Rs ${batch.purchasePricePerKg?.toFixed(2)}/kg`
                              : `Rs ${batch.purchasePrice.toFixed(2)} / bird`}
                          </td>
                        )}
                        <td><strong>{totalSold > 0 ? `${totalSold.toLocaleString()} birds` : '0'}</strong></td>
                        <td>{totalDead > 0 ? `💀 ${totalDead}` : '0'}</td>
                        <td><span className="current-qty-active">🐔 {batch.currentQuantity.toLocaleString()}</span></td>
                        {isAdmin && <td>Rs {batch.purchasePrice.toFixed(2)}</td>}
                        <td>
                          <div className="batch-action-group">
                            <button
                              className="btn btn-secondary btn-sm-custom"
                              onClick={() => {
                                setSelectedBatchId(batch.id);
                                setIsMortalityModalOpen(true);
                              }}
                            >
                              ☠️ Death
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  className="btn btn-secondary btn-sm-custom"
                                  style={{ color: 'var(--color-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                                  onClick={() => handleInitiateSell(batch.id)}
                                >
                                  💰 Sell
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm-custom"
                                  onClick={() => handleOpenEdit(batch)}
                                >
                                  ✏️ Edit
                                </button>
                              </>
                            )}
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
      )}

      {/* ── Archived / Sold Batches View ── */}
      {filter === 'Archived' && (
        <div className="glass-card table-section">
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <div>
              <h4>📦 Archived / Completed Batches</h4>
              <p className="subtitle">Historical record of sold and fully cleared bird flocks</p>
            </div>
          </div>

          {archivedBatches.length === 0 ? (
            <div className="empty-state">
              <p>No archived or fully sold batches recorded yet.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Batch ID</th>
                    <th>Type</th>
                    <th>Arrival Date</th>
                    <th>Initial Birds</th>
                    <th>Mortality Lost</th>
                    <th>Total Sold</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedBatches.map(batch => {
                    const totalDead = batch.mortalityLogs.reduce((sum, m) => sum + m.quantity, 0);
                    const totalSold = sales.filter(s => s.type === 'Bird' && s.batchId === batch.id).reduce((sum, s) => sum + s.quantity, 0);
                    return (
                      <tr key={batch.id}>
                        <td><span className="batch-badge">{batch.id}</span></td>
                        <td>
                          <span className={`role-badge ${batch.type === 'Broiler' ? 'admin' : 'employee'}`}>
                            {batch.type === 'Broiler' ? '🥩 Broiler' : '🥚 Layer'}
                          </span>
                        </td>
                        <td>{batch.arrivalDate}</td>
                        <td>{batch.initialQuantity.toLocaleString()}</td>
                        <td><span className="color-rose">💀 {totalDead}</span></td>
                        <td><strong>{totalSold.toLocaleString()} birds</strong></td>
                        <td>
                          <span className="status-dot pending" style={{ background: '#64748b' }}></span> Sold Out / Archived
                        </td>
                        <td>
                          {isAdmin ? (
                            <div className="batch-action-group">
                              <button
                                className="btn btn-secondary btn-sm-custom"
                                onClick={() => handleOpenEdit(batch)}
                                title="Edit Archived Batch Details"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className="btn btn-danger btn-sm-custom"
                                onClick={() => {
                                  if (confirm(`Permanently delete Archived Batch ${batch.id}?`)) {
                                    deleteBatch(batch.id);
                                  }
                                }}
                                title="Delete Archived Batch"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Mortality Audit Records Table View ── */}
      {filter === 'MortalityAudit' && (
        <div className="glass-card table-section">
          <div className="section-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4>💀 Mortality Audit Log Records</h4>
              <p className="subtitle">Audit log of all reported mortality and death records across batches</p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedBatchId('');
                setIsMortalityModalOpen(true);
              }}
            >
              ➕ Log New Death Record
            </button>
          </div>

          {allMortalityAuditLogs.length === 0 ? (
            <div className="empty-state">
              <p>No bird mortality records logged yet.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date of Event</th>
                    <th>Batch ID</th>
                    <th>Bird Type</th>
                    <th>Quantity Lost (Birds)</th>
                    <th>Reason / Diagnosis</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allMortalityAuditLogs.map(log => (
                    <tr key={log.id}>
                      <td><strong>{log.date}</strong></td>
                      <td><span className="batch-badge">{log.batchId}</span></td>
                      <td>
                        <span className={`role-badge ${log.batchType === 'Broiler' ? 'admin' : 'employee'}`}>
                          {log.batchType === 'Broiler' ? 'Broiler' : 'Layer'}
                        </span>
                      </td>
                      <td>
                        <span className="color-rose" style={{ fontWeight: 700 }}>💀 {log.quantity.toLocaleString()} birds</span>
                      </td>
                      <td>{log.reason}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="batch-action-group" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-sm-custom"
                            onClick={() => handleOpenEditMortality(log, log.batchId)}
                            title="Edit Mortality Record"
                          >
                            ✏️ Edit
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
      )}

      {/* 1. Modal Add Batch */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Bird Batch"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddSubmit}>Save Batch</button>
          </>
        }
      >
        <form onSubmit={handleAddSubmit} className="modal-form-grid">
          <div className="form-group">
            <label className="form-label">Batch ID / Reference</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. B-103"
              value={newBatchId}
              onChange={e => setNewBatchId(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bird Type</label>
            <select
              className="form-control"
              value={newType}
              onChange={e => setNewType(e.target.value as BirdType)}
            >
              <option value="Broiler">Broiler (Meat)</option>
              <option value="Layer">Layer (Eggs)</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Arrival Date</label>
              <input
                type="date"
                className="form-control"
                value={newArrivalDate}
                onChange={e => setNewArrivalDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity Arrived</label>
              <input placeholder="1000" type="number"
                min="1"
                className="form-control"
                value={newQty === 0 ? '' : newQty}
                onChange={e => setNewQty(Number(e.target.value))}
                required
              />
            </div>
          </div>

          {newType === 'Broiler' ? (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity Arrived in Kg</label>
                <input placeholder="1000" type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  value={newQtyKg === 0 ? '' : newQtyKg}
                  onChange={e => setNewQtyKg(Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Purchase Price per Kg (Rs)</label>
                <input placeholder="1.2" type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  value={newPricePerKg === 0 ? '' : newPricePerKg}
                  onChange={e => setNewPricePerKg(Number(e.target.value))}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Purchase Price per Bird (Rs)</label>
              <input placeholder="1.2" type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                value={newPrice === 0 ? '' : newPrice}
                onChange={e => setNewPrice(Number(e.target.value))}
                required
              />
            </div>
          )}
        </form>
      </Modal>

      {/* Edit Bird Batch Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Bird Batch: ${editingBatchId}`}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (confirm(`Delete Batch ${editingBatchId}? This will permanently remove the batch, its mortality logs, and the associated purchase expense. This cannot be undone.`)) {
                  deleteBatch(editingBatchId);
                  setIsEditModalOpen(false);
                }
              }}
            >
              🗑️ Delete Batch
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleEditSubmit}>Save Changes</button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleEditSubmit} className="modal-form-grid">
          <div className="form-group">
            <label className="form-label">Batch ID / Reference</label>
            <input
              type="text"
              className="form-control"
              value={editingBatchId}
              disabled
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bird Type</label>
            <select
              className="form-control"
              value={editType}
              onChange={e => setEditType(e.target.value as BirdType)}
            >
              <option value="Broiler">Broiler (Meat)</option>
              <option value="Layer">Layer (Eggs)</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Arrival Date</label>
              <input
                type="date"
                className="form-control"
                value={editArrivalDate}
                onChange={e => setEditArrivalDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Quantity</label>
              <input type="number"
                min="1"
                className="form-control"
                value={editInitialQty === 0 ? '' : editInitialQty}
                onChange={e => setEditInitialQty(Number(e.target.value))}
                required
              />
            </div>
          </div>

          {editType === 'Broiler' ? (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity Arrived in Kg</label>
                <input type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  value={editQtyKg === 0 ? '' : editQtyKg}
                  onChange={e => setEditQtyKg(Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Purchase Price per Kg (Rs)</label>
                <input type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  value={editPricePerKg === 0 ? '' : editPricePerKg}
                  onChange={e => setEditPricePerKg(Number(e.target.value))}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Purchase Price per Bird (Rs)</label>
              <input type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                value={editPrice === 0 ? '' : editPrice}
                onChange={e => setEditPrice(Number(e.target.value))}
                required
              />
            </div>
          )}
        </form>
      </Modal>

      {/* 2. Modal - Sell Bird Batch */}
      <Modal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        title="🐔 Sell Bird Batch"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsSellModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSellSubmit}>Complete Sale</button>
          </>
        }
      >
        <form onSubmit={handleSellSubmit} className="modal-form-grid">
          <div className="form-group">
            <label className="form-label">Batch ID / Reference</label>
            {activeBatches.length === 0 ? (
              <div style={{ color: 'var(--color-rose)', fontSize: '0.88rem', padding: '0.5rem 0' }}>
                ⚠️ No active batches with available stock to sell.
              </div>
            ) : (
              <select
                className="form-control"
                value={sellBatchId}
                onChange={e => setSellBatchId(e.target.value)}
                required
              >
                <option value="">Select a batch...</option>
                {activeBatches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.id} — {b.type} ({b.currentQuantity.toLocaleString()} birds available)
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedSellBatch?.type === 'Broiler' ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Number of Birds to Sell</label>
                  <input placeholder="100" type="number"
                    min="1"
                    max={selectedSellBatch?.currentQuantity ?? undefined}
                    className="form-control"
                    value={sellQty === 0 ? '' : sellQty}
                    onChange={e => setSellQty(Number(e.target.value))}
                    required
                  />
                  {selectedSellBatch && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Max: {selectedSellBatch.currentQuantity.toLocaleString()} birds
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Total Weight sold (Kg)</label>
                  <input type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control"
                    value={sellWeightKg === 0 ? '' : sellWeightKg}
                    onChange={e => setSellWeightKg(Number(e.target.value))}
                    placeholder="e.g. 150.5"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Price per Kg (Rs)</label>
                  <input type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control"
                    value={sellPricePerKg === 0 ? '' : sellPricePerKg}
                    onChange={e => setSellPricePerKg(Number(e.target.value))}
                    placeholder="e.g. 180"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity to Sell</label>
                <input placeholder="100" type="number"
                  min="1"
                  max={selectedSellBatch?.currentQuantity ?? undefined}
                  className="form-control"
                  value={sellQty === 0 ? '' : sellQty}
                  onChange={e => setSellQty(Number(e.target.value))}
                  required
                />
                {selectedSellBatch && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Max: {selectedSellBatch.currentQuantity.toLocaleString()} birds
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Price per Bird (Rs)</label>
                <input type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  value={sellUnitPrice === 0 ? '' : sellUnitPrice}
                  onChange={e => setSellUnitPrice(Number(e.target.value))}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input
                type="text"
                list="bird-customer-list"
                className="form-control"
                placeholder="Type to search customers..."
                value={sellCustomer}
                onChange={e => {
                  setSellCustomer(e.target.value);
                  const existing = sales.find(s => s.customerName.trim().toLowerCase() === e.target.value.trim().toLowerCase());
                  if (existing) {
                    setSellContact(existing.customerContact);
                  }
                }}
                maxLength={128}
                required
              />
              <datalist id="bird-customer-list">
                {Array.from(new Set(sales.map(s => s.customerName))).map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              {customerOldBalance > 0 && (
                <span style={{ fontSize: '0.78rem', color: 'var(--color-rose)', fontWeight: 'bold', marginTop: '0.2rem', display: 'block' }}>
                  ⚠️ Outstanding Balance: Rs {customerOldBalance.toFixed(2)}
                </span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Customer Contact</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. +91 98765 43210"
                value={sellContact}
                onChange={e => setSellContact(e.target.value)}
                maxLength={32}
                required
              />
            </div>
          </div>

          {/* Dynamic Additional Charges & Adjustments List */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', marginBottom: '0.4rem' }}>
            <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.83rem' }}>
              Additional Charges & Adjustments
            </label>
            <button
              type="button"
              className="btn-nice-outline"
              onClick={handleAddCharge}
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--color-emerald)',
                fontSize: '0.76rem',
                fontWeight: 700,
                padding: '0.25rem 0.65rem',
                borderRadius: '20px',
                cursor: 'pointer'
              }}
            >
              ➕ Add Charge
            </button>
          </div>

          {additionalCharges.length === 0 ? (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontStyle: 'italic' }}>
              No extra charges added. Click "+ Add Charge" to add transport, loading, or packing fees.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.75rem' }}>
              {additionalCharges.map(chg => {
                const PRESET_LIST = [
                  'Transport',
                  'Loading',
                  'Discount',
                  'Previous Arrears',
                  'GST / Tax',
                  'Packing Fee',
                  'Handling'
                ];
                const isPreset = PRESET_LIST.includes(chg.name);
                const selectValue = isPreset ? chg.name : 'Other (Custom...)';

                return (
                  <div key={chg.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                      <select
                        className="form-control form-control-sm"
                        style={{ flex: 1, fontSize: '0.82rem', padding: '0.3rem 0.5rem' }}
                        value={selectValue}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'Other (Custom...)') {
                            handleUpdateCharge(chg.id, 'name', 'Custom Charge Description');
                          } else {
                            handleUpdateCharge(chg.id, 'name', val);
                          }
                        }}
                      >
                        <option value="Transport">Transport</option>
                        <option value="Loading">Loading</option>
                        <option value="Discount">Discount</option>
                        <option value="Previous Arrears">Previous Arrears</option>
                        <option value="GST / Tax">GST / Tax</option>
                        <option value="Packing Fee">Packing Fee</option>
                        <option value="Handling">Handling</option>
                        <option value="Other (Custom...)">Other (Custom...)</option>
                      </select>

                      <input type="number"
                        step="0.01"
                        min="0"
                        className="form-control form-control-sm"
                        style={{ width: '100px', fontSize: '0.82rem', padding: '0.3rem 0.5rem', textAlign: 'right' }}
                        placeholder="0.00"
                        value={chg.amount || ''}
                        onChange={e => handleUpdateCharge(chg.id, 'amount', Number(e.target.value))}
                        onWheel={e => (e.target as HTMLElement).blur()}
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveCharge(chg.id)}
                        style={{
                          background: 'rgba(244, 63, 94, 0.1)',
                          border: '1px solid rgba(244, 63, 94, 0.25)',
                          color: '#f43f5e',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Remove Charge"
                      >
                        ✕
                      </button>
                    </div>

                    {!isPreset && (
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        placeholder="Type custom charge name..."
                        value={chg.name}
                        onChange={e => handleUpdateCharge(chg.id, 'name', e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {(() => {
            const subtotal = selectedSellBatch?.type === 'Broiler'
              ? (sellWeightKg * sellPricePerKg || 0)
              : (sellQty * sellUnitPrice || 0);
            const totalAdd = additionalCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
            const currentInvoiceTotal = subtotal + totalAdd;
            const displayAmountPaid = isSellAmountPaidCustom ? sellAmountPaid : currentInvoiceTotal;
            return (
              <>
                {sellQty > 0 && (selectedSellBatch?.type === 'Broiler' ? (sellWeightKg > 0 && sellPricePerKg > 0) : (sellUnitPrice > 0)) && (
                  <>
                    <div className="form-row" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">Amount Paid now (Rs)</label>
                        <input type="number"
                          step="0.01"
                          min="0"
                          className="form-control"
                          value={isSellAmountPaidCustom ? sellAmountPaid : currentInvoiceTotal || ''}
                          onChange={e => {
                            setIsSellAmountPaidCustom(true);
                            setSellAmountPaid(Number(e.target.value));
                          }}
                          onWheel={e => (e.target as HTMLElement).blur()}
                          placeholder="Defaults to full invoice total"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {sellQty > 0 && (selectedSellBatch?.type === 'Broiler' ? (sellWeightKg > 0 && sellPricePerKg > 0) : (sellUnitPrice > 0)) && (
                  <div className="sell-summary-preview">
                    <div className="sell-summary-row">
                      <span>Quantity</span>
                      <strong>{sellQty.toLocaleString()} birds</strong>
                    </div>
                    {selectedSellBatch?.type === 'Broiler' && (
                      <>
                        <div className="sell-summary-row">
                          <span>Total Weight</span>
                          <strong>{sellWeightKg.toLocaleString()} kg</strong>
                        </div>
                        <div className="sell-summary-row">
                          <span>Price per Kg</span>
                          <strong>Rs {sellPricePerKg.toFixed(2)}/kg</strong>
                        </div>
                        <div className="sell-summary-row" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span>Implied Unit Price</span>
                          <span>Rs {((sellWeightKg * sellPricePerKg) / sellQty).toFixed(2)}/bird</span>
                        </div>
                      </>
                    )}
                    <div className="sell-summary-row" style={{ borderTop: '1px dashed rgba(16,185,129,0.15)', paddingTop: '0.25rem' }}>
                      <span>Subtotal</span>
                      <strong>Rs {subtotal.toFixed(2)}</strong>
                    </div>
                    {additionalCharges.map(c => {
                      if (!c.amount || c.amount <= 0) return null;
                      return (
                        <div key={c.id} className="sell-summary-row">
                          <span>{c.name}</span>
                          <strong>+ Rs {c.amount.toFixed(2)}</strong>
                        </div>
                      );
                    })}
                    <div className="sell-summary-row" style={{ borderTop: '1px solid rgba(16,185,129,0.2)', fontWeight: 700, fontSize: '0.92rem' }}>
                      <span>Total Invoice Amount</span>
                      <strong>Rs {currentInvoiceTotal.toFixed(2)}</strong>
                    </div>
                    <div className="sell-summary-row" style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>
                      <span>Amount Paid now</span>
                      <strong>Rs {displayAmountPaid.toFixed(2)}</strong>
                    </div>
                    {(currentInvoiceTotal - displayAmountPaid) !== 0 && (
                      <div className="sell-summary-row sell-summary-total" style={{ borderTop: '1px dashed rgba(16,185,129,0.3)' }}>
                        <span>{(currentInvoiceTotal - displayAmountPaid) > 0 ? 'Balance Due' : 'Change/Overpaid'}</span>
                        <strong className={(currentInvoiceTotal - displayAmountPaid) > 0 ? "color-rose" : "color-emerald"}>
                          Rs {Math.abs(currentInvoiceTotal - displayAmountPaid).toFixed(2)}
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </form>
      </Modal>

      {/* 3. Modal Log Mortality */}
      <Modal
        isOpen={isMortalityModalOpen}
        onClose={() => {
          setIsMortalityModalOpen(false);
          setSelectedBatchId('');
        }}
        title={`Log Bird Mortality${selectedBatchId ? `: Batch ${selectedBatchId}` : ''}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => {
              setIsMortalityModalOpen(false);
              setSelectedBatchId('');
            }}>Cancel</button>
            <button className="btn btn-danger" onClick={handleMortalitySubmit}>Log Death Record</button>
          </>
        }
      >
        <form onSubmit={handleMortalitySubmit}>
          {!selectedBatchId && (
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Batch ID / Reference</label>
              {activeBatches.length === 0 ? (
                <div style={{ color: 'var(--color-rose)', fontSize: '0.88rem', padding: '0.5rem 0' }}>
                  ⚠️ No active batches to log mortality.
                </div>
              ) : (
                <select
                  className="form-control"
                  value={selectedBatchId}
                  onChange={e => setSelectedBatchId(e.target.value)}
                  required
                >
                  <option value="">Select a batch...</option>
                  {activeBatches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.id} — {b.type} ({b.currentQuantity.toLocaleString()} birds remaining)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date of Event</label>
              <input
                type="date"
                className="form-control"
                value={mortalityDate}
                onChange={e => setMortalityDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity Lost</label>
              <input placeholder="1" type="number"
                min="1"
                className="form-control"
                value={mortalityQty === 0 ? '' : mortalityQty}
                onChange={e => setMortalityQty(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Diagnosis</label>
            <textarea
              className="form-control"
              placeholder="e.g. Heat stress, respiratory disease, smothered, etc."
              rows={3}
              value={mortalityReason}
              onChange={e => setMortalityReason(e.target.value)}
              maxLength={500}
              required
              style={{ resize: 'vertical' }}
            ></textarea>
          </div>
        </form>
      </Modal>

      {/* 4. Modal - Edit Mortality Audit Record */}
      <Modal
        isOpen={isEditMortalityModalOpen}
        onClose={() => setIsEditMortalityModalOpen(false)}
        title={`Edit Mortality Audit Record: Batch ${editMortalityBatchId}`}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                handleDeleteMortality(editMortalityId, editMortalityBatchId, editMortalityOldQty);
                setIsEditMortalityModalOpen(false);
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
        <form onSubmit={handleEditMortalitySubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Batch Reference</label>
            <input
              type="text"
              className="form-control"
              value={editMortalityBatchId}
              disabled
            />
          </div>

          <div className="form-row">
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
            ></textarea>
          </div>
        </form>
      </Modal>

      {/* ── Admin Password Approval Modal for Selling Bird Batches ── */}
      <Modal
        isOpen={isAdminAuthModalOpen}
        onClose={() => {
          setIsAdminAuthModalOpen(false);
          setPendingSellBatchId(null);
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
                setPendingSellBatchId(null);
                setAdminPasswordInput('');
                setAdminAuthError('');
              }}
            >
              Cancel
            </button>
            <button className="btn btn-success" type="button" onClick={handleVerifyAdminAndExecute}>
              🔑 Verify & Open Sale
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
              Selling a bird batch and altering flock inventory requires administrator verification.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Admin Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter Admin Password"
              value={adminPasswordInput}
              onChange={ev => {
                setAdminPasswordInput(ev.target.value);
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
        .bird-mgmt-page {
          display: flex;
          flex-direction: column;
        }

        .page-header-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-lg);
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }

        .filter-tabs {
          display: flex;
          gap: var(--spacing-sm);
          background: rgba(22, 31, 48, 0.4);
          padding: 0.25rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }

        .tab-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-family: var(--font-family);
          font-weight: 600;
          font-size: 0.85rem;
          transition: all var(--transition-fast);
        }

        .tab-btn.active {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
        }

        .batch-badge {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          font-weight: 700;
          font-family: monospace;
        }

        .current-qty-active {
          color: var(--color-emerald);
          font-weight: 600;
        }

        .current-qty-sold {
          color: var(--text-muted);
          font-style: italic;
        }

        .mortality-high {
          color: var(--color-rose);
          font-weight: 600;
        }

        .btn-sm-custom {
          padding: 0.35rem 0.75rem;
          font-size: 0.75rem;
        }

        .batch-action-group {
          display: flex;
          gap: 0.4rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .empty-state {
          text-align: center;
          padding: var(--spacing-xl) 0;
          color: var(--text-muted);
        }

        .modal-form-grid {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .sell-summary-preview {
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: var(--radius-md);
          padding: var(--spacing-md) var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .sell-summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
          color: var(--text-secondary);
        }

        .sell-summary-total {
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-emerald);
          border-top: 1px solid rgba(16, 185, 129, 0.2);
          padding-top: 0.4rem;
          margin-top: 0.2rem;
        }

        /* Sold/Archived tab styles */
        .sold-summary-bar {
          display: flex;
          gap: var(--spacing-lg);
          flex-wrap: wrap;
          padding-bottom: var(--spacing-lg);
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 0.25rem;
        }

        .sold-stat {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 140px;
        }

        .sold-stat-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 500;
        }

        .sold-stat-value {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .invoice-id-badge {
          font-family: monospace;
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.2);
          color: var(--color-indigo);
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .customer-cell {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .customer-contact-text {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .color-emerald { color: var(--color-emerald); }
        .color-rose    { color: var(--color-rose); }

        /* rowSpan border fix */
        td[rowspan] {
          vertical-align: top;
          padding-top: 1rem;
        }
      `}</style>
    </div>
  );
};

