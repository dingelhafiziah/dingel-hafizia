/* Dingel Hafizia App — Menu Option 2: Income / Expenses */
(function () {
  const CATEGORY_KEY = "dh_transaction_categories";
  const defaults = { Income: ["Normal", "Zakat", "Fitra"], Expense: ["Normal"] };

  const loadCats = () => {
    try {
      const v = JSON.parse(localStorage.getItem(CATEGORY_KEY) || "null");
      return {
        Income: Array.isArray(v?.Income) && v.Income.length ? v.Income : defaults.Income.slice(),
        Expense: Array.isArray(v?.Expense) && v.Expense.length ? v.Expense : defaults.Expense.slice()
      };
    } catch (e) {
      return { Income: defaults.Income.slice(), Expense: defaults.Expense.slice() };
    }
  };

  const saveCats = v => localStorage.setItem(CATEGORY_KEY, JSON.stringify(v));

  const txMoney = n => {
    let currency = "₹";
    try { if (typeof getAppSettings === "function") currency = getAppSettings().currency || "₹"; } catch (e) {}
    return currency + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const txDate = value => {
    if (!value) return "—";
    const p = String(value).split("-");
    try {
      const f = (typeof getAppSettings === "function" ? getAppSettings().dateFormat : "DD/MM/YYYY") || "DD/MM/YYYY";
      if (p.length === 3) {
        const [y, m, d] = p;
        if (f === "YYYY-MM-DD") return `${y}-${m}-${d}`;
        if (f === "MM/DD/YYYY") return `${m}/${d}/${y}`;
        return `${d}/${m}/${y}`;
      }
    } catch (e) {}
    return String(value);
  };

  const txCanAccess = () => typeof canAccess !== "function" || canAccess("transactions");
  const txTotal = type => state.transactions.filter(x => x.type === type).reduce((sum, x) => sum + Number(x.amount || 0), 0);

  const catOptions = (type, current = "") => {
    const cats = loadCats()[type] || [];
    return cats.map(c => `<option value="${esc(c)}" ${c === current ? "selected" : ""}>${esc(c)}</option>`).join("") + `<option value="__custom__">＋ Custom category...</option>`;
  };

  window.renderTransactions = function () {
    if (!txCanAccess()) {
      content.innerHTML = `<div class="card empty"><strong>Access denied</strong><span>You do not have permission to access Income / Expenses.</span></div>`;
      return;
    }
    const income = txTotal("Income"), expense = txTotal("Expense"), balance = income - expense;
    content.innerHTML = `
      <div class="page-head"><div><h2>Income / Expenses</h2><p>Manage madrasa income and expenses separately.</p></div></div>
      <div class="summary-grid">
        <div class="card summary-card" style="border-top:3px solid #198754"><div class="stat-label">Total Income</div><div class="big" style="color:#198754">${txMoney(income)}</div></div>
        <div class="card summary-card" style="border-top:3px solid #dc3545"><div class="stat-label">Total Expenses</div><div class="big" style="color:#dc3545">${txMoney(expense)}</div></div>
        <div class="card summary-card" style="border-top:3px solid #0d6efd"><div class="stat-label">Balance</div><div class="big" style="color:${balance >= 0 ? '#0d6efd' : '#dc3545'}">${txMoney(balance)}</div></div>
      </div>
      <div class="card" style="padding:18px 20px;margin-bottom:18px"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><strong style="font-size:15px">Add Transaction</strong><div style="font-size:12px;opacity:.62;margin-top:3px">Choose income or expense to record a new entry.</div></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" onclick="openTransactionModal('', 'Income')">＋ Income</button><button class="btn btn-light" onclick="openTransactionModal('', 'Expense')">− Expense</button><button class="btn btn-light" onclick="manageTransactionCategories()">⚙ Categories</button></div></div></div>
      <div class="toolbar"><input class="input" id="transactionSearch" placeholder="Search category or description..." oninput="filterTransactions()"><select class="select" id="transactionFilter" onchange="filterTransactions()"><option value="All">All Transactions</option><option value="Income">Income Only</option><option value="Expense">Expense Only</option></select><input class="input" id="transactionDate" type="date" title="Filter by date" onchange="filterTransactions()"></div>
      <div class="card table-card"><div class="table-wrap"><table><thead><tr><th>Transaction</th><th>Type</th><th>Category</th><th>Amount</th><th>Action</th></tr></thead><tbody id="transactionRows"></tbody></table></div></div>`;
    filterTransactions();
  };

  window.filterTransactions = function () {
    const rowsEl = $("transactionRows"); if (!rowsEl) return;
    const q = ($("transactionSearch")?.value || "").trim().toLowerCase(), filter = $("transactionFilter")?.value || "All", date = $("transactionDate")?.value || "";
    const rows = state.transactions.filter(x => (filter === "All" || x.type === filter) && (!date || x.date === date)).filter(x => `${x.type || ""} ${x.category || ""} ${x.description || ""}`.toLowerCase().includes(q)).slice().sort((a,b) => String(b.date||"").localeCompare(String(a.date||"")));
    rowsEl.innerHTML = rows.length ? rows.map(x => `<tr><td><div style="position:relative;min-width:150px;padding-right:4px"><strong>${esc(x.description || x.category || "Transaction")}</strong><span style="display:block;font-size:11px;opacity:.58;margin-top:3px">${esc(x.category || "—")}</span><span style="display:block;text-align:right;font-size:10px;line-height:1;opacity:.48;margin-top:6px">${esc(txDate(x.date))}</span></div></td><td><span class="badge ${String(x.type||"").toLowerCase()}">${esc(x.type||"—")}</span></td><td>${esc(x.category||"—")}</td><td><strong>${txMoney(x.amount)}</strong></td><td><button class="table-action" onclick="editTransaction('${esc(x.id)}')">Edit</button><button class="table-action danger" onclick="deleteTransaction('${esc(x.id)}')">Delete</button></td></tr>`).join("") : `<tr><td colspan="5"><div class="empty"><strong>No transactions found</strong><span>Add a transaction or change the filters.</span></div></td></tr>`;
  };

  window.openTransactionModal = function (id, type) {
    if (!txCanAccess()) return;
    const x = state.transactions.find(a => a.id === id) || { type: type || "Income", date: today(), category: "", amount: "", description: "" };
    const isIncome = x.type === "Income";
    const accent = isIncome ? "#198754" : "#dc3545";
    const title = id ? `Edit ${x.type}` : `${x.type} Entry`;
    openModal(`
      <div style="padding:2px 2px 0">
        <div style="display:flex;align-items:center;gap:12px;padding-bottom:16px;border-bottom:1px solid #eee;margin-bottom:18px">
          <div style="width:44px;height:44px;border-radius:14px;background:${isIncome ? 'rgba(25,135,84,.12)' : 'rgba(220,53,69,.10)'};display:flex;align-items:center;justify-content:center;font-size:22px;color:${accent};font-weight:700">${isIncome ? '＋' : '−'}</div>
          <div style="flex:1"><div style="font-size:22px;font-weight:700;line-height:1.15">${title}</div><div style="font-size:12px;opacity:.58;margin-top:4px">Record a clear and accurate financial entry.</div></div>
          <button class="close" type="button" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="saveTransaction(event,'${id ? esc(id) : ""}')">
          <div style="display:grid;gap:14px">
            <div class="field"><label>Transaction Type</label><select class="select" name="type" onchange="refreshCategoryField(this.value,'')"><option value="Income" ${isIncome ? 'selected' : ''}>＋ Income</option><option value="Expense" ${!isIncome ? 'selected' : ''}>− Expense</option></select></div>
            <div class="field"><label>Date</label><input class="input" type="date" name="date" value="${esc(x.date)}" required><small style="display:block;font-size:11px;opacity:.52;margin-top:5px">Select the date of this transaction.</small></div>
            <div class="field" id="categoryField"><label>Category</label><select class="select" id="transactionCategory" name="category" onchange="categoryChanged(this)"><option value="" ${!x.category ? 'selected' : ''}>Select category</option>${catOptions(x.type, x.category)}</select></div>
            <div class="field"><label>Amount</label><div style="position:relative"><span style="position:absolute;left:15px;top:50%;transform:translateY(-50%);font-weight:700;opacity:.65;z-index:1">${txMoney(0).charAt(0)}</span><input class="input" style="padding-left:34px;font-size:18px;font-weight:600" type="number" name="amount" value="${esc(x.amount)}" min="0.01" step="0.01" inputmode="decimal" placeholder="0.00" required></div></div>
            <div class="field"><label>Description <span style="font-size:11px;opacity:.48;font-weight:400">(Optional)</span></label><textarea class="input" name="description" maxlength="250" rows="3" placeholder="Write a short note about this entry..." style="resize:vertical;min-height:86px">${esc(x.description)}</textarea></div>
          </div>
          <div style="margin-top:18px;padding:12px 14px;border-radius:12px;background:${isIncome ? 'rgba(25,135,84,.07)' : 'rgba(220,53,69,.06)'};font-size:12px;color:${accent}"><strong>${isIncome ? 'Income' : 'Expense'} entry</strong><span style="display:block;color:inherit;opacity:.72;margin-top:2px">Check the amount and category before saving.</span></div>
          <div class="modal-actions" style="margin-top:18px"><button type="button" class="btn btn-light" onclick="closeModal()">Cancel</button><button class="btn btn-primary" style="background:${accent};border-color:${accent}">${id ? 'Save Changes' : 'Save Entry'}</button></div>
        </form>
      </div>`);
  };

  window.refreshCategoryField = function (type, current) {
    const f = $("categoryField"); if (f) f.innerHTML = `<label>Category</label><select class="select" id="transactionCategory" name="category" onchange="categoryChanged(this)"><option value="" ${!current ? 'selected' : ''}>Select category</option>${catOptions(type, current)}</select>`;
  };

  window.categoryChanged = function (el) {
    if (el.value !== "__custom__") return;
    const type = $("transactionCategory")?.closest("form")?.querySelector('[name="type"]')?.value || "Income";
    const name = prompt(`Enter new ${type.toLowerCase()} category:`);
    if (!name || !name.trim()) { el.value = ""; return; }
    const clean = name.trim(), cats = loadCats();
    if (!cats[type].includes(clean)) cats[type].push(clean);
    saveCats(cats); refreshCategoryField(type, clean);
  };

  window.saveTransaction = function (e, id) {
    e.preventDefault(); if (!txCanAccess()) return;
    const form = Object.fromEntries(new FormData(e.target)), amount = Number(form.amount), type = form.type === "Expense" ? "Expense" : form.type === "Income" ? "Income" : "", date = String(form.date||"").trim(), category = String(form.category||"").trim(), description = String(form.description||"").trim();
    if (!type) return alert("Please select a valid transaction type.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return alert("Please select a valid date.");
    if (!category || category === "__custom__") return alert("Please select or create a category.");
    if (!Number.isFinite(amount) || amount <= 0) return alert("Amount must be greater than 0.");
    const data = { type, date, category, amount, description };
    if (id) { const i = state.transactions.findIndex(a => a.id === id); if (i < 0) return alert("Transaction not found."); state.transactions[i] = { ...state.transactions[i], ...data }; }
    else state.transactions.unshift({ id: uid(), ...data });
    persist(); closeModal(); render();
  };

  window.editTransaction = id => openTransactionModal(id);

  window.deleteTransaction = function (id) {
    if (!txCanAccess()) return;
    const item = state.transactions.find(x => x.id === id); if (!item) return;
    if (!confirm(`Delete this ${item.type || "transaction"}?`)) return;
    state.transactions = state.transactions.filter(x => x.id !== id); persist(); render();
  };

  window.manageTransactionCategories = function () {
    const cats = loadCats();
    const renderList = type => cats[type].map((c,i) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 0;border-bottom:1px solid #eee"><span>${esc(c)}</span><button type="button" class="table-action danger" onclick="removeTransactionCategory('${type}',${i})">Delete</button></div>`).join("");
    openModal(`<div class="modal-head"><h3>Transaction Categories</h3><button class="close" onclick="closeModal()">×</button></div><div><h4>Income Categories</h4>${renderList("Income")}<div style="margin:10px 0 20px"><button class="btn btn-primary" onclick="addTransactionCategory('Income')">＋ Add Income Category</button></div><h4>Expense Categories</h4>${renderList("Expense")}<div style="margin-top:10px"><button class="btn btn-primary" onclick="addTransactionCategory('Expense')">＋ Add Expense Category</button></div></div>`);
  };

  window.addTransactionCategory = function (type) {
    const name = prompt(`Enter new ${type.toLowerCase()} category:`); if (!name || !name.trim()) return;
    const cats = loadCats(), clean = name.trim(); if (cats[type].includes(clean)) return alert("Category already exists.");
    cats[type].push(clean); saveCats(cats); manageTransactionCategories();
  };

  window.removeTransactionCategory = function (type,index) {
    const cats = loadCats(), name = cats[type][index]; if (!name) return;
    if (cats[type].length <= 1) return alert("At least one category must remain.");
    if (!confirm(`Delete category "${name}"? Existing transactions will not be deleted.`)) return;
    cats[type].splice(index,1); saveCats(cats); manageTransactionCategories();
  };
})();