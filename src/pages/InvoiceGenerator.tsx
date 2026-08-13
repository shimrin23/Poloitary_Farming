import React, { useState, useMemo } from 'react';

interface InvoiceLineItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
}

interface AdditionalChargeItem {
  id: string;
  name: string;
  amount: number;
  type: 'add' | 'deduct';
}

const FARM_NAME = 'Aksha Poultry Farms & Traders';
const FARM_ADDRESS = '423/1, Kekunagolla, Kekunagolla';
const FARM_PHONE = '+94768470361';

const PRESET_CHARGES = [
  'Transport / Freight',
  'Labor / Loading Charges',
  'Discount / Concession',
  'Previous Arrears / Balance',
  'GST / Tax Charges',
  'Packing & Crate Fee',
  'Handling / Maintenance'
];

export const InvoiceGenerator: React.FC = () => {
  // Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');

  // Invoice Meta
  const [invoiceNumber, setInvoiceNumber] = useState(() => `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  // Line Items
  const [items, setItems] = useState<InvoiceLineItem[]>([
    { id: 'item-1', description: '', unit: '', quantity: 0, rate: 0 },
    { id: 'item-2', description: '', unit: '', quantity: 0, rate: 0 }
  ]);

  // Dynamic Additional Charges / Adjustments List
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalChargeItem[]>([
    { id: 'chg-1', name: '', amount: 0, type: 'add' }
  ]);

  // Billing & Payment Details
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isAmountPaidCustom, setIsAmountPaidCustom] = useState(false);
  const [paymentMode, setPaymentMode] = useState<string>('');

  // Line item handlers
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: '',
        unit: '',
        quantity: 0,
        rate: 0
      }
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert("Invoice must have at least one line item.");
      return;
    }
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Additional Charge Handlers
  const handleAddCharge = () => {
    setAdditionalCharges(prev => [
      ...prev,
      {
        id: `chg-${Date.now()}`,
        name: '',
        amount: 0,
        type: 'add'
      }
    ]);
  };

  const handleUpdateCharge = (id: string, field: keyof AdditionalChargeItem, value: any) => {
    setAdditionalCharges(prev =>
      prev.map(chg => (chg.id === id ? { ...chg, [field]: value } : chg))
    );
  };

  const handleRemoveCharge = (id: string) => {
    setAdditionalCharges(prev => prev.filter(c => c.id !== id));
  };

  const handleResetBlank = () => {
    setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setCustomerName('');
    setCustomerContact('');
    setItems([
      { id: `item-${Date.now()}`, description: '', unit: '', quantity: 0, rate: 0 }
    ]);
    setAdditionalCharges([
      { id: `chg-${Date.now()}`, name: '', amount: 0, type: 'add' }
    ]);
    setAmountPaid(0);
    setIsAmountPaidCustom(false);
  };

  // Computed Totals
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.rate || 0)), 0);
  }, [items]);

  const totalAdditions = useMemo(() => {
    return additionalCharges
      .filter(c => c.type === 'add')
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  }, [additionalCharges]);

  const totalDeductions = useMemo(() => {
    return additionalCharges
      .filter(c => c.type === 'deduct')
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  }, [additionalCharges]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal + totalAdditions - totalDeductions);
  }, [subtotal, totalAdditions, totalDeductions]);

  const effectiveAmountPaid = isAmountPaidCustom ? amountPaid : grandTotal;
  const balanceDue = Math.max(0, grandTotal - effectiveAmountPaid);

  const paymentStatus = useMemo(() => {
    if (effectiveAmountPaid >= grandTotal && grandTotal > 0) return 'PAID';
    if (effectiveAmountPaid > 0) return 'PARTIAL';
    return 'UNPAID';
  }, [effectiveAmountPaid, grandTotal]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="invoice-generator-page animate-fade-in">
      {/* ── Page Top Header Bar ── */}
      <div className="page-header-actions no-print">
        <div>
          <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>🧾 Quick Custom Invoice Generator</h3>
          <p className="subtitle" style={{ margin: 0, fontSize: '0.85rem' }}>
            Standalone custom invoice creator — generate, customize, live-preview, and print custom invoices
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={handleResetBlank}>
            ✨ Reset Form
          </button>

          <button type="button" className="btn btn-primary" onClick={handlePrint} style={{ background: 'var(--color-indigo)', borderColor: 'var(--color-indigo)' }}>
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      {/* ── Main Split View Grid (Form on Left, Live A4 Document on Right) ── */}
      <div className="invoice-split-layout">
        {/* LEFT PANEL: Form Customizer */}
        <div className="glass-card invoice-form-panel no-print">
          <div className="section-title-sm">👤 Customer & Billing Details</div>
          <div className="form-row-compact">
            <div className="form-group">
              <label className="form-label-xs">Customer Name</label>
              <input type="text" className="form-control form-control-sm" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Sunny Bakehouses & Supermarket" required />
            </div>
            <div className="form-group">
              <label className="form-label-xs">Customer Contact</label>
              <input type="text" className="form-control form-control-sm" value={customerContact} onChange={e => setCustomerContact(e.target.value)} placeholder="+91 98765 43210" />
            </div>
          </div>

          <hr className="divider-sm" />

          <div className="section-title-sm">📄 Invoice Metadata</div>
          <div className="form-row-compact">
            <div className="form-group">
              <label className="form-label-xs">Invoice #</label>
              <input type="text" className="form-control form-control-sm" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label-xs">Billing Date</label>
              <input type="date" className="form-control form-control-sm" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
            </div>
          </div>

          <hr className="divider-sm" />

          {/* Line Items Editor */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div className="section-title-sm" style={{ margin: 0 }}>📦 Invoice Line Items</div>
            <button type="button" className="btn-nice-outline" onClick={handleAddItem}>
              ➕ Add Line Item
            </button>
          </div>

          <div className="line-items-form-list">
            {items.map((item, idx) => (
              <div key={item.id} className="line-item-form-card">
                <div className="line-item-row-top">
                  <span className="line-num-badge">#{idx + 1}</span>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    style={{ flex: 1 }}
                    placeholder="Fresh Broiler Birds (Live Weight)"
                    value={item.description}
                    onChange={e => handleUpdateItem(item.id, 'description', e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-nice-close"
                    onClick={() => handleRemoveItem(item.id)}
                    title="Remove Item"
                  >
                    ✕
                  </button>
                </div>
                <div className="line-item-row-bottom">
                  <div className="form-group-compact">
                    <label className="form-label-xs">Unit</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Kg / Birds / Trays"
                      value={item.unit}
                      onChange={e => handleUpdateItem(item.id, 'unit', e.target.value)}
                    />
                  </div>
                  <div className="form-group-compact">
                    <label className="form-label-xs">Qty</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 100"
                      className="form-control form-control-sm"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={e => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group-compact">
                    <label className="form-label-xs">Rate (Rs)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 120"
                      className="form-control form-control-sm"
                      value={item.rate === 0 ? '' : item.rate}
                      onChange={e => handleUpdateItem(item.id, 'rate', Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group-compact">
                    <label className="form-label-xs">Total (Rs)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="0.00"
                      value={(Number(item.quantity || 0) * Number(item.rate || 0)) === 0 ? '' : (Number(item.quantity || 0) * Number(item.rate || 0)).toFixed(2)}
                      disabled
                      style={{ background: 'rgba(255,255,255,0.05)', fontWeight: 700 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <hr className="divider-sm" />

          {/* Dynamic Additional Charges & Payments Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div className="section-title-sm" style={{ margin: 0 }}>Additional Charges & Adjustments</div>
            <button type="button" className="btn-nice-outline" onClick={handleAddCharge}>
              ➕ Add Charge
            </button>
          </div>

          <div className="line-items-form-list" style={{ marginBottom: '1rem' }}>
            {additionalCharges.map(chg => {
              const isPreset = PRESET_CHARGES.includes(chg.name);
              const selectValue = chg.name === '' ? '' : (isPreset ? chg.name : 'Other (Custom...)');

              return (
                <div key={chg.id} className="line-item-form-card">
                  <div className="charge-aligned-row">
                    <select
                      className="form-control form-control-sm charge-input-name"
                      style={{ fontWeight: 600 }}
                      value={selectValue || ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'Other (Custom...)') {
                          handleUpdateCharge(chg.id, 'name', 'Custom Charge Description');
                        } else {
                          handleUpdateCharge(chg.id, 'name', val);
                        }
                      }}
                    >
                      <option value="" disabled hidden>Select charge type...</option>
                      <option value="Transport / Freight">Transport / Freight</option>
                      <option value="Labor / Loading Charges">Labor / Loading Charges</option>
                      <option value="Discount / Concession">Discount / Concession</option>
                      <option value="Previous Arrears / Balance">Previous Arrears / Balance</option>
                      <option value="GST / Tax Charges">GST / Tax Charges</option>
                      <option value="Packing & Crate Fee">Packing & Crate Fee</option>
                      <option value="Handling / Maintenance">Handling / Maintenance</option>
                      <option value="Other (Custom...)">Other (Custom...)</option>
                    </select>

                    <select
                      className="form-control form-control-sm charge-select-type"
                      value={chg.type}
                      onChange={e => handleUpdateCharge(chg.id, 'type', e.target.value as any)}
                    >
                      <option value="add">+ Charge</option>
                      <option value="deduct">- Discount</option>
                    </select>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control form-control-sm charge-input-amount"
                      placeholder="0.00"
                      value={chg.amount || ''}
                      onChange={e => handleUpdateCharge(chg.id, 'amount', Number(e.target.value))}
                    />

                    <button
                      type="button"
                      className="btn-nice-close"
                      onClick={() => handleRemoveCharge(chg.id)}
                      title="Remove Charge"
                    >
                      ✕
                    </button>
                  </div>

                  {!isPreset && chg.name !== '' && (
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      style={{ marginTop: '0.3rem' }}
                      placeholder="Type custom charge name..."
                      value={chg.name}
                      onChange={e => handleUpdateCharge(chg.id, 'name', e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="form-row-compact">
            <div className="form-group">
              <label className="form-label-xs">Amount Paid / Advance (Rs)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control form-control-sm"
                placeholder="0.00"
                value={effectiveAmountPaid === 0 ? '' : effectiveAmountPaid}
                onChange={e => {
                  setAmountPaid(Number(e.target.value));
                  setIsAmountPaidCustom(true);
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label-xs">Payment Method / Transaction Type</label>
              <select
                className="form-control form-control-sm"
                value={paymentMode === '' ? '' : (['Cash', 'UPI / GPay / PhonePe', 'Bank Transfer (NEFT/RTGS)', 'Cheque Deposit', 'Credit / On Account', 'Partially Paid in Cash & UPI', 'Advance Payment Received', 'Direct Sales Cash'].includes(paymentMode) ? paymentMode : 'Other')}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'Other') {
                    setPaymentMode('Custom Payment Method');
                  } else {
                    setPaymentMode(val);
                  }
                }}
              >
                <option value="" disabled hidden>Select Payment Method...</option>
                <option value="Cash">Cash</option>
                <option value="UPI / GPay / PhonePe">UPI / GPay / PhonePe</option>
                <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                <option value="Cheque Deposit">Cheque Deposit</option>
                <option value="Credit / On Account">Credit / On Account</option>
                <option value="Partially Paid in Cash & UPI">Partially Paid in Cash & UPI</option>
                <option value="Advance Payment Received">Advance Payment Received</option>
                <option value="Direct Sales Cash">Direct Sales Cash</option>
                <option value="Other">Other (Custom...)</option>
              </select>

              {!['', 'Cash', 'UPI / GPay / PhonePe', 'Bank Transfer (NEFT/RTGS)', 'Cheque Deposit', 'Credit / On Account', 'Partially Paid in Cash & UPI', 'Advance Payment Received', 'Direct Sales Cash'].includes(paymentMode) && (
                <input
                  type="text"
                  className="form-control form-control-sm"
                  style={{ marginTop: '0.3rem' }}
                  placeholder="Type custom payment method..."
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Live Printable A4 Document Preview */}
        <div className="invoice-preview-container">
          <div className="printable-invoice-document" id="printable-invoice-area">
            {/* Header Banner */}
            <div className="inv-doc-header">
              <div className="inv-doc-brand">
                <div className="inv-brand-icon">🐓</div>
                <div>
                  <h1 className="inv-farm-title">{FARM_NAME}</h1>
                  <p className="inv-farm-sub">{FARM_ADDRESS}</p>
                  <p className="inv-farm-contact">
                    <span>📞 {FARM_PHONE}</span>
                  </p>
                </div>
              </div>

              <div className="inv-doc-meta">
                <div className="inv-badge-title">TAX INVOICE</div>
                <div className="inv-meta-num">#{invoiceNumber}</div>
                <div className="inv-meta-row"><span>Date:</span> <strong>{invoiceDate}</strong></div>
                <div className="inv-meta-row">
                  <span>Status:</span>{' '}
                  <strong style={{
                    display: 'inline-block',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    backgroundColor: paymentStatus === 'PAID' ? '#dcfce7' : paymentStatus === 'PARTIAL' ? '#fef3c7' : '#fee2e2',
                    color: paymentStatus === 'PAID' ? '#15803d' : paymentStatus === 'PARTIAL' ? '#b45309' : '#b91c1c'
                  }}>
                    {paymentStatus}
                  </strong>
                </div>
              </div>
            </div>

            {/* Customer Information Bar */}
            <div className="inv-doc-customer-bar">
              <div className="inv-cust-box">
                <span className="inv-box-label">Billed To / Customer Details:</span>
                <h4 className="inv-cust-name">{customerName || 'Valued Customer'}</h4>
                {customerContact && <p className="inv-cust-detail">📞 {customerContact}</p>}
              </div>


            </div>

            {/* Line Items Table */}
            <div className="inv-table-wrapper">
              <table className="inv-doc-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Item Description & Specification</th>
                    <th style={{ textAlign: 'center' }}>Unit</th>
                    <th style={{ textAlign: 'right' }}>Qty / Weight</th>
                    <th style={{ textAlign: 'right' }}>Rate (Rs)</th>
                    <th style={{ textAlign: 'right' }}>Total (Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const lineSub = Number(item.quantity || 0) * Number(item.rate || 0);
                    return (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td><strong>{item.description}</strong></td>
                        <td style={{ textAlign: 'center' }}>{item.unit}</td>
                        <td style={{ textAlign: 'right' }}>{Number(item.quantity || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>Rs {Number(item.rate || 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}><strong>Rs {lineSub.toFixed(2)}</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Invoice Summary & Totals */}
            <div className="inv-doc-footer-grid">
              <div></div>

              <div className="inv-totals-column">
                <div className="inv-summary-row">
                  <span>Items Subtotal:</span>
                  <strong>Rs {subtotal.toFixed(2)}</strong>
                </div>

                {additionalCharges.map(chg => {
                  if (!chg.amount || chg.amount <= 0) return null;
                  return (
                    <div key={chg.id} className={`inv-summary-row ${chg.type === 'deduct' ? 'color-emerald' : ''}`}>
                      <span>{chg.name || 'Additional Charge'}:</span>
                      <span>{chg.type === 'add' ? `+ Rs ${chg.amount.toFixed(2)}` : `- Rs ${chg.amount.toFixed(2)}`}</span>
                    </div>
                  );
                })}

                <div className="inv-summary-row inv-grand-total">
                  <span>Grand Total Amount:</span>
                  <strong>Rs {grandTotal.toFixed(2)}</strong>
                </div>

                <div className="inv-summary-row">
                  <span>Amount Paid / Received:</span>
                  <span className="color-emerald"><strong>Rs {effectiveAmountPaid.toFixed(2)}</strong></span>
                </div>

                <div className="inv-summary-row inv-balance-due">
                  <span>Net Balance Remaining:</span>
                  <strong className={balanceDue > 0 ? 'color-rose' : 'color-emerald'}>
                    Rs {balanceDue.toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="inv-signature-area">
              <div className="inv-sign-box">
                <div className="inv-sign-line">Received By (Customer Signature)</div>
              </div>
              <div className="inv-sign-box">
                <div className="inv-sign-title">For {FARM_NAME}</div>
                <div className="inv-sign-line" style={{ marginTop: '2.5rem' }}>Authorized Signature / Seal</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .invoice-generator-page {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .invoice-split-layout {
          display: grid;
          grid-template-columns: 480px 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        @media (max-width: 1100px) {
          .invoice-split-layout {
            grid-template-columns: 1fr;
          }
        }

        .invoice-form-panel {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          padding: 1.25rem;
        }

        .section-title-sm {
          font-size: 0.82rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-emerald);
        }

        .form-row-compact {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
        }

        .form-label-xs {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 0.2rem;
          display: block;
        }

        .form-control-sm {
          padding: 0.35rem 0.6rem;
          font-size: 0.82rem;
          border-radius: var(--radius-sm);
        }

        .divider-sm {
          border: 0;
          border-top: 1px solid var(--border-color);
          margin: 0.4rem 0;
        }

        /* Clean Outline Add Button */
        .btn-nice-outline {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: var(--color-emerald);
          font-size: 0.76rem;
          font-weight: 700;
          padding: 0.3rem 0.65rem;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .btn-nice-outline:hover {
          background: rgba(16, 185, 129, 0.2);
          border-color: var(--color-emerald);
          transform: translateY(-1px);
        }

        /* Compact Clean Close X Button */
        .btn-nice-close {
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.25);
          color: #f43f5e;
          font-size: 0.8rem;
          font-weight: 700;
          width: 30px;
          height: 30px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          line-height: 1;
        }

        .btn-nice-close:hover {
          background: rgba(244, 63, 94, 0.25);
          border-color: #f43f5e;
          transform: scale(1.05);
        }

        /* Line item form styling */
        .line-items-form-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .line-item-form-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 0.65rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          box-sizing: border-box;
          width: 100%;
        }

        .line-item-row-top {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .line-num-badge {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          width: 24px;
        }

        .line-item-row-bottom {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          width: 100%;
          box-sizing: border-box;
        }

        /* Aligned Row for Additional Charges */
        .charge-aligned-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          width: 100%;
          box-sizing: border-box;
        }

        .charge-input-name {
          flex: 1;
          min-width: 0;
        }

        .charge-select-type {
          width: 105px;
          flex-shrink: 0;
        }

        .charge-input-amount {
          width: 90px;
          flex-shrink: 0;
        }

        .form-group-compact {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        /* Printable Document Styles */
        .invoice-preview-container {
          background: rgba(0, 0, 0, 0.2);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          display: flex;
          justify-content: center;
          overflow-x: auto;
        }

        .printable-invoice-document {
          width: 100%;
          max-width: 800px;
          background: #ffffff;
          color: #1e293b;
          border-radius: 6px;
          padding: 2.2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .inv-doc-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 1.25rem;
          gap: 1rem;
        }

        .inv-doc-brand {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .inv-brand-icon {
          font-size: 2.2rem;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          padding: 0.4rem;
          line-height: 1;
        }

        .inv-farm-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.2rem 0;
        }

        .inv-farm-sub {
          font-size: 0.82rem;
          color: #475569;
          margin: 0 0 0.2rem 0;
        }

        .inv-farm-contact {
          font-size: 0.78rem;
          color: #64748b;
          margin: 0;
        }

        .inv-doc-meta {
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .inv-badge-title {
          font-size: 1.1rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #059669;
          text-transform: uppercase;
        }

        .inv-meta-num {
          font-family: monospace;
          font-size: 1rem;
          font-weight: 700;
          color: #334155;
        }

        .inv-meta-row {
          font-size: 0.8rem;
          color: #64748b;
        }

        .inv-doc-customer-bar {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 1rem;
        }

        .inv-cust-box {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .inv-box-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
        }

        .inv-cust-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0.1rem 0;
        }

        .inv-cust-detail {
          font-size: 0.8rem;
          color: #475569;
          margin: 0;
        }

        .inv-status-stamp {
          display: inline-block;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-align: center;
          margin-top: 0.2rem;
        }

        .inv-status-stamp.paid {
          background: #d1fae5;
          color: #047857;
          border: 1px solid #6ee7b7;
        }

        .inv-status-stamp.partial {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fcd34d;
        }

        .inv-status-stamp.unpaid {
          background: #ffe4e6;
          color: #be123c;
          border: 1px solid #fca5a5;
        }

        /* Invoice Table */
        .inv-table-wrapper {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
        }

        .inv-doc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.84rem;
        }

        .inv-doc-table th {
          background: #f1f5f9;
          color: #334155;
          font-weight: 700;
          padding: 0.6rem 0.8rem;
          text-align: left;
          border-bottom: 1px solid #cbd5e1;
        }

        .inv-doc-table td {
          padding: 0.6rem 0.8rem;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }

        .inv-doc-table tr:nth-child(even) {
          background: #fafafa;
        }

        .inv-doc-footer-grid {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 1.5rem;
          align-items: start;
        }

        .inv-totals-column {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 0.85rem;
        }

        .inv-summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          color: #475569;
        }

        .inv-grand-total {
          font-size: 0.95rem;
          font-weight: 800;
          color: #047857;
          border-top: 2px solid #a7f3d0;
          border-bottom: 2px solid #a7f3d0;
          padding: 0.4rem 0;
          margin: 0.2rem 0;
        }

        .inv-balance-due {
          font-size: 0.88rem;
          font-weight: 800;
          padding-top: 0.2rem;
        }

        .inv-signature-area {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .inv-sign-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 180px;
        }

        .inv-sign-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: #475569;
        }

        .inv-sign-line {
          border-top: 1px dashed #94a3b8;
          width: 100%;
          text-align: center;
          font-size: 0.72rem;
          color: #64748b;
          padding-top: 0.3rem;
          margin-top: 2rem;
        }

        /* Robust Fail-Safe Print Engine */
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          html, body {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
          }

          body * {
            visibility: hidden !important;
          }

          #printable-invoice-area,
          #printable-invoice-area * {
            visibility: visible !important;
          }

          #printable-invoice-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 1.5rem !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
