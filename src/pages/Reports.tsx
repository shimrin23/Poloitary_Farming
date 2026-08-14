import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

export const Reports: React.FC = () => {
  const { batches, feedConsumption, eggCollections, sales, expenses } = useFarm();

  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [startDate, setStartDate] = useState(() => {
    // Default start date is 30 days ago
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Filter helper based on date
  const isDateInPeriod = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set hours to zero for clean comparison
    date.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return date >= start && date <= end;
  };

  // Adjust pre-defined date filters
  const handlePeriodChange = (newPeriod: ReportPeriod) => {
    setPeriod(newPeriod);
    const today = new Date();
    let start = new Date();

    if (newPeriod === 'daily') {
      start.setDate(today.getDate() - 1);
    } else if (newPeriod === 'weekly') {
      start.setDate(today.getDate() - 7);
    } else if (newPeriod === 'monthly') {
      start.setDate(today.getDate() - 30);
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  // ==========================================
  // METRIC CALCULATIONS FOR PERIOD
  // ==========================================

  // 1. Mortality count
  let periodMortality = 0;
  batches.forEach(b => {
    b.mortalityLogs.forEach(m => {
      if (isDateInPeriod(m.date)) {
        periodMortality += m.quantity;
      }
    });
  });

  // 2. Feed consumption
  const periodFeedConsumed = feedConsumption
    .filter(c => isDateInPeriod(c.date))
    .reduce((sum, c) => sum + c.quantityKg, 0);

  // 3. Egg Production Usable vs Damaged
  const periodEggs = eggCollections.filter(c => isDateInPeriod(c.date));
  const periodEggsUsable = periodEggs.reduce((sum, c) => sum + c.netQty, 0);
  const periodEggsDamaged = periodEggs.reduce((sum, c) => sum + c.damagedQty, 0);
  const periodEggsTotal = periodEggsUsable + periodEggsDamaged;

  // 4. Sales income
  const periodIncome = sales
    .filter(s => isDateInPeriod(s.date))
    .reduce((sum, s) => sum + s.totalAmount, 0);

  // 5. Expenses
  const periodExpense = expenses
    .filter(e => isDateInPeriod(e.date))
    .reduce((sum, e) => sum + e.amount, 0);

  const netPAndL = periodIncome - periodExpense;

  // ==========================================
  // EXPORT UTILITIES (CSV / PDF)
  // ==========================================

  const exportCSV = () => {
    const csvRows = [
      ['Date', 'Metric / Item', 'Category', 'Quantity / Value', 'Amount (Rs)'],
      // Sales
      ...sales.filter(s => isDateInPeriod(s.date)).map(s => [
        s.date,
        s.type === 'Bird' ? `Sale of Batch ${s.batchId}` : 'Sale of Eggs',
        'Sales Revenue',
        `${s.quantity} units`,
        s.totalAmount.toFixed(2)
      ]),
      // Expenses
      ...expenses.filter(e => isDateInPeriod(e.date)).map(e => [
        e.date,
        e.description,
        `Expense (${e.category})`,
        '-',
        e.amount.toFixed(2)
      ]),
      // Mortality
      ...batches.flatMap(b => b.mortalityLogs.map(m => ({ batchId: b.id, ...m })))
        .filter(m => isDateInPeriod(m.date)).map(m => [
          m.date,
          `Batch ${m.batchId} Mortality: ${m.reason}`,
          'Mortality Count',
          `${m.quantity} birds`,
          '0.00'
        ]),
      // Egg Collection
      ...eggCollections.filter(c => isDateInPeriod(c.date)).map(c => [
        c.date,
        `Usable: ${c.netQty}, Damaged: ${c.damagedQty}`,
        'Egg Collection Yield',
        `${c.collectedQty} eggs`,
        '0.00'
      ])
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + csvRows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `farm_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const periodLabel =
      period === 'daily' ? 'Daily' :
      period === 'weekly' ? 'Weekly' :
      period === 'monthly' ? 'Last 30 Days' : 'Custom Range';

    // Build audit table rows
    const salesRows = sales.filter(s => isDateInPeriod(s.date)).map(s => `
      <tr>
        <td>${s.date}</td>
        <td><b>${s.type} Sale</b> (${s.customerName})</td>
        <td><span class="badge badge-green">Revenue Income</span></td>
        <td>${s.quantity.toLocaleString()} ${s.type === 'Bird' ? 'birds' : 'eggs'}</td>
        <td class="amount-pos">+Rs ${s.totalAmount.toFixed(2)}</td>
      </tr>`).join('');

    const expenseRows = expenses.filter(e => isDateInPeriod(e.date)).map(e => `
      <tr>
        <td>${e.date}</td>
        <td>${e.description}</td>
        <td><span class="badge badge-red">Expense Outflow</span></td>
        <td>—</td>
        <td class="amount-neg">-Rs ${e.amount.toFixed(2)}</td>
      </tr>`).join('');

    const emptyRow = (!salesRows && !expenseRows)
      ? `<tr><td colspan="5" style="text-align:center;padding:2rem 0;color:#9ca3af;">No records match the selected date range.</td></tr>`
      : '';

    const pw = window.open('', '_blank', 'width=1000,height=750');
    if (!pw) return;
    pw.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Farm Report — ${startDate} to ${endDate}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4; margin: 1.5cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Outfit', sans-serif; background: #fff; color: #111827; font-size: 13px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    /* Report Header */
    .report-header { border-bottom: 2px solid #d1d5db; padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .report-header h2 { font-size: 1.3rem; letter-spacing: 0.04em; color: #111827; }
    .report-header p { font-size: 0.82rem; color: #6b7280; margin-top: 0.3rem; }
    .report-header .period-badge {
      display: inline-block; background: #d1fae5; color: #059669;
      border: 1px solid #6ee7b7; border-radius: 999px;
      padding: 0.15rem 0.65rem; font-size: 0.75rem; font-weight: 600; margin-top: 0.4rem;
    }

    /* KPI Cards */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 1.5rem; }
    .kpi-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.85rem 1rem; }
    .kpi-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; font-weight: 600; }
    .kpi-value { font-size: 1.35rem; font-weight: 800; color: #111827; margin: 0.25rem 0 0.15rem; }
    .kpi-value.green { color: #059669; }
    .kpi-value.rose { color: #dc2626; }
    .kpi-sub { font-size: 0.68rem; color: #9ca3af; }

    /* Audit Table */
    .section-title { font-size: 0.95rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem; }
    .section-sub { font-size: 0.75rem; color: #9ca3af; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; color: #374151; border-bottom: 2px solid #9ca3af; padding: 0.5rem 0.75rem; font-size: 0.72rem; text-align: left; text-transform: uppercase; letter-spacing: 0.04em; }
    td { border-bottom: 1px solid #e5e7eb; padding: 0.6rem 0.75rem; color: #374151; }
    tr:last-child td { border-bottom: none; }

    /* Badges */
    .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 600; }
    .badge-green { background: #d1fae5; color: #059669; border: 1px solid #6ee7b7; }
    .badge-red { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }

    /* Amount colours */
    .amount-pos { color: #059669; font-weight: 700; text-align: right; }
    .amount-neg { color: #dc2626; font-weight: 700; text-align: right; }

    /* Totals row */
    .totals-row { border-top: 2px solid #111827; }
    .totals-row td { font-weight: 700; color: #111827; padding-top: 0.75rem; }
  </style>
</head>
<body>
  <div class="report-header">
    <h2>AKSHA POULTRY FARMS — FARM PERFORMANCE STATEMENT</h2>
    <p><b>Period:</b> ${startDate} &nbsp;→&nbsp; ${endDate}</p>
    <span class="period-badge">${periodLabel}</span>
    <p style="margin-top:0.4rem;">Generated: ${new Date().toLocaleString()}</p>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Mortality Count</div>
      <div class="kpi-value rose">${periodMortality} birds</div>
      <div class="kpi-sub">Logged deaths during period</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Feed Consumed</div>
      <div class="kpi-value">${periodFeedConsumed.toLocaleString()} kg</div>
      <div class="kpi-sub">Total feed consumption weight</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Eggs Usable Yield</div>
      <div class="kpi-value" style="color:#d97706;">${periodEggsUsable.toLocaleString()}</div>
      <div class="kpi-sub">Damaged: ${periodEggsDamaged.toLocaleString()} eggs (${periodEggsTotal > 0 ? ((periodEggsDamaged/periodEggsTotal)*100).toFixed(1) : 0}%)</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Net Profit</div>
      <div class="kpi-value ${netPAndL >= 0 ? 'green' : 'rose'}">${netPAndL >= 0 ? '+' : ''}Rs ${netPAndL.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
      <div class="kpi-sub">Revenue: Rs ${periodIncome.toLocaleString()} | Costs: Rs ${periodExpense.toLocaleString()}</div>
    </div>
  </div>

  <div class="section-title">Consolidated Audit Grid</div>
  <div class="section-sub">Transaction journals matching the selected date filters</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Source Metric</th>
        <th>Accounting Ledger</th>
        <th>Quantity</th>
        <th style="text-align:right;">Cash Impact (Rs)</th>
      </tr>
    </thead>
    <tbody>
      ${salesRows}
      ${expenseRows}
      ${emptyRow}
    </tbody>
    ${(salesRows || expenseRows) ? `
    <tfoot>
      <tr class="totals-row">
        <td colspan="4">Period Net Total</td>
        <td class="${netPAndL >= 0 ? 'amount-pos' : 'amount-neg'}">${netPAndL >= 0 ? '+' : ''}Rs ${netPAndL.toFixed(2)}</td>
      </tr>
    </tfoot>` : ''}
  </table>

  <script>
    window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
  </script>
</body>
</html>`);
    pw.document.close();
  };

  return (
    <div className="reports-page animate-fade-in">
      <div className="page-header-actions no-print">
        <div className="filter-tabs">
          <button className={`tab-btn ${period === 'daily' ? 'active' : ''}`} onClick={() => handlePeriodChange('daily')}>Daily</button>
          <button className={`tab-btn ${period === 'weekly' ? 'active' : ''}`} onClick={() => handlePeriodChange('weekly')}>Weekly</button>
          <button className={`tab-btn ${period === 'monthly' ? 'active' : ''}`} onClick={() => handlePeriodChange('monthly')}>Last 30 Days</button>
          <button className={`tab-btn ${period === 'custom' ? 'active' : ''}`} onClick={() => setPeriod('custom')}>Custom Dates</button>
        </div>

        <div className="action-buttons-group">
          <button className="btn btn-secondary" onClick={exportCSV}>
            📥 Export CSV (Excel)
          </button>
          <button className="btn btn-primary" onClick={exportPDF}>
            📄 Print / PDF Report
          </button>
        </div>
      </div>

      {/* Date Selectors for Custom range */}
      {period === 'custom' && (
        <div className="glass-card custom-date-selector no-print" style={{ marginBottom: '1.5rem' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Printable Report Header */}
      <div className="print-report-header printable-only" style={{ display: 'none', marginBottom: '2rem' }}>
        <h2>AKSHA POULTRY FARMS - FARM PERFORMANCE STATEMENT</h2>
        <p><b>Period Range:</b> {startDate} to {endDate}</p>
        <p>Generated on {new Date().toLocaleString()}</p>
        <hr style={{ marginTop: '1rem', borderColor: '#000000' }} />
      </div>

      {/* Report Summary Cards */}
      <div className="grid-cols-4 report-kpis-container">
        <div className="glass-card r-kpi">
          <span className="r-label">Mortality Count</span>
          <h3 className="r-value color-rose">{periodMortality} birds</h3>
          <span className="r-sub">Logged deaths during period</span>
        </div>

        <div className="glass-card r-kpi">
          <span className="r-label">Feed Consumed</span>
          <h3 className="r-value">{periodFeedConsumed.toLocaleString()} kg</h3>
          <span className="r-sub">Total feed consumption weight</span>
        </div>

        <div className="glass-card r-kpi">
          <span className="r-label">Eggs Usable Yield</span>
          <h3 className="r-value text-gradient-amber">{periodEggsUsable.toLocaleString()}</h3>
          <span className="r-sub">Damage: {periodEggsDamaged.toLocaleString()} eggs ({periodEggsTotal > 0 ? ((periodEggsDamaged/periodEggsTotal)*100).toFixed(1) : 0}%)</span>
        </div>

        <div className="glass-card r-kpi">
          <span className="r-label">Statement Net Profit</span>
          <h3 className={`r-value ${netPAndL >= 0 ? 'color-emerald' : 'color-rose'}`}>
            {netPAndL >= 0 ? '+' : ''}Rs {netPAndL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </h3>
          <span className="r-sub">Revenue: Rs {periodIncome.toLocaleString()} | Costs: Rs {periodExpense.toLocaleString()}</span>
        </div>
      </div>

      {/* Consolidated Ledger Table */}
      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <h4>Consolidated Audit Grid</h4>
        <p className="chart-subtitle" style={{ marginBottom: '1.25rem' }}>Transaction journals matching the selected date filters</p>
        
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Source Metric</th>
                <th>Accounting Ledger</th>
                <th>Quantity</th>
                <th style={{ textAlign: 'right' }}>Cash Impact (Rs)</th>
              </tr>
            </thead>
            <tbody>
              {/* Sales Entries */}
              {sales.filter(s => isDateInPeriod(s.date)).map(s => (
                <tr key={`s-${s.id}`}>
                  <td>{s.date}</td>
                  <td><b>{s.type} Sale</b> ({s.customerName})</td>
                  <td><span className="badge badge-emerald">Revenue Income</span></td>
                  <td>{s.quantity.toLocaleString()} {s.type === 'Bird' ? 'birds' : 'eggs'}</td>
                  <td className="color-emerald" style={{ textAlign: 'right' }}><b>+Rs {s.totalAmount.toFixed(2)}</b></td>
                </tr>
              ))}

              {/* Expense Entries */}
              {expenses.filter(e => isDateInPeriod(e.date)).map(e => (
                <tr key={`e-${e.id}`}>
                  <td>{e.date}</td>
                  <td>{e.description}</td>
                  <td><span className="badge badge-rose">Expense Outflow</span></td>
                  <td>-</td>
                  <td className="color-rose" style={{ textAlign: 'right' }}><b>-Rs {e.amount.toFixed(2)}</b></td>
                </tr>
              ))}

              {/* Combined Empty state check */}
              {sales.filter(s => isDateInPeriod(s.date)).length === 0 && 
               expenses.filter(e => isDateInPeriod(e.date)).length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                    No audit records match the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .reports-page {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .page-header-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-lg);
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .filter-tabs {
          display: flex;
          gap: var(--spacing-sm);
          background: rgba(22, 31, 48, 0.4);
          padding: 0.25rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          flex-wrap: wrap;
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
          white-space: nowrap;
        }

        .tab-btn.active {
          background: rgba(255,255,255,0.08);
          color: var(--text-primary);
        }

        .action-buttons-group {
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }

        .report-kpis-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-lg);
        }

        @media (max-width: 1100px) {
          .report-kpis-container { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 580px) {
          .report-kpis-container { grid-template-columns: 1fr; }
        }

        .r-kpi {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          position: relative;
          overflow: hidden;
        }

        .r-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .r-value {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.15;
          word-break: break-word;
        }

        .r-value.color-rose { color: var(--color-rose); }
        .r-value.color-emerald { color: var(--color-emerald); }

        .r-sub {
          font-size: 0.7rem;
          color: var(--text-muted);
          line-height: 1.4;
          word-break: break-word;
        }

        .custom-date-selector .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }

        @media (max-width: 500px) {
          .custom-date-selector .form-row { grid-template-columns: 1fr; }
        }

        /* Print Specifics for Report Header */
        @media print {
          .printable-only {
            display: block !important;
          }
          
          .report-kpis-container {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 15px !important;
            margin-bottom: 2rem !important;
          }
          
          .r-kpi {
            border: 1px solid #000000 !important;
            padding: 10px !important;
            background: none !important;
            color: #000000 !important;
          }
          
          .r-value {
            color: #000000 !important;
            font-size: 1.1rem !important;
          }
          
          .r-sub, .r-label {
            color: #000000 !important;
          }
          
          .table-wrapper {
            margin-top: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

