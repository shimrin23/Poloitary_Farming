import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import type { Sale } from '../context/FarmContext';
import { Modal } from '../components/Modal';

const PRESET_CHARGES = [
  'Transport',
  'Loading',
  'Discount',
  'Previous Arrears',
  'GST / Tax',
  'Packing Fee',
  'Handling'
];

const getSaleTimestamp = (s: Sale): number => {
  if (s.updatedAt) {
    if (s.updatedAt.includes('T')) {
      const parsed = Date.parse(s.updatedAt);
      if (!isNaN(parsed)) return parsed;
    }
    if (s.updatedAt.startsWith('s-')) {
      const ms = Number(s.updatedAt.slice(2));
      if (!isNaN(ms)) return ms;
    }
    const num = Number(s.updatedAt);
    if (!isNaN(num)) return num;
  }
  
  if (s.id.startsWith('s-')) {
    const ms = Number(s.id.slice(2));
    if (!isNaN(ms)) return ms;
  }
  
  const numId = Number(s.id);
  if (!isNaN(numId)) return numId;
  
  if (s.date) {
    const parsedDate = Date.parse(s.date);
    if (!isNaN(parsedDate)) return parsedDate;
  }

  return 0;
};

export const SalesMgmt: React.FC = () => {
  const { batches, sales, usersList, deleteSale, updateSale, addEggSale } = useFarm();

  // Paid status — derived directly from DB (amountPaid >= totalAmount)
  const isSalePaid = (s: Sale) => s.totalAmount > 0 && (s.amountPaid ?? 0) >= s.totalAmount;

  const togglePaid = async (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    const isPaid = isSalePaid(sale);
    // Pass subtotal only to updateSale — it adds transport+other internally via computedTotal
    const subtotal = sale.totalAmount - (sale.transportCharges || 0) - (sale.otherCharges || 0);
    const fullTotal = sale.totalAmount; // totalAmount in context = full DB total
    const newAmountPaid = isPaid ? 0 : fullTotal;
    try {
      await updateSale(saleId, {
        ...sale,
        totalAmount: subtotal,   // pass raw subtotal so updateSale recomputes correctly
        amountPaid: newAmountPaid
      });
    } catch (err) {
      // Log but don't re-throw — DB was updated and optimistic UI update already ran
      console.warn('[togglePaid] minor error after update (UI is correct):', err);
    }
  };

  // Admin Verification for Mark Paid & Payment Updates
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [pendingPaidSaleId, setPendingPaidSaleId] = useState<string | null>(null);

  const handleInitiateTogglePaid = (saleId: string) => {
    setPendingPaidSaleId(saleId);
    setAdminPasswordInput('');
    setAdminAuthError('');
    setIsAdminAuthModalOpen(true);
  };

  const handleVerifyAdminAndExecute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pendingPaidSaleId) return;

    const adminUser = usersList.find(u => u.role === 'Admin');
    const isPasswordCorrect = adminUser ? adminUser.password === adminPasswordInput : (adminPasswordInput === 'admin' || adminPasswordInput === '2001-02-23');

    if (!isPasswordCorrect) {
      setAdminAuthError('❌ Incorrect Admin Password. Access denied.');
      return;
    }

    try {
      await togglePaid(pendingPaidSaleId);
      setIsAdminAuthModalOpen(false);
      setPendingPaidSaleId(null);
      setAdminPasswordInput('');
      setAdminAuthError('');
    } catch (err) {
      console.error('Mark paid failed:', err);
      setAdminAuthError('❌ Failed to update payment status. Please try again.');
    }
  };

  const [activeTab, setActiveTab] = useState<'ledger' | 'balances'>('ledger');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Sale | null>(null);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [extraCharges, setExtraCharges] = useState<{ label: string; amount: number }[]>([]);
  const [newChargeLabel, setNewChargeLabel] = useState('Transport');
  const [newChargeAmount, setNewChargeAmount] = useState<number>(0);
  const [ledgerFilter, setLedgerFilter] = useState<'All' | 'Bird' | 'Egg'>('All');

  // Edit Sale States
  const [isEditSaleModalOpen, setIsEditSaleModalOpen] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState('');
  const [editSaleType, setEditSaleType] = useState<'Bird' | 'Egg'>('Bird');
  const [editSaleDate, setEditSaleDate] = useState('');
  const [editSaleCustomerName, setEditSaleCustomerName] = useState('');
  const [editSaleCustomerContact, setEditSaleCustomerContact] = useState('');
  const [editSaleQty, setEditSaleQty] = useState<number>(0);
  const [editSaleUnitPrice, setEditSaleUnitPrice] = useState<number>(0);
  const [editSaleWeightKg, setEditSaleWeightKg] = useState<number>(0);
  const [editSalePricePerKg, setEditSalePricePerKg] = useState<number>(0);
  const [editSaleBatchId, setEditSaleBatchId] = useState('');
  const [editSaleDetails, setEditSaleDetails] = useState('');
  const [editSaleAmountPaid, setEditSaleAmountPaid] = useState<number>(0);
  const [editSaleAdditionalCharges, setEditSaleAdditionalCharges] = useState<{id: string, name: string, amount: number}[]>([]);
  const [editSaleOldBalance, setEditSaleOldBalance] = useState<number>(0);

  const handleAddEditCharge = () => {
    setEditSaleAdditionalCharges(prev => [
      ...prev,
      { id: `chg-${Date.now()}`, name: '', amount: 0 }
    ]);
  };

  const handleUpdateEditCharge = (id: string, field: 'name' | 'amount', value: any) => {
    setEditSaleAdditionalCharges(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleRemoveEditCharge = (id: string) => {
    setEditSaleAdditionalCharges(prev => prev.filter(c => c.id !== id));
  };

  // Direct Customer Payment States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [paymentContact, setPaymentContact] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentDetails, setPaymentDetails] = useState('Cash Payment');

  // Admin auth for Receive Payment
  const [isPaymentAuthModalOpen, setIsPaymentAuthModalOpen] = useState(false);
  const [paymentAdminPassword, setPaymentAdminPassword] = useState('');
  const [paymentAdminError, setPaymentAdminError] = useState('');

  const handleInitiatePayment = () => {
    setPaymentAdminPassword('');
    setPaymentAdminError('');
    setIsPaymentAuthModalOpen(true);
  };

  const handleVerifyPaymentAdmin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const adminUser = usersList.find(u => u.role === 'Admin');
    const ok = adminUser ? adminUser.password === paymentAdminPassword : (paymentAdminPassword === 'admin' || paymentAdminPassword === '2001-02-23');
    if (!ok) { setPaymentAdminError('❌ Incorrect Admin Password. Access denied.'); return; }
    setIsPaymentAuthModalOpen(false);
    setPaymentAdminPassword('');
    setPaymentAdminError('');
    // Trigger actual submit
    const finalCustomer = isNewCustomer ? newCustomerName.trim() : paymentCustomer.trim();
    if (!finalCustomer || paymentAmount <= 0) return;
    await addEggSale({
      date: paymentDate,
      customerName: finalCustomer,
      customerContact: paymentContact,
      quantity: 0,
      unitPrice: 0,
      totalAmount: 0,
      amountPaid: paymentAmount,
      details: paymentDetails ? `Payment: ${paymentDetails}` : 'Customer Payment Received',
      transportCharges: 0,
      otherCharges: 0,
      oldBalance: 0
    });
    setIsPaymentModalOpen(false);
    setPaymentCustomer('');
    setIsNewCustomer(false);
    setNewCustomerName('');
    setPaymentContact('');
    setPaymentAmount(0);
    setPaymentDetails('Cash Payment');
  };

  // Customer Statement Modal State
  const [isCustomerStatementOpen, setIsCustomerStatementOpen] = useState(false);
  const [statementCustomer, setStatementCustomer] = useState<{ name: string; contact: string; billed: number; paid: number } | null>(null);

  const handleOpenEditSale = (s: Sale) => {
    setEditingSaleId(s.id);
    setEditSaleType(s.type);
    setEditSaleDate(s.date);
    setEditSaleCustomerName(s.customerName);
    setEditSaleCustomerContact(s.customerContact);
    setEditSaleQty(s.quantity);
    setEditSaleUnitPrice(s.unitPrice);
    setEditSaleWeightKg(s.weightKg || 0);
    setEditSalePricePerKg(s.pricePerKg || 0);
    setEditSaleBatchId(s.batchId || '');
    setEditSaleDetails(s.details || '');
    setEditSaleAmountPaid(s.amountPaid || 0);
    if (s.extraChargesList && s.extraChargesList.length > 0) {
      setEditSaleAdditionalCharges(s.extraChargesList.map((c, i) => ({ id: `chg-${Date.now()}-${i}`, name: c.name, amount: c.amount })));
    } else {
      const arr = [];
      if (s.transportCharges) arr.push({ id: `chg-${Date.now()}-t`, name: '', amount: s.transportCharges });
      if (s.otherCharges) arr.push({ id: `chg-${Date.now()}-o`, name: 'Other (Custom...)', amount: s.otherCharges });
      setEditSaleAdditionalCharges(arr);
    }
    setEditSaleOldBalance(s.oldBalance || 0);
    setIsEditSaleModalOpen(true);
  };

  const handleEditSaleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!editingSaleId) return;

    try {
      const isBroilerSale = editSaleType === 'Bird' && Number(editSaleWeightKg) > 0;
      const finalSubtotal = isBroilerSale
        ? (Number(editSaleWeightKg) || 0) * (Number(editSalePricePerKg) || 0)
        : (Number(editSaleQty) || 0) * (Number(editSaleUnitPrice) || 0);

      const computedTransport = editSaleAdditionalCharges
        .filter(c => c.name.toLowerCase().includes('transport') || c.name.toLowerCase().includes('freight'))
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);

      const computedOther = editSaleAdditionalCharges
        .filter(c => !c.name.toLowerCase().includes('transport') && !c.name.toLowerCase().includes('freight'))
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);

      await updateSale(editingSaleId, {
        type: editSaleType,
        date: editSaleDate,
        customerName: editSaleCustomerName,
        customerContact: editSaleCustomerContact,
        quantity: Number(editSaleQty) || 0,
        unitPrice: isBroilerSale ? (finalSubtotal / (Number(editSaleQty) || 1)) : (Number(editSaleUnitPrice) || 0),
        totalAmount: finalSubtotal,
        amountPaid: Number(editSaleAmountPaid) || 0,
        transportCharges: computedTransport,
        otherCharges: computedOther,
        extraChargesList: editSaleAdditionalCharges.map(c => ({ name: c.name, amount: c.amount })),
        oldBalance: Number(editSaleOldBalance) || 0,
        batchId: editSaleType === 'Bird' ? editSaleBatchId : undefined,
        details: editSaleDetails || '',
        weightKg: isBroilerSale ? (Number(editSaleWeightKg) || 0) : undefined,
        pricePerKg: isBroilerSale ? (Number(editSalePricePerKg) || 0) : undefined
      });

      setIsEditSaleModalOpen(false);
    } catch (err: any) {
      console.error('Edit sale failed:', err);
      const msg = err?.message || err?.details || JSON.stringify(err);
      alert(`Failed to save changes: ${msg}`);
    }
  };

  const handleViewInvoice = (sale: Sale) => {
    setActiveInvoice(sale);
    setAmountPaid(sale.amountPaid ?? sale.totalAmount);
    setExtraCharges([]);
    setNewChargeLabel('Transport');
    setNewChargeAmount(0);
    setIsInvoiceOpen(true);
  };



  const handlePrint = () => {
    if (!activeInvoice) return;
    const el = document.querySelector('.printable-invoice-container');
    if (!el) return;
    const invoiceHtml = (el as HTMLElement).innerHTML;

    const pw = window.open('', '_blank', 'width=900,height=700');
    if (!pw) return;
    pw.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${activeInvoice.invoiceId}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --border-color: #d1d5db;
      --text-muted: #6b7280;
      --color-rose: #dc2626;
      --color-emerald: #059669;
    }
    @page { size: A4; margin: 1.5cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', sans-serif;
      background: #ffffff;
      color: #111827;
      font-size: 14px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .printable-invoice-container { padding: 0; }
    .invoice-header-branding {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 2px solid #d1d5db;
      padding-bottom: 1.2rem; margin-bottom: 1.2rem;
    }
    .invoice-header-branding h2 { font-size: 1.4rem; letter-spacing: 0.05em; margin: 0 0 0.25rem; color: #111827; }
    .inv-subtitle { color: #059669; font-size: 0.78rem; margin-bottom: 0.2rem; }
    .inv-address { font-size: 0.75rem; color: #6b7280; margin-top: 0.1rem; }
    .invoice-id-block { text-align: right; }
    .invoice-label { font-size: 1.2rem; font-weight: 800; color: #059669; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
    .invoice-meta-row { display: flex; gap: 0.5rem; justify-content: flex-end; font-size: 0.85rem; margin-bottom: 0.15rem; color: #374151; }
    .invoice-addresses { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .address-block h5 { font-size: 0.7rem; text-transform: uppercase; color: #9ca3af; margin-bottom: 0.4rem; letter-spacing: 0.05em; }
    .address-block p { color: #111827; font-size: 0.9rem; }
    .inv-contact { font-size: 0.82rem; color: #6b7280; margin-top: 0.2rem; }
    .invoice-status-block { text-align: right; }
    .paid-badge {
      background: #d1fae5; border: 1px solid #6ee7b7; color: #059669;
      padding: 0.3rem 0.75rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700;
    }
    .partial-badge {
      background: #fef3c7; border: 1px solid #fcd34d; color: #d97706;
      padding: 0.3rem 0.75rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700;
    }
    .inv-paid-print-value { font-size: 0.95rem; font-weight: 700; color: #111827; display: block; margin-bottom: 0.3rem; }
    .inv-paid-input-header { display: none; }
    .invoice-items-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
    .invoice-items-table th {
      background: #f3f4f6; color: #374151; border-bottom: 2px solid #9ca3af;
      padding: 0.5rem 0; font-size: 0.75rem; text-align: left;
    }
    .invoice-items-table td { border-bottom: 1px solid #e5e7eb; padding: 0.85rem 0; vertical-align: top; color: #111827; }
    .inv-item-desc { font-weight: 500; }
    .inv-item-note { font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem; }
    .invoice-calculations {
      margin-left: auto; width: 320px;
      border-top: 1px solid #d1d5db; padding-top: 1rem;
      margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.4rem;
    }
    .calc-row { display: flex; justify-content: space-between; font-size: 0.88rem; color: #374151; }
    .calc-row.grand-total {
      font-size: 1rem; font-weight: 700; color: #111827;
      border-top: 1px solid #d1d5db; padding-top: 0.5rem; margin-top: 0.25rem;
    }
    .charge-addition { color: #0284c7; }
    .charge-deduction { color: #dc2626; }
    .charge-pos-val { color: #0284c7; font-weight: 600; }
    .charge-neg-val { color: #dc2626; font-weight: 600; }
    .extra-charge-right { display: flex; align-items: center; gap: 0.35rem; }
    .remove-charge-btn, .add-charge-row, .charge-sign-toggle, .print-exclude { display: none !important; }
    .payment-given-row {
      color: #d97706; font-weight: 600;
      border-top: 1px dashed #fcd34d; padding-top: 0.4rem; margin-top: 0.1rem;
    }
    .balance-row { font-size: 1rem; font-weight: 700; border-top: 1px solid #d1d5db; padding-top: 0.5rem; margin-top: 0.15rem; }
    .change-positive { color: #059669; }
    .balance-due { color: #dc2626; }
    .invoice-footer-notes {
      text-align: center; font-size: 0.78rem; color: #9ca3af;
      border-top: 1px solid #e5e7eb; padding-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="printable-invoice-container">
    ${invoiceHtml}
  </div>
  <script>
    // Remove the Amount Paid input and show the plain text value
    document.querySelectorAll('.inv-paid-input-header').forEach(el => el.remove());
    window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
  </script>
</body>
</html>`);
    pw.document.close();
  };

  const totalRevenue = sales.reduce((s, sale) => s + sale.totalAmount, 0);
  const birdSales = sales.filter(s => s.type === 'Bird');
  const eggSales = sales.filter(s => s.type === 'Egg');

  // Filtered sales for the ledger (exclude payments from Bird/Egg profit ledgers)
  const filteredSales = sales.filter(s => {
    if (ledgerFilter === 'All') return true;
    if (ledgerFilter === 'Bird') return s.type === 'Bird' && s.totalAmount > 0;
    if (ledgerFilter === 'Egg') return s.type === 'Egg' && s.totalAmount > 0;
    return true;
  });

  const filteredRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const filteredCost = filteredSales.reduce((sum, s) => {
    if (s.type === 'Egg') return sum;
    const batch = batches.find(b => b.id === s.batchId);
    const purchasePrice = batch ? batch.purchasePrice : 0;
    return sum + (s.quantity * purchasePrice);
  }, 0);
  const filteredProfit = filteredRevenue - filteredCost;

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCustomer = isNewCustomer ? newCustomerName.trim() : paymentCustomer.trim();
    if (!finalCustomer || paymentAmount <= 0) return;

    await addEggSale({
      date: paymentDate,
      customerName: finalCustomer,
      customerContact: paymentContact,
      quantity: 0,
      unitPrice: 0,
      totalAmount: 0,
      amountPaid: paymentAmount,
      details: paymentDetails ? `Payment: ${paymentDetails}` : 'Customer Payment Received',
      transportCharges: 0,
      otherCharges: 0,
      oldBalance: 0
    });

    setIsPaymentModalOpen(false);
    setPaymentCustomer('');
    setIsNewCustomer(false);
    setNewCustomerName('');
    setPaymentContact('');
    setPaymentAmount(0);
    setPaymentDetails('Cash Payment');
  };

  const uniqueCustomerNames = React.useMemo(() => {
    const names = new Set<string>();
    sales.forEach(s => {
      if (s.customerName && s.customerName.trim()) {
        names.add(s.customerName.trim());
      }
    });
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [sales]);

  // Compute prior running balances for each invoice chronologically
  const salePriorBalances = React.useMemo(() => {
    const balancesMap: { [saleId: string]: number } = {};
    
    // Group sales by customer (case-insensitive, trimmed)
    const salesByCustomer: { [customerKey: string]: Sale[] } = {};
    sales.forEach(s => {
      if (!s.customerName) return;
      const key = s.customerName.trim().toLowerCase();
      if (!salesByCustomer[key]) {
        salesByCustomer[key] = [];
      }
      salesByCustomer[key].push(s);
    });
    
    // For each customer, sort chronologically and compute running balance
    Object.keys(salesByCustomer).forEach(key => {
      const customerSales = salesByCustomer[key];
      // Sort ascending: date first, then id
      customerSales.sort((a, b) => {
        const dateComp = a.date.localeCompare(b.date);
        if (dateComp !== 0) return dateComp;
        return a.id.localeCompare(b.id);
      });
      
      let runningBalance = 0;
      customerSales.forEach(s => {
        balancesMap[s.id] = runningBalance;
        runningBalance += s.totalAmount - (s.amountPaid ?? 0);
      });
    });
    
    return balancesMap;
  }, [sales]);

  // Group sales by customer name to get outstanding balance directory
  const customerBalances = React.useMemo(() => {
    const map: { [key: string]: { name: string; contact: string; billed: number; paid: number } } = {};
    sales.forEach(s => {
      const key = s.customerName.trim().toLowerCase();
      if (!map[key]) {
        map[key] = {
          name: s.customerName.trim(),
          contact: s.customerContact || 'N/A',
          billed: 0,
          paid: 0
        };
      }
      map[key].billed += s.totalAmount;
      map[key].paid += s.amountPaid ?? 0;
      if (s.customerContact && s.customerContact !== 'N/A' && map[key].contact === 'N/A') {
        map[key].contact = s.customerContact;
      }
    });
    return Object.values(map);
  }, [sales]);

  const filteredCustomerBalances = customerBalances.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.contact.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Find Old Balance for current active invoice (calculated prior to invoice date)
  const activeCustomerName = activeInvoice?.customerName || '';
  const activeInvoiceDate = activeInvoice?.date || '';
  const activeInvoiceId = activeInvoice?.id || '';

  const oldBalance = React.useMemo(() => {
    if (!activeInvoice) return 0;
    // Check if there is an oldBalance saved at time of creation, else compute dynamically
    if (activeInvoice.oldBalance !== undefined && activeInvoice.oldBalance > 0) {
      return activeInvoice.oldBalance;
    }
    return sales
      .filter(s => 
        s.customerName.trim().toLowerCase() === activeCustomerName.trim().toLowerCase() &&
        s.id !== activeInvoiceId &&
        s.date < activeInvoiceDate
      )
      .reduce((sum, s) => sum + (s.totalAmount - (s.amountPaid ?? 0)), 0);
  }, [sales, activeInvoice, activeCustomerName, activeInvoiceDate, activeInvoiceId]);

  return (
    <div className="sales-mgmt-page animate-fade-in">

      <div className="page-header-actions">
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Sales & Invoice Registry</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Track transactions, invoice payments, and customer ledger balances</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="filter-tabs">
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
              onClick={() => setActiveTab('ledger')}
            >
              🧾 Transactions Ledger
            </button>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'balances' ? 'active' : ''}`}
              onClick={() => setActiveTab('balances')}
            >
              👥 Customer Balances Directory
            </button>
          </div>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => {
              setIsNewCustomer(false);
              setPaymentCustomer('');
              setNewCustomerName('');
              setPaymentContact('');
              setPaymentAmount(0);
              setPaymentDetails('Cash Payment');
              setIsPaymentModalOpen(true);
            }}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}
          >
            💳 Receive Payment
          </button>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="sales-stats-row">
        <div className="sales-stat-card">
          <span className="sales-stat-icon">💰</span>
          <div>
            <div className="sales-stat-value">Rs {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="sales-stat-label">Total Revenue</div>
          </div>
        </div>
        <div className="sales-stat-card">
          <span className="sales-stat-icon">🧾</span>
          <div>
            <div className="sales-stat-value">{sales.length}</div>
            <div className="sales-stat-label">Total Invoices</div>
          </div>
        </div>
        <div className="sales-stat-card">
          <span className="sales-stat-icon">🐔</span>
          <div>
            <div className="sales-stat-value">{birdSales.length}</div>
            <div className="sales-stat-label">Bird Sales</div>
          </div>
        </div>
        <div className="sales-stat-card">
          <span className="sales-stat-icon">🥚</span>
          <div>
            <div className="sales-stat-value">{eggSales.length}</div>
            <div className="sales-stat-label">Egg Sales</div>
          </div>
        </div>
      </div>

      {activeTab === 'balances' ? (
        <div className="glass-card animate-fade-in">
          <div className="sm-card-header">
            <div>
              <h3>Customer Balances Directory</h3>
              <p className="chart-subtitle">View total billed, total paid, and outstanding balances per customer</p>
            </div>
            <div>
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Search customer or contact..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                style={{ width: '280px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {filteredCustomerBalances.length === 0 ? (
            <div className="sm-empty-state">
              <div className="sm-empty-icon">👥</div>
              <p>No customer records found.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Contact Info</th>
                    <th>Total Billed</th>
                    <th>Total Paid</th>
                    <th>Net Due / Balance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomerBalances.map(c => {
                    const outstanding = c.billed - c.paid;
                    return (
                      <tr key={c.name.toLowerCase()}>
                        <td><strong>{c.name}</strong></td>
                        <td><span className="customer-contact">{c.contact}</span></td>
                        <td>Rs {c.billed.toFixed(2)}</td>
                        <td className="color-emerald">Rs {c.paid.toFixed(2)}</td>
                        <td className={outstanding > 0 ? "profit-amount-neg" : "profit-amount-pos"} style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                          Rs {outstanding.toFixed(2)}
                        </td>
                        <td>
                          <span className={`sm-type-badge ${outstanding > 0 ? 'type-bird' : 'type-egg'}`} style={{ fontSize: '0.7rem' }}>
                            {outstanding > 0 ? '⏳ Net Due' : '✅ Fully Paid'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs-custom"
                              onClick={() => {
                                setStatementCustomer({ name: c.name, contact: c.contact, billed: c.billed, paid: c.paid });
                                setIsCustomerStatementOpen(true);
                              }}
                              title="Print customer ledger invoice statement connected to customer name"
                            >
                              🖨️ Print Statement
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-xs-custom"
                              onClick={() => {
                                setIsNewCustomer(false);
                                setPaymentCustomer(c.name);
                                setPaymentContact(c.contact === 'N/A' ? '' : c.contact);
                                setPaymentAmount(outstanding > 0 ? outstanding : 0);
                                setPaymentDetails('Customer Balance Payment');
                                setIsPaymentModalOpen(true);
                              }}
                            >
                              💳 Receive Payment
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
      ) : (
        <div className="glass-card">
          <div className="sm-card-header">
            <div>
              <h3>Sales Transactions Ledger</h3>
              <p className="chart-subtitle">{sales.length} invoices · Rs {totalRevenue.toFixed(2)} total revenue</p>
            </div>
            <div className="ledger-filter-controls">
              <button 
                type="button"
                className={`ledger-filter-btn ${ledgerFilter === 'All' ? 'active' : ''}`} 
                onClick={() => setLedgerFilter('All')}
              >
                All
              </button>
              <button 
                type="button"
                className={`ledger-filter-btn ${ledgerFilter === 'Bird' ? 'active' : ''}`} 
                onClick={() => setLedgerFilter('Bird')}
              >
                🐔 Bird Profit
              </button>
              <button 
                type="button"
                className={`ledger-filter-btn ${ledgerFilter === 'Egg' ? 'active' : ''}`} 
                onClick={() => setLedgerFilter('Egg')}
              >
                🥚 Egg Profit
              </button>
            </div>
          </div>

          {sales.length === 0 ? (
            <div className="sm-empty-state">
              <div className="sm-empty-icon">🧾</div>
              <p>No sales transactions recorded yet.</p>
            </div>
          ) : (
            <>
              {/* Mini-stats summary bar */}
              <div className="ledger-summary-bar">
                <div className="ledger-summary-card">
                  <span className="ledger-summary-label">Revenue (Selected)</span>
                  <span className="ledger-summary-value color-emerald">
                    Rs {filteredRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="ledger-summary-card">
                  <span className="ledger-summary-label">Initial Cost</span>
                  <span className="ledger-summary-value color-rose">
                    Rs {filteredCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="ledger-summary-card">
                  <span className="ledger-summary-label">Net Profit</span>
                  <span className={`ledger-summary-value ${filteredProfit >= 0 ? 'color-emerald' : 'color-rose'}`}>
                    Rs {filteredProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {filteredSales.length === 0 ? (
                <div className="sm-empty-state">
                  <div className="sm-empty-icon">🧾</div>
                  <p>No {ledgerFilter.toLowerCase()} sales transactions found.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice ID</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Type</th>
                        <th>Qty Sold</th>
                        <th>Unit Price</th>
                        <th>Financial Details</th>
                        <th>Profit</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...filteredSales].sort((a, b) => getSaleTimestamp(b) - getSaleTimestamp(a)).map(s => {
                        const cost = s.type === 'Bird' ? (batches.find(b => b.id === s.batchId)?.purchasePrice ?? 0) * s.quantity : 0;
                        const profit = s.totalAmount - cost;
                        return (
                          <tr key={s.id}>
                            <td><span className="invoice-badge">{s.invoiceId}</span></td>
                            <td>{s.date}</td>
                            <td>
                              <div className="customer-cell">
                                <strong>{s.customerName}</strong>
                                {s.customerContact && <span className="customer-contact">{s.customerContact}</span>}
                              </div>
                            </td>
                            <td>
                              {s.totalAmount === 0 ? (
                                <span className="sm-type-badge" style={{ backgroundColor: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}>
                                  💳 Payment
                                </span>
                              ) : (
                                <span className={`sm-type-badge ${s.type === 'Bird' ? 'type-bird' : 'type-egg'}`}>
                                  {s.type === 'Bird' ? '🐔 Bird' : '🥚 Egg'}
                                </span>
                              )}
                            </td>
                            <td>
                              {s.totalAmount === 0 ? (
                                '—'
                              ) : (
                                <>
                                  {s.quantity.toLocaleString()} {s.type === 'Bird' ? 'birds' : 'eggs'}
                                  {s.type === 'Bird' && s.weightKg && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                      ({s.weightKg.toLocaleString()} kg)
                                    </div>
                                  )}
                                </>
                              )}
                            </td>
                            <td>
                              {s.totalAmount === 0 ? (
                                '—'
                              ) : s.type === 'Bird' && s.weightKg && s.pricePerKg ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                  <span>Rs {s.pricePerKg.toFixed(2)} / kg</span>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    (Rs {s.unitPrice.toFixed(2)} / bird)
                                  </span>
                                </div>
                              ) : (
                                `Rs ${s.unitPrice.toFixed(2)}`
                              )}
                            </td>
                            <td>
                              {(() => {
                                const priorBalance = salePriorBalances[s.id] ?? 0;
                                const netOutstanding = priorBalance + s.totalAmount - (s.amountPaid ?? 0);
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', alignItems: 'flex-start' }}>
                                    {priorBalance > 0 && (
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Old Bal: Rs {priorBalance.toFixed(2)}
                                      </span>
                                    )}
                                    <span style={{ fontSize: '0.85rem' }}>Billed: <strong>Rs {s.totalAmount.toFixed(2)}</strong></span>
                                    {netOutstanding > 0 ? (
                                      <span style={{ fontSize: '0.78rem', color: 'var(--color-rose)', fontWeight: 'bold' }}>
                                        Balance Due: Rs {netOutstanding.toFixed(2)}
                                      </span>
                                    ) : (
                                      <span className="paid-status-badge">✅ Paid</span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                            <td>
                              {s.totalAmount === 0 ? (
                                '—'
                              ) : (
                                <strong className={profit >= 0 ? "profit-amount-pos" : "profit-amount-neg"}>
                                  Rs {profit.toFixed(2)}
                                </strong>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <button type="button" className="btn btn-secondary btn-xs-custom" onClick={() => handleViewInvoice(s)}>
                                  👁️ Invoice
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-xs-custom"
                                  onClick={() => handleOpenEditSale(s)}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  type="button"
                                  className={`btn btn-xs-custom ${isSalePaid(s) ? 'btn-paid-active' : 'btn-mark-paid'}`}
                                  onClick={() => handleInitiateTogglePaid(s.id)}
                                  title={isSalePaid(s) ? 'Mark as unpaid (Admin required)' : 'Mark as paid (Admin required)'}
                                >
                                  {isSalePaid(s) ? '🔄 Unmark' : '✅ Mark Paid'}
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
            </>
          )}
        </div>
      )}

      {/* ── Edit Sale Modal ── */}
      <Modal
        isOpen={isEditSaleModalOpen}
        onClose={() => setIsEditSaleModalOpen(false)}
        title={`✏️ Edit Sale Invoice: ${sales.find(s => s.id === editingSaleId)?.invoiceId || ''}`}
        footer={
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            {/* Left: danger delete */}
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => {
                const inv = sales.find(s => s.id === editingSaleId);
                if (inv && window.confirm(`Delete invoice ${inv.invoiceId}? This cannot be undone.`)) {
                  deleteSale(editingSaleId);
                  setIsEditSaleModalOpen(false);
                }
              }}
            >
              🗑️ Delete Invoice
            </button>
            {/* Right: cancel + save */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" type="button" onClick={() => setIsEditSaleModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" type="submit" form="edit-sale-form">Save Changes</button>
            </div>
          </div>
        }
      >
        <form id="edit-sale-form" onSubmit={handleEditSaleSubmit} className="modal-form-grid">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sale Date</label>
              <input type="date" className="form-control" value={editSaleDate} onChange={e => setEditSaleDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Sale Type</label>
              <select className="form-control" value={editSaleType} onChange={e => setEditSaleType(e.target.value as 'Bird' | 'Egg')}>
                <option value="Bird">🐔 Bird Sale</option>
                <option value="Egg">🥚 Egg Sale</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input type="text" className="form-control" value={editSaleCustomerName} onChange={e => setEditSaleCustomerName(e.target.value)} maxLength={128} required />
            </div>
            <div className="form-group">
              <label className="form-label">Customer Contact</label>
              <input type="text" className="form-control" value={editSaleCustomerContact} onChange={e => setEditSaleCustomerContact(e.target.value)} maxLength={32} required />
            </div>
          </div>

          {editSaleType === 'Bird' && (batches.find(b => b.id === editSaleBatchId)?.type === 'Broiler' || editSaleWeightKg > 0) ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Number of Birds Sold</label>
                  <input type="number" min="1" className="form-control" value={editSaleQty === 0 ? '' : editSaleQty} onChange={e => setEditSaleQty(Number(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Weight (Kg)</label>
                  <input type="number" step="0.01" min="0.01" className="form-control" value={editSaleWeightKg || ''} onChange={e => setEditSaleWeightKg(Number(e.target.value))} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Price per Kg (Rs)</label>
                  <input type="number" step="0.01" min="0.01" className="form-control" value={editSalePricePerKg || ''} onChange={e => setEditSalePricePerKg(Number(e.target.value))} required />
                </div>
              </div>
            </>
          ) : (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity ({editSaleType === 'Bird' ? 'birds' : 'eggs'})</label>
                <input type="number" min="1" className="form-control" value={editSaleQty === 0 ? '' : editSaleQty} onChange={e => setEditSaleQty(Number(e.target.value))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Price per {editSaleType === 'Bird' ? 'Bird' : 'Egg'} (Rs)</label>
                <input type="number" step="0.01" min="0.01" className="form-control" value={editSaleUnitPrice === 0 ? '' : editSaleUnitPrice} onChange={e => setEditSaleUnitPrice(Number(e.target.value))} required />
              </div>
            </div>
          )}

          {editSaleType === 'Bird' && (
            <div className="form-group">
              <label className="form-label">Target Batch ID</label>
              <select className="form-control" value={editSaleBatchId} onChange={e => setEditSaleBatchId(e.target.value)} required>
                <option value="">Select batch...</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.id} — {b.type} ({b.status === 'Active' ? `${b.currentQuantity.toLocaleString()} available` : 'Sold'})</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', marginBottom: '0.4rem' }}>
            <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.83rem' }}>
              Additional Charges & Adjustments
            </label>
            <button type="button" className="btn-nice-outline" onClick={handleAddEditCharge} style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--color-emerald)', fontSize: '0.76rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '20px', cursor: 'pointer' }}>
              ➕ Add Charge
            </button>
          </div>
          {editSaleAdditionalCharges.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.75rem' }}>
              {editSaleAdditionalCharges.map(chg => {
                const isPreset = PRESET_CHARGES.includes(chg.name);
                const selectValue = isPreset ? chg.name : 'Other (Custom...)';
                return (
                  <div key={chg.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                      <select className="form-control form-control-sm" style={{ flex: 1, fontSize: '0.82rem', padding: '0.3rem 0.5rem' }} value={selectValue} onChange={e => handleUpdateEditCharge(chg.id, 'name', e.target.value === 'Other (Custom...)' ? 'Custom Charge Description' : e.target.value)}>
                        <option value="Transport">Transport</option>
                        <option value="Loading">Loading</option>
                        <option value="Discount">Discount</option>
                        <option value="Previous Arrears">Previous Arrears</option>
                        <option value="GST / Tax">GST / Tax</option>
                        <option value="Packing Fee">Packing Fee</option>
                        <option value="Handling">Handling</option>
                        <option value="Other (Custom...)">Other (Custom...)</option>
                      </select>
                      <input type="number" step="0.01" className="form-control form-control-sm" style={{ width: '100px', fontSize: '0.82rem', padding: '0.3rem 0.5rem', textAlign: 'right' }} placeholder="0.00" value={chg.amount || ''} onChange={e => handleUpdateEditCharge(chg.id, 'amount', Number(e.target.value))} />
                      <button type="button" onClick={() => handleRemoveEditCharge(chg.id)} style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', color: '#f43f5e', fontSize: '0.8rem', fontWeight: 700, width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                    {!isPreset && (
                      <input type="text" className="form-control form-control-sm" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }} placeholder="Type custom charge name..." value={chg.name} onChange={e => handleUpdateEditCharge(chg.id, 'name', e.target.value)} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Old Balance (Rs)</label>
              <input type="number" 
                step="0.01" 
                className="form-control" 
                value={editSaleOldBalance === 0 ? '' : editSaleOldBalance} 
                onChange={e => setEditSaleOldBalance(Number(e.target.value))} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Amount Paid (Rs)</label>
              <input type="number" 
                step="0.01" 
                min="0" 
                className="form-control" 
                value={editSaleAmountPaid === 0 ? '' : editSaleAmountPaid} 
                onChange={e => setEditSaleAmountPaid(Number(e.target.value))} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Details / Remarks</label>
            <input type="text" className="form-control" value={editSaleDetails} onChange={e => setEditSaleDetails(e.target.value)} maxLength={256} />
          </div>

          {editSaleQty > 0 && (editSaleType === 'Bird' && (batches.find(b => b.id === editSaleBatchId)?.type === 'Broiler' || editSaleWeightKg > 0) ? (editSaleWeightKg > 0 && editSalePricePerKg > 0) : (editSaleUnitPrice > 0)) && (
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
              {(() => {
                const subtotal = editSaleType === 'Bird' && editSaleWeightKg > 0
                  ? Number(editSaleWeightKg) * Number(editSalePricePerKg)
                  : Number(editSaleQty) * Number(editSaleUnitPrice);
                const totalAdd = editSaleAdditionalCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
                const grandTotal = subtotal + totalAdd;
                const totalOutstanding = grandTotal + editSaleOldBalance;
                const remaining = totalOutstanding - editSaleAmountPaid;
                return (
                  <>
                    {editSaleType === 'Bird' && editSaleWeightKg > 0 && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                          <span>Total Weight</span>
                          <strong>{editSaleWeightKg.toLocaleString()} kg</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                          <span>Price per Kg</span>
                          <strong>Rs {editSalePricePerKg.toFixed(2)}/kg</strong>
                        </div>
                      </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      <span>Subtotal</span>
                      <strong>Rs {subtotal.toFixed(2)}</strong>
                    </div>
                    {editSaleAdditionalCharges.map(c => {
                      if (!c.amount && c.amount !== 0) return null;
                      return (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                          <span>{c.name}</span>
                          <strong style={{ color: c.amount < 0 ? '#b91c1c' : 'inherit' }}>
                            {c.amount < 0 ? '- Rs ' : '+ Rs '}
                            {Math.abs(c.amount).toFixed(2)}
                          </strong>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: 'var(--text-primary)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.25rem' }}>
                      <span>Grand Total</span>
                      <strong>Rs {grandTotal.toFixed(2)}</strong>
                    </div>
                    {editSaleOldBalance > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                        <span>Old Balance</span>
                        <strong>+ Rs {editSaleOldBalance.toFixed(2)}</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '700', color: 'var(--color-emerald)', borderTop: '1px solid rgba(16,185,129,0.2)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                      <span>Total Outstanding</span>
                      <strong>Rs {totalOutstanding.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--color-emerald)' }}>
                      <span>Amount Paid</span>
                      <strong>Rs {editSaleAmountPaid.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: 'bold', color: remaining > 0 ? 'var(--color-rose)' : 'var(--color-emerald)', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.25rem' }}>
                      <span>{remaining > 0 ? 'Balance Due' : 'Change/Overpaid'}</span>
                      <strong>Rs {Math.abs(remaining).toFixed(2)}</strong>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </form>
      </Modal>

      {/* ── Invoice Viewer Modal ── */}
      <Modal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        title={``}
        footer={
          <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setIsInvoiceOpen(false)}>Close</button>
            <button className="btn btn-primary" onClick={handlePrint}>🖨️ Print Invoice</button>
          </div>
        }
      >
        {activeInvoice && (
          <div className="printable-invoice-container print-invoice">
            <div className="invoice-header-branding">
              <div>
                <h2>Aksha Poultry Farms & Traders</h2>
                <p className="inv-subtitle">Premium Poultry Farm Management</p>
                <p className="inv-address">423/1, Kekunagolla, Kekunagolla</p>
                <p className="inv-address">📞 +94768470361</p>
              </div>
              <div className="invoice-id-block">
                <div className="invoice-label">{activeInvoice.totalAmount === 0 ? 'PAYMENT RECEIPT' : 'INVOICE'}</div>
                <div className="invoice-meta-row"><span>No:</span><strong>{activeInvoice.invoiceId}</strong></div>
                <div className="invoice-meta-row"><span>Date:</span><strong>{activeInvoice.date}</strong></div>
              </div>
            </div>

            <div className="invoice-addresses">
              <div className="address-block">
                <h5>Billed To</h5>
                <p><strong>{activeInvoice.customerName}</strong></p>
                <p className="inv-contact">📞 {activeInvoice.customerContact}</p>
              </div>
            </div>

            {/* Invoice Line Items Table */}
            {activeInvoice.totalAmount === 0 ? (
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="inv-item-desc">Customer Payment Received</div>
                      {activeInvoice.details && (
                        <div className="inv-item-note">{activeInvoice.details}</div>
                      )}
                    </td>
                    <td><strong>Rs {(activeInvoice.amountPaid ?? 0).toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            ) : activeInvoice.type === 'Egg' ? (
              // ── Egg Sale Invoice ──
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Rate (Rs)</th>
                    <th style={{ textAlign: 'right' }}>Amount (Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Main Egg Line */}
                  <tr>
                    <td>
                      <div className="inv-item-desc">Fresh Eggs</div>
                      {activeInvoice.details && (
                        <div className="inv-item-note">{activeInvoice.details}</div>
                      )}
                    </td>
                    <td>{activeInvoice.quantity.toLocaleString()} eggs</td>
                    <td>Rs {activeInvoice.unitPrice.toFixed(4)}</td>
                    <td style={{ textAlign: 'right' }}><strong>Rs {(activeInvoice.quantity * activeInvoice.unitPrice).toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            ) : (
              // ── Bird Sale Invoice ──
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="inv-item-desc">Live Poultry Birds (Batch: {activeInvoice.batchId})</div>
                      {activeInvoice.weightKg && (
                        <div className="inv-item-note">Weight-based sale: {activeInvoice.weightKg.toLocaleString()} kg</div>
                      )}
                      {activeInvoice.details && (
                        <div className="inv-item-note">{activeInvoice.details}</div>
                      )}
                    </td>
                    <td>
                      {activeInvoice.quantity.toLocaleString()} birds
                      {activeInvoice.weightKg && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          ({activeInvoice.weightKg.toLocaleString()} kg total)
                        </div>
                      )}
                    </td>
                    <td>
                      {activeInvoice.weightKg && activeInvoice.pricePerKg ? (
                        <>
                          Rs {activeInvoice.pricePerKg.toFixed(2)} / kg
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            (Rs {activeInvoice.unitPrice.toFixed(2)} / bird)
                          </div>
                        </>
                      ) : (
                        `Rs ${activeInvoice.unitPrice.toFixed(2)}`
                      )}
                    </td>
                    <td><strong>Rs {((activeInvoice.weightKg && activeInvoice.pricePerKg ? activeInvoice.weightKg * activeInvoice.pricePerKg : activeInvoice.quantity * activeInvoice.unitPrice)).toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* Calculations Summary */}
            <div className="invoice-calculations">
              {activeInvoice.totalAmount === 0 ? (
                <>
                  <div className="calc-row grand-total">
                    <span>Amount Received:</span>
                    <span>Rs {(activeInvoice.amountPaid ?? 0).toFixed(2)}</span>
                  </div>
                </>
              ) : activeInvoice.type === 'Egg' ? (
                // ── Egg Sale Clean Bill Summary ──
                (() => {
                  const transport = activeInvoice.transportCharges ?? 0;
                  const other = activeInvoice.otherCharges ?? 0;
                  const invoiceTotal = activeInvoice.totalAmount; // totalAmount is already the full grand total
                  const subtotal = activeInvoice.quantity * activeInvoice.unitPrice;
                  const paid = activeInvoice.amountPaid ?? 0;
                  const balanceDue = invoiceTotal - paid;
                  return (
                    <>
                      <div className="calc-row">
                        <span>Eggs Subtotal:</span>
                        <span>Rs {subtotal.toFixed(2)}</span>
                      </div>
                      {activeInvoice.extraChargesList && activeInvoice.extraChargesList.length > 0 ? (
                        activeInvoice.extraChargesList.map((c: any, i: number) => (
                          <div key={i} className="calc-row charge-addition">
                            <span>{c.amount < 0 ? '-' : '+'} {c.name}:</span>
                            <span className="charge-pos-val" style={{ color: c.amount < 0 ? '#b91c1c' : 'inherit' }}>
                              {c.amount < 0 ? '- Rs ' : 'Rs '}
                              {Math.abs(c.amount).toFixed(2)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <>
                          {transport > 0 && (
                            <div className="calc-row charge-addition">
                              <span>+ Transport Charges:</span>
                              <span className="charge-pos-val">Rs {transport.toFixed(2)}</span>
                            </div>
                          )}
                          {other > 0 && (
                            <div className="calc-row charge-addition">
                              <span>+ Other Charges:</span>
                              <span className="charge-pos-val">Rs {other.toFixed(2)}</span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="calc-row grand-total">
                        <span>Invoice Total:</span>
                        <span>Rs {invoiceTotal.toFixed(2)}</span>
                      </div>
                      <div className="calc-row payment-given-row">
                        <span>Amount Paid Now:</span>
                        <span>Rs {paid.toFixed(2)}</span>
                      </div>
                      {balanceDue > 0 && (
                        <div className="calc-row balance-row" style={{ color: '#b91c1c', fontWeight: 800, fontSize: '1.05rem', borderTop: '2px solid #b91c1c', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                          <span>Balance Due:</span>
                          <strong style={{ color: '#b91c1c' }}>Rs {balanceDue.toFixed(2)}</strong>
                        </div>
                      )}
                      {balanceDue < 0 && (
                        <div className="calc-row balance-row change-positive">
                          <span>Change / Overpaid:</span>
                          <strong>Rs {Math.abs(balanceDue).toFixed(2)}</strong>
                        </div>
                      )}
                    </>
                  );
                })()
              ) : (
                // ── Bird Sale Summary ──
                (() => {
                  const savedTransport = activeInvoice.transportCharges || 0;
                  const savedOther = activeInvoice.otherCharges || 0;
                  const subtotal = activeInvoice.totalAmount - savedTransport - savedOther;
                  const totalExtras = extraCharges.reduce((s, c) => s + c.amount, 0);
                  const grandTotal = activeInvoice.totalAmount + totalExtras;
                  const totalToPay = grandTotal + oldBalance;
                  const change = amountPaid - totalToPay;
                  return (
                    <>
                      <div className="calc-row"><span>Subtotal:</span><span>Rs {subtotal.toFixed(2)}</span></div>

                      {activeInvoice.extraChargesList && activeInvoice.extraChargesList.length > 0 ? (
                        activeInvoice.extraChargesList.map((c: any, i: number) => (
                          <div key={i} className="calc-row charge-addition">
                            <span>{c.amount < 0 ? '-' : '+'} {c.name}:</span>
                            <span className="charge-pos-val" style={{ color: c.amount < 0 ? '#b91c1c' : 'inherit' }}>
                              {c.amount < 0 ? '- Rs ' : 'Rs '}
                              {Math.abs(c.amount).toFixed(2)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <>
                          {savedTransport > 0 && (
                            <div className="calc-row charge-addition">
                              <span>+ Transport Charges:</span>
                              <span className="charge-pos-val">Rs {savedTransport.toFixed(2)}</span>
                            </div>
                          )}
                          {savedOther > 0 && (
                            <div className="calc-row charge-addition">
                              <span>+ Other Charges:</span>
                              <span className="charge-pos-val">Rs {savedOther.toFixed(2)}</span>
                            </div>
                          )}
                        </>
                      )}

                      {extraCharges.map((c, i) => (
                        <div key={i} className={`calc-row extra-charge-row ${c.amount < 0 ? 'charge-deduction' : 'charge-addition'}`}>
                          <span>{c.amount < 0 ? '− ' : '+ '}{c.label}:</span>
                          <span className="extra-charge-right">
                            <span className={c.amount < 0 ? 'charge-neg-val' : 'charge-pos-val'}>
                              {c.amount < 0 ? '−' : '+'} Rs {Math.abs(c.amount).toFixed(2)}
                            </span>
                            <button
                              type="button"
                              className="remove-charge-btn"
                              onClick={() => {
                                const updated = extraCharges.filter((_, idx) => idx !== i);
                                setExtraCharges(updated);
                              }}
                              title="Remove charge"
                            >✕</button>
                          </span>
                        </div>
                      ))}

                      <div className="add-charge-row">
                        <select className="charge-label-select" value={newChargeLabel} onChange={e => setNewChargeLabel(e.target.value)}>
                          <option>Transport</option>
                          <option>Packing</option>
                          <option>Loading</option>
                          <option>Handling</option>
                          <option>Discount</option>
                          <option>Advance Deduction</option>
                          <option>Other</option>
                        </select>
                        <button type="button" className={`charge-sign-toggle ${newChargeAmount < 0 ? 'sign-neg' : 'sign-pos'}`}
                          title={newChargeAmount < 0 ? 'Deduction. Click to switch' : 'Addition. Click to switch'}
                          onClick={() => setNewChargeAmount(prev => prev === 0 ? -0.01 : -prev)}>
                          {newChargeAmount < 0 ? '−' : '+'}
                        </button>
                        <input type="number" step="0.01" min="0" className="charge-amount-input" placeholder="Amount"
                          value={newChargeAmount === 0 ? '' : Math.abs(newChargeAmount)}
                          onChange={e => { const abs = Math.abs(Number(e.target.value)); setNewChargeAmount(newChargeAmount < 0 ? -abs : abs); }}
                        />
                        <button type="button" className="add-charge-btn"
                          onClick={() => { if (newChargeAmount !== 0) { setExtraCharges([...extraCharges, { label: newChargeLabel, amount: newChargeAmount }]); setNewChargeAmount(0); } }}>
                          + Add
                        </button>
                      </div>

                      <div className="calc-row grand-total"><span>Grand Total:</span><span>Rs {grandTotal.toFixed(2)}</span></div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                        <div className="calc-row" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                          <span>Old Balance:</span>
                          <strong>Rs {oldBalance.toFixed(2)}</strong>
                        </div>
                        <div className="calc-row" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                          <span>Current Outstanding Balance:</span>
                          <strong>Rs {Math.max(0, grandTotal - amountPaid).toFixed(2)}</strong>
                        </div>
                      </div>

                      <div className="calc-row payment-given-row">
                        <span>Payment Given:</span>
                        <span>Rs {amountPaid.toFixed(2)}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                        {change >= 0 ? (
                          change > 0 && (
                            <div className="calc-row balance-row change-positive">
                              <span>Change to Return / Credit:</span>
                              <strong>Rs {change.toFixed(2)}</strong>
                            </div>
                          )
                        ) : (
                          <div className="calc-row balance-row balance-due" style={{ color: 'var(--color-rose)' }}>
                            <span>Final Net Due:</span>
                            <strong>Rs {(-change).toFixed(2)}</strong>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()
              )}
            </div>

            <div className="invoice-footer-notes">
              <p>Thank you for your business!</p>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Customer Ledger Statement Printable Modal ── */}
      <Modal
        isOpen={isCustomerStatementOpen}
        onClose={() => setIsCustomerStatementOpen(false)}
        title={`🖨️ Customer Account Statement: ${statementCustomer?.name || ''}`}
        footer={
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setIsCustomerStatementOpen(false)}>Close</button>
            <button className="btn btn-primary" onClick={handlePrint}>🖨️ Print Statement</button>
          </div>
        }
      >
        {statementCustomer && (
          <div className="printable-invoice-container print-invoice">
            <div className="invoice-header-branding">
              <div>
                <h2>Aksha Poultry Farms & Traders</h2>
                <p className="inv-subtitle">Customer Account & Ledger Invoice Statement</p>
                <p className="inv-address">423/1, Kekunagolla, Kekunagolla | 📞 +94768470361</p>
              </div>
              <div className="invoice-id-block">
                <div className="invoice-label">STATEMENT</div>
                <div className="invoice-meta-row"><span>Date:</span><strong>{new Date().toISOString().split('T')[0]}</strong></div>
              </div>
            </div>

            <div className="invoice-addresses">
              <div className="address-block">
                <h5>Billed To / Customer Details</h5>
                <p><strong>{statementCustomer.name}</strong></p>
                {statementCustomer.contact && statementCustomer.contact !== 'N/A' && (
                  <p className="inv-contact">📞 {statementCustomer.contact}</p>
                )}
              </div>
              <div className="address-block invoice-status-block">
                <h5>Net Balance Due</h5>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: statementCustomer.billed - statementCustomer.paid > 0 ? 'var(--color-rose)' : 'var(--color-emerald)' }}>
                  Rs {(statementCustomer.billed - statementCustomer.paid).toFixed(2)}
                </div>
                <div style={{ marginTop: '0.4rem' }}>
                  {statementCustomer.billed - statementCustomer.paid > 0 ? (
                    <span className="partial-badge">⏳ OUTSTANDING NET DUE</span>
                  ) : (
                    <span className="paid-badge">✅ FULLY SETTLED</span>
                  )}
                </div>
              </div>
            </div>

            <h4 style={{ margin: '1.25rem 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Transaction History for {statementCustomer.name}
            </h4>

            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Description / Type</th>
                  <th style={{ textAlign: 'right' }}>Billed (Rs)</th>
                  <th style={{ textAlign: 'right' }}>Paid (Rs)</th>
                  <th style={{ textAlign: 'right' }}>Net Due (Rs)</th>
                </tr>
              </thead>
              <tbody>
                {sales
                  .filter(s => s.customerName.trim().toLowerCase() === statementCustomer.name.trim().toLowerCase())
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((s, idx) => {
                    const due = s.totalAmount - (s.amountPaid ?? 0);
                    return (
                      <tr key={s.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{idx + 1}</td>
                        <td>{s.date}</td>
                        <td>
                          {s.totalAmount === 0
                            ? 'Customer Payment Received'
                            : `${s.type === 'Bird' ? '🐔 Birds' : '🥚 Eggs'} (${s.quantity.toLocaleString()} qty)`}
                        </td>
                        <td style={{ textAlign: 'right' }}>Rs {s.totalAmount.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-emerald)' }}>Rs {(s.amountPaid ?? 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: due > 0 ? 'var(--color-rose)' : 'var(--color-emerald)' }}>
                          Rs {due.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            <div className="invoice-calculations" style={{ marginTop: '1.2rem' }}>
              <div className="calc-row">
                <span>Total Billed Amount:</span>
                <span>Rs {statementCustomer.billed.toFixed(2)}</span>
              </div>
              <div className="calc-row">
                <span>Total Amount Paid:</span>
                <span className="charge-pos-val">Rs {statementCustomer.paid.toFixed(2)}</span>
              </div>
              <div className="calc-row grand-total" style={{ borderTop: '2px solid rgba(16,185,129,0.3)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                <span>Final Account Net Due:</span>
                <strong style={{ color: statementCustomer.billed - statementCustomer.paid > 0 ? 'var(--color-rose)' : 'var(--color-emerald)' }}>
                  Rs {(statementCustomer.billed - statementCustomer.paid).toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="invoice-footer-notes" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <p>Statement of Account for {statementCustomer.name} · Aksha Farm Management</p>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Admin Password Approval Modal for Mark Paid ── */}
      <Modal
        isOpen={isAdminAuthModalOpen}
        onClose={() => {
          setIsAdminAuthModalOpen(false);
          setPendingPaidSaleId(null);
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
                setPendingPaidSaleId(null);
                setAdminPasswordInput('');
                setAdminAuthError('');
              }}
            >
              Cancel
            </button>
            <button className="btn btn-success" type="button" onClick={handleVerifyAdminAndExecute}>
              🔑 Verify & Update Payment
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
              Marking an invoice as paid or updating payment status requires administrator verification.
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
        .sales-stats-row {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-md); margin-bottom: var(--spacing-lg);
        }
        @media (max-width: 900px) { .sales-stats-row { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px)  { .sales-stats-row { grid-template-columns: 1fr; } }

        .sales-stat-card {
          background: var(--bg-card); border: 1px solid var(--border-color);
          border-radius: var(--radius-md); padding: var(--spacing-md) var(--spacing-lg);
          display: flex; align-items: center; gap: var(--spacing-md);
          backdrop-filter: var(--glass-blur);
          transition: border-color var(--transition-fast), transform var(--transition-fast);
        }
        .sales-stat-card:hover { border-color: var(--border-color-hover); transform: translateY(-2px); }
        .sales-stat-icon  { font-size: 1.75rem; }
        .sales-stat-value { font-size: 1.2rem; font-weight: 700; color: var(--text-primary); }
        .sales-stat-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 0.1rem; }

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
        .sales-quick-actions { display: flex; gap: var(--spacing-sm); flex-wrap: wrap; }

        .sm-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-lg); flex-wrap: wrap; gap: var(--spacing-md); }
        .sm-card-header h3 { margin: 0; }

        /* Ledger Filter Controls */
        .ledger-filter-controls {
          display: flex;
          gap: 0.35rem;
          background: rgba(22, 31, 48, 0.4);
          padding: 0.2rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
        }
        .ledger-filter-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-xs);
          cursor: pointer;
          font-family: var(--font-family);
          font-weight: 600;
          font-size: 0.78rem;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .ledger-filter-btn:hover {
          color: var(--text-primary);
        }
        .ledger-filter-btn.active {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
        }

        /* Ledger Summary Mini Bar */
        .ledger-summary-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }
        @media (max-width: 600px) {
          .ledger-summary-bar {
            grid-template-columns: 1fr;
            gap: var(--spacing-sm);
          }
        }
        .ledger-summary-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .ledger-summary-label {
          font-size: 0.68rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .ledger-summary-value {
          font-size: 1.05rem;
          font-weight: 700;
        }
        .color-emerald { color: var(--color-emerald) !important; }
        .color-rose { color: var(--color-rose) !important; }

        /* Profit Column Values */
        .profit-amount-pos {
          color: var(--color-emerald);
        }
        .profit-amount-neg {
          color: var(--color-rose);
        }

        .invoice-badge {
          font-family: monospace; background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color); padding: 0.2rem 0.5rem;
          border-radius: var(--radius-sm); font-weight: 700; font-size: 0.82rem;
        }

        .customer-cell { display: flex; flex-direction: column; gap: 0.1rem; }
        .customer-contact { font-size: 0.75rem; color: var(--text-muted); }

        .sm-type-badge {
          font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem;
          border-radius: 999px; display: inline-block;
        }
        .type-bird { background: rgba(245,158,11,0.12); color: var(--color-amber); }
        .type-egg  { background: rgba(16,185,129,0.12); color: var(--color-emerald); }

        .revenue-amount { color: var(--color-emerald); }
        .btn-xs-custom  { padding: 0.3rem 0.65rem; font-size: 0.72rem; font-weight: 600; border-radius: var(--radius-sm); }

        /* Mark Paid buttons */
        .btn-mark-paid {
          background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3);
          color: var(--color-emerald); font-family: var(--font-family);
          cursor: pointer; transition: all var(--transition-fast);
        }
        .btn-mark-paid:hover { background: rgba(16,185,129,0.22); }
        .btn-paid-active {
          background: rgba(255,255,255,0.06); border: 1px solid var(--border-color);
          color: var(--text-muted); font-family: var(--font-family);
          cursor: pointer; transition: all var(--transition-fast);
        }
        .btn-paid-active:hover { background: rgba(239,68,68,0.1); color: var(--color-rose); border-color: rgba(239,68,68,0.3); }

        /* Paid status badge in Total column */
        .paid-status-badge {
          font-size: 0.65rem; font-weight: 700;
          background: rgba(16,185,129,0.12); color: var(--color-emerald);
          border: 1px solid rgba(16,185,129,0.25); border-radius: 999px;
          padding: 0.1rem 0.45rem; white-space: nowrap;
        }

        .sm-empty-state { text-align: center; padding: var(--spacing-xl) 0; color: var(--text-muted); }
        .sm-empty-icon  { font-size: 2.5rem; margin-bottom: 0.5rem; }

        .sm-sale-form-wrapper { display: flex; justify-content: center; }
        .sm-sale-form-card { width: 100%; max-width: 680px; }

        .sm-form-layout { display: flex; flex-direction: column; gap: var(--spacing-md); }
        .sm-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
        @media (max-width: 560px) { .sm-form-row { grid-template-columns: 1fr; } }

        .sm-order-summary {
          background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.15);
          border-radius: var(--radius-md); padding: var(--spacing-md) var(--spacing-lg);
          display: flex; flex-direction: column; gap: 0.4rem;
        }
        .summary-row { display: flex; justify-content: space-between; font-size: 0.88rem; color: var(--text-secondary); }
        .summary-row.summary-total {
          font-size: 1rem; font-weight: 700; color: var(--color-emerald);
          border-top: 1px solid rgba(16,185,129,0.2); padding-top: 0.4rem; margin-top: 0.2rem;
        }
        .text-danger { color: var(--color-rose); }
        .sm-submit-btn { width: 100%; margin-top: 0.25rem; }

        /* ── Invoice Styles ── */
        .printable-invoice-container { padding: var(--spacing-md); font-family: var(--font-family); }

        .invoice-header-branding {
          display: flex; justify-content: space-between; align-items: flex-start;
          border-bottom: 2px solid var(--border-color);
          padding-bottom: var(--spacing-lg); margin-bottom: var(--spacing-lg);
        }
        .invoice-header-branding h2 { font-size: 1.4rem; letter-spacing: 0.05em; margin: 0 0 0.25rem; }
        .inv-subtitle { color: var(--color-emerald); font-size: 0.78rem; margin-bottom: 0.2rem; }
        .inv-address  { font-size: 0.75rem; color: var(--text-muted); }

        .invoice-id-block { text-align: right; }
        .invoice-label { font-size: 1.2rem; font-weight: 800; color: var(--color-emerald); letter-spacing: 0.1em; margin-bottom: 0.5rem; }
        .invoice-meta-row { display: flex; gap: 0.5rem; justify-content: flex-end; font-size: 0.85rem; margin-bottom: 0.15rem; }

        .invoice-addresses { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-xl); }
        .address-block h5 { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem; letter-spacing: 0.05em; }
        .inv-contact { font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.2rem; }
        .invoice-status-block { text-align: right; }
        .paid-badge {
          background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25);
          color: var(--color-emerald); padding: 0.3rem 0.75rem; border-radius: 999px;
          font-size: 0.8rem; font-weight: 700;
        }
        .partial-badge {
          background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.25);
          color: var(--color-amber); padding: 0.3rem 0.75rem; border-radius: 999px;
          font-size: 0.8rem; font-weight: 700;
        }
        .inv-paid-input {
          width: 110px; padding: 0.25rem 0.5rem; font-size: 0.88rem; font-weight: 600;
          background: rgba(255,255,255,0.06); border: 1px solid var(--border-color-hover);
          border-radius: var(--radius-sm); color: var(--text-primary);
          text-align: right; font-family: var(--font-family);
        }
        .inv-paid-input-header {
          width: auto; max-width: 140px; font-size: 0.9rem; padding: 0.3rem 0.5rem; text-align: right;
          border-color: rgba(16,185,129,0.3); display: block;
        }
        .inv-paid-input-header:focus { border-color: var(--color-emerald); }
        .inv-paid-input:focus { outline: none; border-color: var(--color-emerald); }
        .payment-input-row { align-items: center; margin-top: 0.5rem; }
        .balance-row { font-size: 1rem; font-weight: 700; border-top: 1px solid var(--border-color-hover); padding-top: 0.5rem; margin-top: 0.15rem; }
        .change-positive { color: var(--color-emerald); }
        .balance-due { color: var(--text-primary); }
        .payment-given-row {
          color: var(--color-amber); font-weight: 600;
          border-top: 1px dashed rgba(245,158,11,0.25); padding-top: 0.4rem; margin-top: 0.1rem;
        }

        .invoice-items-table { width: 100%; border-collapse: collapse; margin-bottom: var(--spacing-xl); }
        .invoice-items-table th { border-bottom: 1px solid var(--border-color-hover); padding-bottom: 0.5rem; font-size: 0.75rem; color: var(--text-secondary); text-align: left; }
        .invoice-items-table td { border-bottom: 1px solid var(--border-color); padding: 0.85rem 0; vertical-align: top; }
        .inv-item-desc { font-weight: 500; }
        .inv-item-note { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; }

        .invoice-calculations {
          margin-left: auto; width: 320px;
          border-top: 1px solid var(--border-color-hover); padding-top: var(--spacing-md);
          margin-bottom: var(--spacing-xl); display: flex; flex-direction: column; gap: 0.4rem;
        }
        .calc-row { display: flex; justify-content: space-between; font-size: 0.88rem; color: var(--text-secondary); }
        .calc-row.grand-total {
          font-size: 1rem; font-weight: 700; color: var(--text-primary);
          border-top: 1px solid var(--border-color-hover); padding-top: 0.5rem; margin-top: 0.25rem;
        }


        /* Extra charge rows */
        .extra-charge-row { }
        .charge-addition { color: #38bdf8; }
        .charge-deduction { color: var(--color-rose); }
        .charge-pos-val { color: #38bdf8; font-weight: 600; }
        .charge-neg-val { color: var(--color-rose); font-weight: 600; }
        .extra-charge-right { display: flex; align-items: center; gap: 0.35rem; }

        /* ± sign toggle button */
        .charge-sign-toggle {
          width: 1.6rem; height: 1.6rem; flex-shrink: 0;
          border-radius: var(--radius-sm); font-size: 0.95rem; font-weight: 800;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          border: 1px solid; transition: all var(--transition-fast); font-family: var(--font-family);
          line-height: 1;
        }
        .charge-sign-toggle.sign-pos {
          background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.35);
          color: var(--color-emerald);
        }
        .charge-sign-toggle.sign-pos:hover {
          background: rgba(16,185,129,0.25);
        }
        .charge-sign-toggle.sign-neg {
          background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.35);
          color: var(--color-rose);
        }
        .charge-sign-toggle.sign-neg:hover {
          background: rgba(239,68,68,0.25);
        }

        .remove-charge-btn {
          background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.2);
          color: var(--color-rose); border-radius: 50%; width: 1.1rem; height: 1.1rem;
          font-size: 0.55rem; cursor: pointer; display: flex; align-items: center;
          justify-content: center; padding: 0; line-height: 1; flex-shrink: 0;
          transition: background var(--transition-fast);
        }
        .remove-charge-btn:hover { background: rgba(239,68,68,0.25); }

        /* Add charge form row */
        .add-charge-row {
          display: flex; align-items: center; gap: 0.3rem; margin-top: 0.25rem;
          padding: 0.4rem 0.5rem;
          background: rgba(255,255,255,0.03);
          border: 1px dashed var(--border-color);
          border-radius: var(--radius-sm);
        }
        .charge-label-select {
          flex: 1; background: #1e2a3a; border: 1px solid var(--border-color-hover);
          border-radius: var(--radius-sm); color: #e2e8f0;
          font-family: var(--font-family); font-size: 0.75rem; padding: 0.25rem 0.35rem;
          appearance: auto; -webkit-appearance: auto;
        }
        .charge-label-select option {
          background: #1e2a3a; color: #e2e8f0;
        }
        .charge-amount-input {
          width: 72px; background: #1e2a3a; border: 1px solid var(--border-color-hover);
          border-radius: var(--radius-sm); color: #e2e8f0;
          font-family: var(--font-family); font-size: 0.75rem; padding: 0.25rem 0.35rem;
          text-align: right;
        }
        .charge-label-select:focus, .charge-amount-input:focus { outline: none; border-color: var(--color-emerald); }
        .add-charge-btn {
          background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3);
          color: var(--color-emerald); border-radius: var(--radius-sm);
          font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.5rem;
          cursor: pointer; white-space: nowrap; font-family: var(--font-family);
          transition: background var(--transition-fast);
        }
        .add-charge-btn:hover { background: rgba(16,185,129,0.25); }

        .invoice-footer-notes {
          text-align: center; font-size: 0.78rem; color: var(--text-muted);
          border-top: 1px solid var(--border-color); padding-top: var(--spacing-md);
        }

        @page {
          margin: 1.2cm;
          /* Suppress browser-generated header/footer (URL, page number) */
          size: A4;
        }
        @media print {
          .add-charge-row { display: none !important; }
          .remove-charge-btn { display: none !important; }
          .inv-paid-input-header { display: none !important; }
          .inv-paid-print-value { display: block !important; }
          .charge-sign-toggle { display: none !important; }
          .print-only-row { display: flex !important; }
          /* Hide browser default running head/foot */
          html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .inv-paid-print-value { display: none; font-size: 0.95rem; font-weight: 700; color: #e2e8f0; }
        .print-only-row { display: none !important; }
      `}</style>

      {/* ── Receive Customer Payment Modal ── */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="💳 Receive Customer Payment"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn btn-secondary" type="button" onClick={() => setIsPaymentModalOpen(false)}>Cancel</button>
            <button className="btn btn-success" type="button" onClick={handleInitiatePayment}>Record Payment</button>
          </div>
        }
      >
        <form onSubmit={handlePaymentSubmit} className="modal-form-grid">
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Customer Type</label>
              <button 
                type="button" 
                className="btn btn-xs-custom" 
                onClick={() => {
                  setIsNewCustomer(!isNewCustomer);
                  setPaymentCustomer('');
                  setNewCustomerName('');
                  setPaymentContact('');
                }}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}
              >
                {isNewCustomer ? 'Select Existing Customer' : 'Add New Customer'}
              </button>
            </div>
            
            {isNewCustomer ? (
              <input 
                type="text" 
                className="form-control" 
                placeholder="Enter customer name..." 
                value={newCustomerName} 
                onChange={e => setNewCustomerName(e.target.value)} 
                required 
              />
            ) : (
              <select 
                className="form-control" 
                value={paymentCustomer} 
                onChange={e => {
                  setPaymentCustomer(e.target.value);
                  const match = customerBalances.find(cb => cb.name === e.target.value);
                  if (match) {
                    setPaymentContact(match.contact === 'N/A' ? '' : match.contact);
                    const outstanding = match.billed - match.paid;
                    setPaymentAmount(outstanding > 0 ? outstanding : 0);
                  }
                }} 
                required
              >
                <option value="">Choose customer...</option>
                {uniqueCustomerNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Phone number..." 
                value={paymentContact} 
                onChange={e => setPaymentContact(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={paymentDate} 
                onChange={e => setPaymentDate(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Amount (Rs)</label>
            <input type="number" 
              step="0.01" 
              min="0.01" 
              className="form-control" 
              placeholder="0.00" 
              value={paymentAmount || ''} 
              onChange={e => setPaymentAmount(Number(e.target.value))} 
              required 
            />
            {!isNewCustomer && paymentCustomer && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem', display: 'block' }}>
                Current Outstanding Balance: Rs {(() => {
                  const match = customerBalances.find(cb => cb.name === paymentCustomer);
                  return match ? (match.billed - match.paid).toFixed(2) : '0.00';
                })()}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Payment Details / Notes</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Cash, Bank Transfer, Cheque..." 
              value={paymentDetails} 
              onChange={e => setPaymentDetails(e.target.value)} 
            />
          </div>
        </form>
      </Modal>

      {/* ── Admin Password Verification Modal for Receive Payment ── */}
      <Modal
        isOpen={isPaymentAuthModalOpen}
        onClose={() => {
          setIsPaymentAuthModalOpen(false);
          setPaymentAdminPassword('');
          setPaymentAdminError('');
        }}
        title="🔐 Admin Approval Required: Record Payment"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', width: '100%' }}>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                setIsPaymentAuthModalOpen(false);
                setPaymentAdminPassword('');
                setPaymentAdminError('');
              }}
            >
              Cancel
            </button>
            <button className="btn btn-success" type="button" onClick={() => handleVerifyPaymentAdmin()}>
              🔑 Verify & Record
            </button>
          </div>
        }
      >
        <form onSubmit={handleVerifyPaymentAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              🔒 Admin Password Required
            </p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Recording a customer payment requires administrator verification.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Admin Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter Admin password..."
              value={paymentAdminPassword}
              onChange={e => {
                setPaymentAdminPassword(e.target.value);
                setPaymentAdminError('');
              }}
              autoFocus
              required
            />
          </div>
          {paymentAdminError && (
            <div style={{ color: 'var(--color-rose)', fontSize: '0.82rem', fontWeight: 600 }}>
              {paymentAdminError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

