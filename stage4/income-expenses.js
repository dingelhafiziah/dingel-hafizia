/* Dingel Hafizia App — Menu Option 2: Income / Expenses */
(function(){
  const txMoney = n => {
    let currency = "₹";
    try {
      if (typeof getAppSettings === "function") currency = getAppSettings().currency || "₹";
    } catch (e) {}
    return currency + Number(n || 0).toLocaleString("en-IN", {minimumFractionDigits: 0, maximumFractionDigits: 2});
  };

  const txDate = value => {
    if (!value) return "—";
    try {
      const s = String(value);
      const parts = s.split("-");
      const settings = typeof getAppSettings === "function" ? getAppSettings() : {};
      const format = settings.dateFormat || "DD/MM/YYYY";
      if (parts.length === 3) {
        const [y,m,d] = parts;
        if (format === "YYYY-MM-DD") return `${y}-${m}-${d}`;
        if (format === "MM/DD/YYYY") return `${m}/${d}/${y}`;
        return `${d}/${m}/${y}`;
      }
    } catch (e) {}
    return String(value);
  };

  const txCanAccess = () => typeof canAccess !== "function" || canAccess("transactions");
  const txTotal = (type) => state.transactions.filter(x => x.type === type).reduce((sum,x) => sum + Number(x.amount || 0), 0);

  window.renderTransactions = function(){
    if (!txCanAccess()) {
      content.innerHTML = `<div class="card empty"><strong>Access denied</strong><span>You do not have permission to access Income / Expenses.</span></div>`;
      return;
    }

    const income = txTotal("Income");
    const expense = txTotal("Expense");
    const balance = income - expense;

    content.innerHTML = `<div class="page-head"><div><h2>Income / Expenses</h2><p>Record and manage all madrasa income and expenses.</p></div><button class="btn btn-primary" onclick="openTransactionModal()">+ New Transaction</button></div>
      <div class="summary-grid">
        <div class="card summary-card"><div class="stat-label">Total Income</div><div class="big">${txMoney(income)}</div></div>
        <div class="card summary-card"><div class="stat-label">Total Expenses</div><div class="big">${txMoney(expense)}</div></div>
        <div class="card summary-card"><div class="stat-label">Balance</div><div class="big">${txMoney(balance)}</div></div>
      </div>
      <div class="toolbar">
        <input class="input" id="transactionSearch" placeholder="Search type, category or description..." oninput="filterTransactions()">
        <select class="select" id="transactionFilter" onchange="filterTransactions()"><option value="All">All Types</option><option value="Income">Income</option><option value="Expense">Expense</option></select>
        <input class="input" id="transactionDate" type="date" onchange="filterTransactions()">
      </div>
      <div class="card table-card"><div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th><th>Action</th></tr></thead><tbody id="transactionRows"></tbody></table></div></div>`;
    filterTransactions();
  };

  window.filterTransactions = function(){
    const rowsEl = $("transactionRows");
    if (!rowsEl) return;
    const q = ($("transactionSearch")?.value || "").trim().toLowerCase();
    const filter = $("transactionFilter")?.value || "All";
    const date = $("transactionDate")?.value || "";

    const rows = state.transactions
      .filter(x => (filter === "All" || x.type === filter) && (!date || x.date === date))
      .filter(x => `${x.type || ""} ${x.category || ""} ${x.description || ""}`.toLowerCase().includes(q))
      .slice()
      .sort((a,b) => String(b.date || "").localeCompare(String(a.date || "")));

    rowsEl.innerHTML = rows.length ? rows.map(x => `<tr>
      <td>${esc(txDate(x.date))}</td>
      <td><span class="badge ${String(x.type || "").toLowerCase()}">${esc(x.type || "—")}</span></td>
      <td>${esc(x.category || "—")}</td>
      <td>${esc(x.description) || "—"}</td>
      <td><strong>${txMoney(x.amount)}</strong></td>
      <td><button class="table-action" onclick="editTransaction('${esc(x.id)}')">Edit</button><button class="table-action danger" onclick="deleteTransaction('${esc(x.id)}')">Delete</button></td>
    </tr>`).join("") : `<tr><td colspan="6"><div class="empty"><strong>No transactions found</strong><span>Add a transaction or change the filters.</span></div></td></tr>`;
  };

  window.openTransactionModal = function(id){
    if (!txCanAccess()) return;
    const x = state.transactions.find(a => a.id === id) || {type:"Income", date:today(), category:"", amount:"", description:""};
    openModal(`<div class="modal-head"><h3>${id ? "Edit" : "New"} Transaction</h3><button class="close" onclick="closeModal()">×</button></div>
      <form onsubmit="saveTransaction(event,'${id ? esc(id) : ""}')">
        <div class="form-grid">
          <div class="field"><label>Type</label><select class="select" name="type"><option value="Income" ${x.type === "Income" ? "selected" : ""}>Income</option><option value="Expense" ${x.type === "Expense" ? "selected" : ""}>Expense</option></select></div>
          <div class="field"><label>Date</label><input class="input" type="date" name="date" value="${esc(x.date)}" required></div>
          <div class="field"><label>Category</label><input class="input" name="category" value="${esc(x.category)}" maxlength="100" required></div>
          <div class="field"><label>Amount</label><input class="input" type="number" name="amount" value="${esc(x.amount)}" min="0.01" step="0.01" inputmode="decimal" required></div>
          <div class="field full"><label>Description</label><input class="input" name="description" value="${esc(x.description)}" maxlength="250"></div>
        </div>
        <div class="modal-actions"><button type="button" class="btn btn-light" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Save Transaction</button></div>
      </form>`);
  };

  window.saveTransaction = function(e,id){
    e.preventDefault();
    if (!txCanAccess()) return;
    const form = Object.fromEntries(new FormData(e.target));
    const amount = Number(form.amount);
    const type = form.type === "Expense" ? "Expense" : form.type === "Income" ? "Income" : "";
    const date = String(form.date || "").trim();
    const category = String(form.category || "").trim();
    const description = String(form.description || "").trim();

    if (!type) return alert("Please select a valid transaction type.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return alert("Please select a valid date.");
    if (!category) return alert("Category is required.");
    if (!Number.isFinite(amount) || amount <= 0) return alert("Amount must be greater than 0.");

    const data = {type,date,category,amount,description};
    if (id) {
      const index = state.transactions.findIndex(a => a.id === id);
      if (index < 0) return alert("Transaction not found.");
      state.transactions[index] = {...state.transactions[index], ...data};
    } else {
      state.transactions.unshift({id:uid(), ...data});
    }
    persist();
    closeModal();
    render();
  };

  window.editTransaction = function(id){ openTransactionModal(id); };

  window.deleteTransaction = function(id){
    if (!txCanAccess()) return;
    const item = state.transactions.find(x => x.id === id);
    if (!item) return;
    if (!confirm(`Delete this ${item.type || "transaction"}?`)) return;
    state.transactions = state.transactions.filter(x => x.id !== id);
    persist();
    render();
  };
})();