import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { Modal } from '../components/Modal';

interface SaleAdditionalCharge {
  id: string;
  name: string;
  amount: number;
}

const PRESET_CHARGES = [
  'Transport',
  'Loading',
  'Discount',
  'Previous Arrears',
  'GST / Tax',
  'Packing Fee',
  'Handling'
];

export const EggProduction: React.FC = () => {
  const { eggCollections, addEggCollection, deleteEggCollection, addEggSale, updateEggCollection, sales, currentUser, pendingSubmissions, submitForApproval } = useFarm();
  const isAdmin = currentUser?.role === 'Admin';
  
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);

  // Form Fields - Egg Collection
  const [collectDate, setCollectDate] = useState(new Date().toISOString().split('T')[0]);
  const [collectQty, setCollectQty] = useState<number>(0);
  const [collectDamaged, setCollectDamaged] = useState<number>(0);

  // Edit Collection States
  const [isEditCollectModalOpen, setIsEditCollectModalOpen] = useState(false);
  const [editingCollectionOriginalDate, setEditingCollectionOriginalDate] = useState('');
  const [editCollectDate, setEditCollectDate] = useState('');
  const [editCollectQty, setEditCollectQty] = useState<number>(0);
  const [editCollectDamaged, setEditCollectDamaged] = useState<number>(0);

  const handleOpenEditCollect = (c: any) => {
    setEditingCollectionOriginalDate(c.date);
    setEditCollectDate(c.date);
    setEditCollectQty(c.collectedQty);
    setEditCollectDamaged(c.damagedQty);
    setIsEditCollectModalOpen(true);
  };

  const handleEditCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollectionOriginalDate) return;
    await updateEggCollection(editingCollectionOriginalDate, {
      date: editCollectDate,
      collectedQty: Number(editCollectQty),
      damagedQty: Number(editCollectDamaged),
      netQty: Number(editCollectQty) - Number(editCollectDamaged)
    });
    setIsEditCollectModalOpen(false);
  };

  // Form Fields - Sell Eggs
  const [eggSaleDate, setEggSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [eggQty, setEggQty] = useState<number>(0);
  const [eggPricePerEgg, setEggPricePerEgg] = useState<number>(0);
  const [eggCustomer, setEggCustomer] = useState('');
  const [eggContact, setEggContact] = useState('');
  const [eggDetails, setEggDetails] = useState('');
  const [eggAmountPaid, setEggAmountPaid] = useState<number>(0);

  // Dynamic Additional Charges for Egg Sale
  const [additionalCharges, setAdditionalCharges] = useState<SaleAdditionalCharge[]>([]);

  const handleAddCharge = () => {
    setAdditionalCharges(prev => [
      ...prev,
      { id: `chg-${Date.now()}`, name: '', amount: 0 }
    ]);
  };

  const handleUpdateCharge = (id: string, field: keyof SaleAdditionalCharge, value: any) => {
    setAdditionalCharges(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleRemoveCharge = (id: string) => {
    setAdditionalCharges(prev => prev.filter(c => c.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const collectionData = {
      date: collectDate,
      collectedQty: Number(collectQty),
      damagedQty: Number(collectDamaged),
      netQty: Number(collectQty) - Number(collectDamaged)
    };

    if (!isAdmin) {
      submitForApproval('EggCollection', collectionData);
      alert('✅ Egg collection record submitted! It is now pending Admin approval before updating live inventory.');
    } else {
      addEggCollection(collectionData);
    }

    // Reset and Close
    setCollectQty(0);
    setCollectDamaged(0);
    setIsCollectModalOpen(false);
  };

  const handleEggSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eggCustomer.trim() || eggQty <= 0) return;
    const subtotal = eggQty * eggPricePerEgg;
    
    // Separate transport from other charges for DB compatibility
    const computedTransport = additionalCharges
      .filter(c => c.name.toLowerCase().includes('transport') || c.name.toLowerCase().includes('freight'))
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const computedOther = additionalCharges
      .filter(c => !c.name.toLowerCase().includes('transport') && !c.name.toLowerCase().includes('freight'))
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);


    
    addEggSale({
      date: eggSaleDate,
      customerName: eggCustomer,
      customerContact: eggContact,
      quantity: eggQty,
      unitPrice: eggPricePerEgg,
      totalAmount: subtotal,
      amountPaid: eggAmountPaid,
      transportCharges: computedTransport,
      otherCharges: computedOther,
      extraChargesList: additionalCharges,
      oldBalance: customerOldBalance,
      details: eggDetails || `Egg Sale: ${eggQty} eggs`
    });
    setEggCustomer('');
    setEggContact('');
    setEggDetails('');
    setEggQty(0);
    setEggAmountPaid(0);
    setAdditionalCharges([]);
    setIsSellModalOpen(false);
  };

  // Dynamically compute the customer's outstanding balance
  const customerOldBalance = React.useMemo(() => {
    if (!eggCustomer.trim()) return 0;
    return sales
      .filter(s => s.customerName.trim().toLowerCase() === eggCustomer.trim().toLowerCase())
      .reduce((sum, s) => sum + (s.totalAmount - (s.amountPaid ?? 0)), 0);
  }, [sales, eggCustomer]);

  // Performance calculations
  const totalCollected = eggCollections.reduce((sum, c) => sum + c.collectedQty, 0);
  const totalDamaged = eggCollections.reduce((sum, c) => sum + c.damagedQty, 0);

  const damageRate = totalCollected > 0 ? ((totalDamaged / totalCollected) * 100).toFixed(2) : '0.00';
  const averageYield = eggCollections.length > 0 ? Math.round(totalCollected / eggCollections.length) : 0;

  return (
    <div className="egg-production-page animate-fade-in">
      <div className="page-header-actions">
        <h4 className="section-title">Egg Collection Dashboard</h4>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isAdmin && (
            <button type="button" className="btn btn-secondary" onClick={() => {
              setEggSaleDate(new Date().toISOString().split('T')[0]);
              setEggQty(0);
              setEggPricePerEgg(0);
              setEggCustomer('');
              setEggContact('');
              setEggDetails('');
              setEggAmountPaid(0);
              setAdditionalCharges([]);
              setIsSellModalOpen(true);
            }}>
              🥚 Sell Eggs
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={() => setIsCollectModalOpen(true)}>
            🥚 Log Daily Egg Collection
          </button>
        </div>
      </div>

      {/* Yield Analytics Cards */}
      <div className="grid-cols-4 yield-analytics-container">
        <div className="glass-card yield-stat-card">
          <span className="yield-stat-label">Total Eggs Collected</span>
          <h3 className="yield-stat-value text-gradient-amber">{totalCollected.toLocaleString()}</h3>
          <span className="yield-stat-subtext">All collections to date</span>
        </div>

        <div className="glass-card yield-stat-card">
          <span className="yield-stat-label">Average Daily Yield</span>
          <h3 className="yield-stat-value">{averageYield.toLocaleString()}</h3>
          <span className="yield-stat-subtext">Eggs per collection day</span>
        </div>

        <div className="glass-card yield-stat-card">
          <span className="yield-stat-label">Damaged Eggs</span>
          <h3 className="yield-stat-value text-gradient-rose">{totalDamaged.toLocaleString()}</h3>
          <span className="yield-stat-subtext">Broken or thin shell rate</span>
        </div>

        <div className="glass-card yield-stat-card">
          <span className="yield-stat-label">Overall Damage Rate</span>
          <h3 className="yield-stat-value">{damageRate}%</h3>
          <span className={`badge ${Number(damageRate) < 1.5 ? 'badge-emerald' : 'badge-rose'} yield-badge`}>
            {Number(damageRate) < 1.5 ? 'Excellent' : 'Check Feed Calcium'}
          </span>
        </div>
      </div>

      {/* Employee Pending Submissions Awaiting Approval */}
      {(() => {
        const pendingEggs = pendingSubmissions.filter(s => s.type === 'EggCollection');
        if (pendingEggs.length === 0) return null;
        return (
          <div className="glass-card" style={{ marginTop: '1.5rem', border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>⏳</span>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--color-amber)' }}>Pending Submissions Awaiting Admin Approval</h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Records logged by staff members will update live inventory once approved by an administrator.
                  </p>
                </div>
              </div>
              <span className="badge badge-amber">{pendingEggs.filter(p => p.status === 'Pending').length} Pending</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Submitted By</th>
                    <th>Date</th>
                    <th>Collected</th>
                    <th>Damaged</th>
                    <th>Net Usable</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingEggs.map(sub => (
                    <tr key={sub.id}>
                      <td><strong>@{sub.submittedBy}</strong></td>
                      <td>{sub.data.date}</td>
                      <td>{sub.data.collectedQty} eggs</td>
                      <td><span className="color-rose">{sub.data.damagedQty} damaged</span></td>
                      <td><span className="color-emerald"><b>{sub.data.netQty} eggs</b></span></td>
                      <td>
                        <span className={`badge ${sub.status === 'Pending' ? 'badge-amber' : sub.status === 'Approved' ? 'badge-emerald' : 'badge-rose'}`}>
                          {sub.status === 'Pending' ? '⏳ Pending Approval' : sub.status === 'Approved' ? '✅ Approved' : '❌ Rejected'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Collection Logs */}
      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <h4>Daily Collection Log</h4>
        <p className="chart-subtitle" style={{ marginBottom: '1rem' }}>Log of morning and afternoon egg trays</p>
        
        {eggCollections.length === 0 ? (
          <div className="empty-state">No collections logged. Start layer records!</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Collection Date</th>
                  <th>Collected Count</th>
                  <th>Damaged Count</th>
                  <th>Usable Eggs (Net)</th>
                  <th>Boxes Needed (260/Box)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {eggCollections.map(c => {
                  const boxesFull = Math.floor(c.netQty / 260);
                  const remainder = c.netQty % 260;
                  const boxesNeeded = remainder > 0 ? boxesFull + 1 : boxesFull;
                  return (
                    <tr key={c.date}>
                      <td>{c.date}</td>
                      <td><b>{c.collectedQty.toLocaleString()}</b></td>
                      <td><span className="color-rose">{c.damagedQty}</span></td>
                      <td><span className="color-emerald"><b>{c.netQty.toLocaleString()}</b></span></td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{boxesNeeded} boxes</span>
                        {remainder > 0 && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                            ({boxesFull} full + {remainder} eggs)
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${c.damagedQty / c.collectedQty < 0.02 ? 'badge-emerald' : 'badge-amber'}`}>
                          {c.damagedQty / c.collectedQty < 0.02 ? 'Optimal' : 'Needs attention'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleOpenEditCollect(c)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            ✏️ Edit
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

      {/* Modal: Log Collection */}
      <Modal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        title="Log Daily Egg Collection"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCollectModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Save Log</button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="modal-form-grid">
          <div className="form-group">
            <label className="form-label">Collection Date</label>
            <input
              type="date"
              className="form-control"
              value={collectDate}
              onChange={e => setCollectDate(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Eggs Collected</label>
              <input placeholder="800" type="number"
                min="1"
                className="form-control"
                value={collectQty === 0 ? '' : collectQty}
                onChange={e => setCollectQty(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Damaged Eggs Count</label>
              <input placeholder="10" type="number"
                min="0"
                className="form-control"
                value={collectDamaged === 0 ? '' : collectDamaged}
                onChange={e => setCollectDamaged(Number(e.target.value))}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Egg Collection */}
      <Modal
        isOpen={isEditCollectModalOpen}
        onClose={() => setIsEditCollectModalOpen(false)}
        title="✏️ Edit Egg Collection"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (window.confirm(`Delete egg collection record for ${editingCollectionOriginalDate}?`)) {
                  deleteEggCollection(editingCollectionOriginalDate);
                  setIsEditCollectModalOpen(false);
                }
              }}
            >
              🗑️ Delete Record
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditCollectModalOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleEditCollectSubmit}>Save Changes</button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleEditCollectSubmit} className="modal-form-grid">
          <div className="form-group">
            <label className="form-label">Collection Date</label>
            <input
              type="date"
              className="form-control"
              value={editCollectDate}
              onChange={e => setEditCollectDate(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Eggs Collected</label>
              <input placeholder="800" type="number"
                min="1"
                className="form-control"
                value={editCollectQty === 0 ? '' : editCollectQty}
                onChange={e => setEditCollectQty(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Damaged Eggs Count</label>
              <input placeholder="10" type="number"
                min="0"
                className="form-control"
                value={editCollectDamaged === 0 ? '' : editCollectDamaged}
                onChange={e => setEditCollectDamaged(Number(e.target.value))}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Sell Eggs */}
      <Modal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        title="Register Egg Sale"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsSellModalOpen(false)}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleEggSaleSubmit}>Complete Sale</button>
          </>
        }
      >
        <form onSubmit={handleEggSaleSubmit} className="modal-form-grid">
          <div className="form-group">
            <label className="form-label">Sale Date</label>
            <input
              type="date"
              className="form-control"
              value={eggSaleDate}
              onChange={e => setEggSaleDate(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity of eggs</label>
              <input placeholder="300" type="number"
                min="1"
                className="form-control"
                value={eggQty === 0 ? '' : eggQty}
                onChange={e => setEggQty(Number(e.target.value))}
                onWheel={e => (e.target as HTMLElement).blur()}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Price per egg (Rs)</label>
              <input placeholder="30" type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                value={eggPricePerEgg === 0 ? '' : eggPricePerEgg}
                onChange={e => setEggPricePerEgg(Number(e.target.value))}
                onWheel={e => (e.target as HTMLElement).blur()}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input
                type="text"
                list="egg-customer-list"
                className="form-control"
                placeholder="Type to search customers..."
                value={eggCustomer}
                onChange={e => {
                  setEggCustomer(e.target.value);
                  const existing = sales.find(s => s.customerName.trim().toLowerCase() === e.target.value.trim().toLowerCase());
                  if (existing) {
                    setEggContact(existing.customerContact);
                  }
                }}
                required
              />
              <datalist id="egg-customer-list">
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
                placeholder="e.g. +1 (555) 012-9900"
                value={eggContact}
                onChange={e => setEggContact(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Remarks / Description</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Grade A large brown eggs"
              value={eggDetails}
              onChange={e => setEggDetails(e.target.value)}
            />
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

          {additionalCharges.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.75rem' }}>
              {additionalCharges.map(chg => {
                const isPreset = PRESET_CHARGES.includes(chg.name);
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
            const subtotal = eggQty * eggPricePerEgg || 0;
            const totalAdd = additionalCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
            const currentInvoiceTotal = subtotal + totalAdd;
            const displayAmountPaid = eggAmountPaid;
            return (
              <>
                {eggQty > 0 && eggPricePerEgg > 0 && (
                  <div className="form-row" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                    <div className="form-group">
                      <label className="form-label">Amount Paid now (Rs)</label>
                      <input type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={eggAmountPaid || ''}
                        onChange={e => {
                          setEggAmountPaid(Number(e.target.value));
                        }}
                        onWheel={e => (e.target as HTMLElement).blur()}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                )}
                
                {eggQty > 0 && eggPricePerEgg > 0 && (
                  <div className="sm-order-summary" style={{
                    background: 'rgba(16,185,129,0.05)',
                    border: '1px solid rgba(16,185,129,0.15)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      <span>Eggs Total</span>
                      <strong>{eggQty.toLocaleString()} eggs</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      <span>Subtotal</span>
                      <strong>Rs {subtotal.toFixed(2)}</strong>
                    </div>
                    {additionalCharges.map(c => {
                      if (!c.amount && c.amount !== 0) return null;
                      return (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                          <span>{c.name}</span>
                          <strong>+ Rs {c.amount.toFixed(2)}</strong>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 700, borderTop: '1px solid rgba(16,185,129,0.15)', paddingTop: '0.3rem' }}>
                      <span>Total Invoice Amount</span>
                      <strong>Rs {currentInvoiceTotal.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--color-emerald)', fontWeight: 600 }}>
                      <span>Amount Paid now</span>
                      <strong>Rs {displayAmountPaid.toFixed(2)}</strong>
                    </div>
                    {(currentInvoiceTotal - displayAmountPaid) !== 0 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        color: (currentInvoiceTotal - displayAmountPaid) > 0 ? 'var(--color-rose)' : 'var(--color-emerald)',
                        borderTop: '1px dashed rgba(16,185,129,0.2)',
                        paddingTop: '0.3rem',
                        marginTop: '0.2rem'
                      }}>
                        <span>{(currentInvoiceTotal - displayAmountPaid) > 0 ? 'Balance Due' : 'Change/Overpaid'}</span>
                        <strong>Rs {Math.abs(currentInvoiceTotal - displayAmountPaid).toFixed(2)}</strong>
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </form>
      </Modal>

      <style>{`
        .egg-production-page {
          display: flex;
          flex-direction: column;
        }

        .page-header-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-lg);
        }

        .yield-analytics-container {
          margin-top: var(--spacing-sm);
        }

        .yield-stat-card {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          position: relative;
        }

        .yield-stat-label {
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .yield-stat-value {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .yield-stat-subtext {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .yield-badge {
          position: absolute;
          right: var(--spacing-md);
          bottom: var(--spacing-md);
          font-size: 0.62rem;
        }
      `}</style>
    </div>
  );
};
