/* Dingel Hafizia App — polished Income/Expense Entry UI */
(function(){
  const CATEGORY_KEY='dh_transaction_categories';
  const defaults={
    Income:['Zakat','Fitra','Student Fees','Admission Fee','Donation','Other Income'],
    Expense:['Food & Kitchen','Teacher Salary','Staff Salary','Rent','Electricity','Water','Gas','Internet & Phone','Education & Stationery','Books & Quran','Uniform & Clothing','Student Welfare','Medical','Cleaning & Hygiene','Repairs & Maintenance','Furniture & Equipment','Transport','Office Expenses','Program & Events','Religious Activities','Bank & Payment Charges','Government & Registration','Other Expense']
  };
  const clean=(arr,fallback)=>{
    const source=Array.isArray(arr)?arr:[];
    const out=source.filter(x=>typeof x==='string'&&x.trim()&&x.trim().toLowerCase()!=='normal').map(x=>x.trim());
    return out.length?out:fallback.slice();
  };
  const categoryData=()=>{
    try{
      const v=JSON.parse(localStorage.getItem(CATEGORY_KEY)||'null');
      const data={Income:clean(v?.Income,defaults.Income),Expense:clean(v?.Expense,defaults.Expense)};
      localStorage.setItem(CATEGORY_KEY,JSON.stringify(data));
      return data;
    }catch(e){
      const data={Income:defaults.Income.slice(),Expense:defaults.Expense.slice()};
      try{localStorage.setItem(CATEGORY_KEY,JSON.stringify(data))}catch(_e){}
      return data;
    }
  };
  const opts=(type,current='')=>{
    const cats=categoryData()[type]||[];
    return `<option value="" ${!current?'selected':''}>Select category</option>`+
      cats.map(c=>`<option value="${esc(c)}" ${c===current?'selected':''}>${esc(c)}</option>`).join('')+
      `<option value="__custom__">＋ Create custom category</option>`;
  };
  window.openTransactionModal=function(id,type){
    if(typeof canAccess==='function'&&!canAccess('transactions'))return;
    const x=state.transactions.find(a=>a.id===id)||{type:type||'Income',date:today(),category:'',amount:'',description:''};
    const income=x.type==='Income';
    openModal(`
      <div class="entry-modal ${income?'entry-income':'entry-expense'}">
        <div class="entry-hero">
          <div class="entry-icon">${income?'＋':'−'}</div>
          <div class="entry-title-wrap"><span class="entry-kicker">FINANCIAL ENTRY</span><h3>${id?'Edit':'New'} ${income?'Income':'Expense'}</h3><p>${income?'Record money received by the madrasa.':'Record money spent by the madrasa.'}</p></div>
          <button class="entry-close" type="button" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="saveTransaction(event,'${id?esc(id):''}')">
          <div class="entry-section"><div class="entry-section-title"><span>01</span><div><strong>Transaction details</strong><small>Choose the type and date</small></div></div>
            <div class="entry-grid">
              <div class="entry-field"><label>Transaction Type</label><select class="entry-input" name="type" onchange="refreshEntryCategory(this.value)"><option value="Income" ${income?'selected':''}>Income</option><option value="Expense" ${!income?'selected':''}>Expense</option></select></div>
              <div class="entry-field"><label>Date</label><input class="entry-input" type="date" name="date" value="${esc(x.date)}" required></div>
            </div>
          </div>
          <div class="entry-section"><div class="entry-section-title"><span>02</span><div><strong>Money details</strong><small>Select a category and enter the amount</small></div></div>
            <div class="entry-grid">
              <div class="entry-field"><label>Category</label><div id="entryCategoryWrap"><select class="entry-input" id="transactionCategory" name="category" onchange="categoryChanged(this)">${opts(x.type,x.category)}</select></div></div>
              <div class="entry-field"><label>Amount</label><div class="amount-wrap"><span>₹</span><input class="entry-input amount-input" type="number" name="amount" value="${esc(x.amount)}" min="0.01" step="0.01" inputmode="decimal" placeholder="0.00" required></div></div>
            </div>
          </div>
          <div class="entry-section"><div class="entry-section-title"><span>03</span><div><strong>Description</strong><small>Add a short note for this transaction</small></div></div>
            <div class="entry-field"><label>Description <em>Optional</em></label><textarea class="entry-input entry-note" name="description" maxlength="250" rows="3" placeholder="e.g. Monthly donation, food purchase, electricity bill...">${esc(x.description)}</textarea><div class="entry-hint">Keep the description short and clear for future records.</div></div>
          </div>
          <div class="entry-footer"><button type="button" class="entry-cancel" onclick="closeModal()">Cancel</button><button class="entry-save" type="submit"><span>${id?'Save Changes':income?'Save Income':'Save Expense'}</span><b>→</b></button></div>
        </form>
      </div>`);
  };
  window.refreshEntryCategory=function(type){
    const wrap=document.getElementById('entryCategoryWrap');
    if(wrap)wrap.innerHTML=`<select class="entry-input" id="transactionCategory" name="category" onchange="categoryChanged(this)">${opts(type,'')}</select>`;
  };
})();