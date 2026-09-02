// Dingel Hafizia App — normalized Student Fees Management v2
// Google Sheet mapping: Students master view + Active students view + Monthly collection matrix.
// Data model: students, feeStructures, feeTransactions, monthlyPayments.
(function () {
  'use strict';

  const MONTHS = [
    ['APR', 'APRL', 4], ['MAY', 'MAY', 5], ['JUN', 'JUN', 6], ['JUL', 'JUL', 7],
    ['AUG', 'AUG', 8], ['SEP', 'SEP', 9], ['OCT', 'OCT', 10], ['NOV', 'NOV', 11],
    ['DEC', 'DEC', 12], ['JAN', 'JAN', 1], ['FEB', 'FEB', 2], ['MAR', 'MAR', 3]
  ].map(([code, label, number]) => ({ code, label, number }));

  const db = firebase.firestore();
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[m]));
  const money = v => `₹${(Number(v) || 0).toFixed(2)}`;
  const currentAcademicYear = () => {
    const d = new Date();
    const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
    return `${y}-${String(y + 1).slice(-2)}`;
  };
  const monthYear = value => /^\d{4}-\d{2}$/.test(String(value)) ? String(value) : `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
  const monthMeta = value => {
    const m = monthYear(value).split('-');
    const month = Number(m[1]);
    return MONTHS.find(x => x.number === month) || MONTHS[0];
  };
  const academicYearForMonth = value => {
    const [y, m] = monthYear(value).split('-').map(Number);
    return `${m >= 4 ? y : y - 1}-${String(m >= 4 ? y + 1 : y).slice(-2)}`;
  };

  function normalizeCategory(s) {
    const raw = String(s.feeCategory || s.type || s.category || 'STANDARD').trim().toUpperCase().replace(/[ -]+/g, '_');
    if (raw === 'ATIM' || raw === 'ORPHAN') return 'ATIM';
    if (raw === 'N_RSD' || raw === 'NRSD' || raw === 'NON_RESIDENTIAL') return 'N_RSD';
    if (raw === 'POOR_FREE') return 'NO_FEE';
    return raw === 'NO_FEE' ? 'NO_FEE' : 'STANDARD';
  }

  function feeFromStudent(s) {
    const category = normalizeCategory(s);
    if (category === 'ATIM' || category === 'NO_FEE') return 0;
    return Math.max(Number(s.monthlyFee ?? s.monthlyFees ?? 0) || 0, 0);
  }

  function statusFor(expected, paid) {
    expected = Math.max(Number(expected) || 0, 0);
    paid = Math.max(Number(paid) || 0, 0);
    if (expected === 0) return 'FREE';
    if (paid === 0) return 'UNPAID';
    if (paid < expected) return 'PARTIAL';
    return 'PAID';
  }

  function calculatePayment(expected, paid) {
    expected = Math.max(Number(expected) || 0, 0);
    paid = Math.max(Number(paid) || 0, 0);
    if (expected === 0) return { expectedAmount: 0, paidAmount: 0, dueAmount: 0, status: 'FREE' };
    const safePaid = Math.min(paid, expected);
    return { expectedAmount: expected, paidAmount: safePaid, dueAmount: Math.max(expected - safePaid, 0), status: statusFor(expected, safePaid) };
  }

  let state = { students: [], structures: [], payments: [], transactions: [], month: monthYear(), year: currentAcademicYear() };

  async function loadData() {
    const [studentsSnap, structuresSnap, paymentsSnap, txSnap] = await Promise.all([
      db.collection('students').get(),
      db.collection('feeStructures').where('academicYear', '==', currentAcademicYear()).get().catch(() => ({ docs: [] })),
      db.collection('monthlyPayments').where('academicYear', '==', currentAcademicYear()).get().catch(() => ({ docs: [] })),
      db.collection('feeTransactions').where('academicYear', '==', currentAcademicYear()).get().catch(() => ({ docs: [] }))
    ]);
    state.students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    state.structures = structuresSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    state.payments = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    state.transactions = txSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    window.dhFeeV2 = state;
    render();
  }

  function activeStudents() {
    return state.students.filter(s => String(s.status || 'Active').toLowerCase() === 'active');
  }

  function structureFor(s) {
    const category = normalizeCategory(s);
    return state.structures.find(f => f.className === s.className && f.category === category && f.academicYear === state.year);
  }

  function expectedFor(s) {
    if (normalizeCategory(s) === 'ATIM' || normalizeCategory(s) === 'NO_FEE') return 0;
    const structure = structureFor(s);
    return structure ? Math.max(Number(structure.monthlyAmount) || 0, 0) : feeFromStudent(s);
  }

  function transactionsFor(studentId, month) {
    return state.transactions.filter(t => String(t.studentId) === String(studentId) && String(t.month) === month);
  }

  function paidFor(studentId, month) {
    return transactionsFor(studentId, month).reduce((sum, t) => sum + Math.max(Number(t.amount) || 0, 0), 0);
  }

  function paymentFor(studentId, month) {
    const p = state.payments.find(x => String(x.studentId) === String(studentId) && String(x.month) === month);
    return p || null;
  }

  function summary(month) {
    let target = 0, collected = 0, due = 0, paidStudents = 0, partialStudents = 0, unpaidStudents = 0, freeStudents = 0;
    activeStudents().forEach(s => {
      const expected = expectedFor(s);
      const paid = Math.min(paidFor(s.id, month), expected);
      target += expected;
      collected += paid;
      due += Math.max(expected - paid, 0);
      const status = statusFor(expected, paid);
      if (status === 'PAID') paidStudents++;
      else if (status === 'PARTIAL') partialStudents++;
      else if (status === 'UNPAID') unpaidStudents++;
      else freeStudents++;
    });
    return { target, collected, due, paidStudents, partialStudents, unpaidStudents, freeStudents };
  }

  async function ensureMonthlyPayment(s, month) {
    const expected = expectedFor(s);
    const paid = Math.min(paidFor(s.id, month), expected);
    const calc = calculatePayment(expected, paid);
    const id = `${s.id}_${month}`;
    await db.collection('monthlyPayments').doc(id).set({
      paymentId: id,
      studentId: s.id,
      roll: s.roll || s.admissionId || '',
      studentName: s.name || '',
      academicYear: academicYearForMonth(month),
      month,
      expectedAmount: calc.expectedAmount,
      paidAmount: calc.paidAmount,
      dueAmount: calc.dueAmount,
      status: calc.status,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  async function collectFee(studentId, month, amount, paymentDate, note, method) {
    const s = state.students.find(x => String(x.id) === String(studentId));
    if (!s) throw new Error('Student not found.');
    const expected = expectedFor(s);
    const existingPaid = paidFor(studentId, month);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) throw new Error('Enter a valid payment amount.');
    if (expected <= 0) throw new Error('This student has no monthly fee.');
    if (existingPaid + value > expected) throw new Error(`Payment exceeds remaining due. Remaining: ${money(Math.max(expected-existingPaid,0))}`);

    const txRef = db.collection('feeTransactions').doc();
    const receiptNo = `DHA-${txRef.id.slice(-8).toUpperCase()}`;
    await txRef.set({
      transactionId: txRef.id,
      studentId: s.id,
      roll: s.roll || s.admissionId || '',
      studentName: s.name || '',
      academicYear: academicYearForMonth(month),
      month,
      amount: value,
      paymentDate: paymentDate || new Date().toISOString().slice(0,10),
      paymentMethod: method || 'CASH',
      note: note || '',
      receiptNo,
      createdBy: window.dhAuth?.currentUser?.uid || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await ensureMonthlyPayment(s, month);
    await loadData();
    return receiptNo;
  }

  function rebuildPage() {
    const page = document.getElementById('page-fees');
    if (!page) return;
    page.innerHTML = `
      <div class="page-head"><div><h1>Fees & Monthly Collection</h1><p class="page-subtitle">Google Sheet structure — normalized, searchable and automatic</p></div><div class="fee-v2-actions"><button id="feeRefreshV2">↻ Refresh</button></div></div>
      <div class="fee-v2-toolbar"><label>Academic Year <select id="feeYearV2"></select></label><label>Month <select id="feeMonthV2"></select></label><input id="feeSearchV2" type="search" placeholder="Search roll, student, phone..." autocomplete="off"><select id="feeStatusV2"><option value="">All Status</option><option value="PAID">Paid</option><option value="PARTIAL">Partial</option><option value="UNPAID">Unpaid</option><option value="FREE">ATIM / Free</option></select></div>
      <div class="fee-v2-summary" id="feeSummaryV2"></div>
      <div class="fee-v2-scroll"><table class="fee-matrix"><thead id="feeMatrixHead"></thead><tbody id="feeMatrixBody"></tbody><tfoot id="feeMatrixFoot"></tfoot></table></div>
      <div class="fee-v2-note"><b>Logic:</b> ATIM/Free = ₹0 target and FREE status. Partial payments remain in transaction history. Paid, due and target are calculated from normalized records.</div>
      <dialog id="feeCollectV2" class="modal"><div class="modal-body"><h2>Collect Fee</h2><div id="feeCollectInfo"></div><form id="feeCollectForm"><div class="field"><label>Payment Amount *</label><input id="feeAmountV2" type="number" min="0.01" step="0.01" required inputmode="decimal"></div><div class="form-grid"><div class="field"><label>Payment Date *</label><input id="feeDateV2" type="date" required></div><div class="field"><label>Method</label><select id="feeMethodV2"><option>CASH</option><option>UPI</option><option>BANK</option><option>OTHER</option></select></div><div class="field full"><label>Note</label><input id="feeNoteV2" maxlength="200"></div></div><div class="fee-live-calc" id="feeLiveCalcV2"></div><div class="modal-actions"><button type="button" id="feeCancelV2">Cancel</button><button type="submit" class="primary-btn">Collect Fee</button></div></form></div></dialog>`;

    const yearSelect = document.getElementById('feeYearV2');
    yearSelect.innerHTML = `<option>${esc(state.year)}</option>`;
    const monthSelect = document.getElementById('feeMonthV2');
    monthSelect.innerHTML = MONTHS.map(m => `<option value="${state.year.slice(0,4)}-${String(m.number).padStart(2,'0')}">${m.label}</option>`).join('');
    const selectedMonth = monthYear(state.month);
    monthSelect.value = selectedMonth;
    document.getElementById('feeRefreshV2').onclick = loadData;
    monthSelect.onchange = () => { state.month = monthSelect.value; render(); };
    document.getElementById('feeSearchV2').oninput = renderMatrix;
    document.getElementById('feeStatusV2').onchange = renderMatrix;
  }

  function renderSummary() {
    const s = summary(state.month);
    const box = document.getElementById('feeSummaryV2');
    if (!box) return;
    box.innerHTML = [
      ['Active Students', activeStudents().length],
      ['Target / সর্ব মোট', money(s.target)],
      ['Collected / জমা', money(s.collected)],
      ['Due / বাকি', money(s.due)],
      ['Paid', s.paidStudents],
      ['Partial', s.partialStudents],
      ['Unpaid', s.unpaidStudents],
      ['ATIM / Free', s.freeStudents]
    ].map(([label, value]) => `<div class="fee-stat"><b>${esc(label)}</b><strong>${esc(value)}</strong></div>`).join('');
  }

  function renderMatrix() {
    const head = document.getElementById('feeMatrixHead');
    const body = document.getElementById('feeMatrixBody');
    const foot = document.getElementById('feeMatrixFoot');
    if (!head || !body || !foot) return;
    const q = String(document.getElementById('feeSearchV2')?.value || '').trim().toLowerCase();
    const statusFilter = document.getElementById('feeStatusV2')?.value || '';
    const active = activeStudents().filter(s => {
      const hay = [s.roll, s.admissionId, s.name, s.phone, s.guardianPhone, s.guardianName, s.className].join(' ').toLowerCase();
      if (q && !hay.includes(q)) return false;
      const st = statusFor(expectedFor(s), paidFor(s.id, state.month));
      return !statusFilter || st === statusFilter;
    }).sort((a,b) => String(a.roll || a.admissionId || a.name).localeCompare(String(b.roll || b.admissionId || b.name), undefined, {numeric:true}));

    head.innerHTML = '<tr><th>ROL</th><th>STUDENTS</th><th>PH NO</th><th>FEES</th><th>APRL</th><th>MAY</th><th>JUN</th><th>JUL</th><th>AUG</th><th>SEP</th><th>OCT</th><th>NOV</th><th>DEC</th><th>JAN</th><th>FEB</th><th>MAR</th></tr>';

    body.innerHTML = rows.map(s => {
      const expected = expectedFor(s);
      const feeLabel = expected === 0 ? (normalizeCategory(s) === 'ATIM' ? 'ATIM' : 'FREE') : money(expected);
      const cells = MONTHS.map(m => {
        const value = `${m.number < 4 ? Number(state.year.slice(0,4)) + 1 : Number(state.year.slice(0,4))}-${String(m.number).padStart(2,'0')}`;
        const paid = paidFor(s.id, value);
        const status = statusFor(expected, paid);
        let label = status === 'FREE' ? 'FREE' : status === 'PAID' ? '✓ PAID' : status === 'PARTIAL' ? money(paid) : '—';
        const cls = status.toLowerCase();
        return `<td><button class="fee-cell ${cls}" data-student="${esc(s.id)}" data-month="${value}" title="${esc(status)}">${label}</button></td>`;
      }).join('');
      return `<tr><td><b>${esc(s.roll || s.admissionId || '—')}</b></td><td><b>${esc(s.name || '—')}</b><small>${esc(s.className || '')}</small></td><td>${esc(s.phone || s.guardianPhone || '—')}</td><td><b>${feeLabel}</b></td>${cells}</tr>`;
    }).join('') || '<tr><td colspan="16" class="empty">No active students found</td></tr>';

    const totals = MONTHS.map(m => {
      const value = `${m.number < 4 ? Number(state.year.slice(0,4)) + 1 : Number(state.year.slice(0,4))}-${String(m.number).padStart(2,'0')}`;
      return { value, ...summary(value) };
    });
    const targetRow = totals.map(x => `<td>${money(x.target)}</td>`).join('');
    const collectedRow = totals.map(x => `<td>${money(x.collected)}</td>`).join('');
    const dueRow = totals.map(x => `<td>${money(x.due)}</td>`).join('');
    foot.innerHTML = `<tr class="summary-target"><th colspan="4">সর্ব মোট / TARGET</th>${targetRow}</tr><tr><th colspan="4">জমা হয়েছে / COLLECTED</th>${collectedRow}</tr><tr class="summary-due"><th colspan="4">বাকি আছে / DUE</th>${dueRow}</tr>`;

    body.querySelectorAll('.fee-cell').forEach(btn => btn.onclick = () => openCollect(btn.dataset.student, btn.dataset.month));
  }

  function openCollect(studentId, month) {
    const s = state.students.find(x => String(x.id) === String(studentId));
    if (!s) return;
    const expected = expectedFor(s);
    const already = paidFor(s.id, month);
    const due = Math.max(expected - already, 0);
    if (expected <= 0) { alert('This student is ATIM/Free. No monthly fee is required.'); return; }
    const modal = document.getElementById('feeCollectV2');
    document.getElementById('feeCollectInfo').innerHTML = `<div class="fee-collect-card"><b>${esc(s.name)}</b><span>Roll: ${esc(s.roll || s.admissionId || '—')}</span><span>Month: ${esc(month)}</span><span>Monthly Fee: ${money(expected)}</span><span>Already Paid: ${money(already)}</span><strong>Remaining Due: ${money(due)}</strong></div>`;
    const amount = document.getElementById('feeAmountV2');
    const date = document.getElementById('feeDateV2');
    amount.value = '';
    amount.max = due.toFixed(2);
    date.value = new Date().toISOString().slice(0,10);
    const calc = () => {
      const entered = Math.max(Number(amount.value) || 0, 0);
      const total = already + entered;
      const newDue = Math.max(expected - total, 0);
      document.getElementById('feeLiveCalcV2').innerHTML = `New Total Paid: <b>${money(Math.min(total, expected))}</b> &nbsp; Remaining: <b>${money(newDue)}</b> &nbsp; Status: <b>${statusFor(expected, total)}</b>`;
    };
    amount.oninput = calc;
    calc();
    document.getElementById('feeCancelV2').onclick = () => modal.close();
    document.getElementById('feeCollectForm').onsubmit = async e => {
      e.preventDefault();
      const value = Number(amount.value);
      try {
        const receipt = await collectFee(s.id, month, value, date.value, document.getElementById('feeNoteV2').value, document.getElementById('feeMethodV2').value);
        modal.close();
        alert(`Fee collected successfully. Receipt: ${receipt}`);
      } catch (err) { alert(err?.message || 'Could not save fee payment.'); }
    };
    modal.showModal();
  }

  function render() {
    rebuildPage();
    renderSummary();
    renderMatrix();
  }

  window.renderFees = function () {
    if (!document.getElementById('feeMatrixBody')) loadData();
    else render();
  };
  window.addPayment = function () {
    const first = activeStudents().find(s => expectedFor(s) > paidFor(s.id, state.month));
    if (first) openCollect(first.id, state.month);
    else alert('No active student has an outstanding fee for this month.');
  };
  window.refreshFeeManagementV2 = loadData;

  document.addEventListener('DOMContentLoaded', () => {
    const oldPaymentModal = document.getElementById('paymentModal');
    if (oldPaymentModal) oldPaymentModal.remove();
    loadData().catch(e => console.error('Fee Management v2 load failed:', e));
  });
})();
