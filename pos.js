let products = JSON.parse(localStorage.getItem('products')) || [
    { name: "Chicken Wrap", price: 50, stock: 10 },
    { name: "Veggie Wrap", price: 40, stock: 10 },
    { name: "Beef Wrap", price: 60, stock: 10 }
  ];
  
  let currentOrder = [];
  let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  
  function createProductButtons() {
    const container = document.getElementById('products');
    container.innerHTML = '';
    products.forEach(product => {
      const btn = document.createElement('button');
      btn.className = 'product-btn';
      btn.innerHTML = `
        ${product.name}
        <span class="price">₱${product.price}</span>
        <span class="stock">Stock: ${product.stock}</span>
      `;
      btn.onclick = product.stock > 0 ? () => addToOrder(product) : null;
      btn.disabled = product.stock <= 0;
      container.appendChild(btn);
    });
  }
  
  function addToOrder(product) {
    const existing = currentOrder.find(item => item.name === product.name);
    if (existing) {
      existing.quantity++;
    } else {
      currentOrder.push({ ...product, quantity: 1 });
    }
    updateOrderDisplay();
  }
  
  function removeItem(index) {
    currentOrder.splice(index, 1);
    updateOrderDisplay();
  }
  
  function updateOrderDisplay() {
    const orderList = document.getElementById('orderList');
    const total = currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    orderList.innerHTML = currentOrder.map((item, index) => `
      <div class="order-item">
        <div>
          ${item.name}
          <span class="quantity">(x${item.quantity})</span>
          - ₱${(item.price * item.quantity).toFixed(2)}
        </div>
        <button class="delete-btn" onclick="removeItem(${index})">Delete</button>
      </div>
    `).join('');
    
    document.getElementById('total').textContent = total.toFixed(2);
  }
  
  function checkout() {
    if (currentOrder.length === 0) return alert("No items in order!");
    
    // Check stock
    const outOfStock = currentOrder.some(item => {
      const product = products.find(p => p.name === item.name);
      return product.stock < item.quantity;
    });
    
    if (outOfStock) return alert("Not enough stock for some items!");
  
    // Update stock
    currentOrder.forEach(item => {
      const product = products.find(p => p.name === item.name);
      product.stock -= item.quantity;
    });
  
    // Record transaction
    transactions.push({
      date: new Date().toLocaleString(),
      items: currentOrder.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total: currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
  
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('products', JSON.stringify(products));
    
    currentOrder = [];
    updateOrderDisplay();
    document.getElementById('amountGiven').value = '';
    document.getElementById('changeAmount').textContent = '0.00';
    createProductButtons();
    alert("Order completed!");
  }
  
  function calculateChange() {
    const total = parseFloat(document.getElementById('total').textContent);
    const amountGiven = parseFloat(document.getElementById('amountGiven').value);
    
    if (!amountGiven || amountGiven < total) {
      alert("Invalid amount entered!");
      return;
    }
    
    document.getElementById('changeAmount').textContent = (amountGiven - total).toFixed(2);
  }
  
  function openStockModal() {
    document.getElementById('stockModal').style.display = 'flex';
    const stockList = document.getElementById('stockList');
    stockList.innerHTML = products.map(product => `
      <div class="stock-item">
        <div>${product.name}</div>
        <div class="stock-controls">
          <input type="number" value="${product.stock}" id="stock-${product.name}">
          <button onclick="updateStock('${product.name}')">Update</button>
        </div>
      </div>
    `).join('');
  }
  
  function updateStock(productName) {
    const newStock = parseInt(document.getElementById(`stock-${productName}`).value);
    const product = products.find(p => p.name === productName);
    product.stock = newStock;
    localStorage.setItem('products', JSON.stringify(products));
    createProductButtons();
    closeStockModal();
  }
  
  function closeStockModal() {
    document.getElementById('stockModal').style.display = 'none';
  }
  
  function showSales() {
    document.getElementById('salesModal').style.display = 'flex';
    const salesList = document.getElementById('salesList');
    salesList.innerHTML = transactions.map(t => `
      <div class="sale-item">
        <div class="sale-date">${t.date}</div>
        <div class="sale-items">${t.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</div>
        <div class="sale-total">Total: ₱${t.total.toFixed(2)}</div>
      </div>
    `).join('');
  }
  
  function closeSalesModal() {
    document.getElementById('salesModal').style.display = 'none';
  }
  
  function clearAll() {
    currentOrder = [];
    updateOrderDisplay();
  }
  
  function deleteLastTransaction() {
    transactions.pop();
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }
  
  function clearAllData() {
    if (!confirm("Clear ALL data?")) return;
    transactions = [];
    localStorage.removeItem('transactions');
  }
  
  function exportToExcel() {
    // Get all product names for headers
    const productHeaders = products.map(p => p.name);
    
    // Create header row
    const wsData = [
      ["Date", ...productHeaders, "Total"]
    ];
  
    // Process transactions
    transactions.forEach(t => {
      const row = [t.date];
      
      // Create quantity map {productName: quantity}
      const quantityMap = {};
      t.items.forEach(item => {
        quantityMap[item.name] = item.quantity;
      });
  
      // Fill quantities for each product
      products.forEach(product => {
        row.push(quantityMap[product.name] || 0);
      });
  
      // Add total
      row.push(`₱${t.total.toFixed(2)}`);
  
      wsData.push(row);
    });
  
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "ItsAWrap_Sales.xlsx");
  }  
  // Initialize
  createProductButtons();
