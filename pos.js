const colorVariations = [
  { bg: 'rgba(255, 235, 59, 0.2)', border: '#FFEB3B' },  // Yellow
  { bg: 'rgba(244, 67, 54, 0.2)', border: '#F44336' },   // Red
  { bg: 'rgba(143, 0, 255, 0.2)', border: '#8B00FF' },   // Purple
  { bg: 'rgba(0, 128, 0, 0.2)', border: '#008000' },   // Green
  { bg: 'rgba(0, 191, 255, 0.2)', border: '#00BFFF' },  // Light Blue
  { bg: 'rgba(255, 0, 127, 0.2)', border: '#FF007F' },  // Pink
  { bg: 'rgba(0, 0, 255, 0.2)', border: '#0000FF' },   // Blue
  { bg: 'rgba(255, 20, 147, 0.2)', border: '#FF1493' }, // Deep Pink
  { bg: 'rgba(255, 228, 181, 0.2)', border: '#FFE4B5' }, // Moccasin
  { bg: 'rgba(240, 230, 140, 0.2)', border: '#F0E68C' }, // Khaki
  { bg: 'rgba(240, 128, 128, 0.2)', border: '#F08080' }, // Light Coral
  { bg: 'rgba(255, 228, 225, 0.2)', border: '#FFE4E1' }, // Misty Rose
  { bg: 'rgba(240, 248, 255, 0.2)', border: '#F0F8FF' }, // Alice Blue
  { bg: 'rgba(255, 239, 213, 0.2)', border: '#FFEFDB' }, // Papaya Whip
];

let products = JSON.parse(localStorage.getItem('products')) || [
  { name: "Cheese Wrap", price: 50, stock: 10 },
  { name: "Hotdog Wrap", price: 40, stock: 10 },
  { name: "Camote Wrap", price: 60, stock: 10 },
  { name: "Tuna Wrap", price: 70, stock: 10 },
];

let currentOrder = [];
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

async function confirmAction(message) {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#5ac97a',
    cancelButtonColor: '#ef4444',
    confirmButtonText: 'Confirm'
  });
  return result.isConfirmed;
}

function createProductButtons() {
  const container = document.getElementById('products');
  container.innerHTML = '';
  products.forEach((product, index) => {
    const btn = document.createElement('button');
    const colors = colorVariations[index % colorVariations.length];
    btn.className = 'product-btn';
    btn.style.backgroundColor = colors.bg;
    btn.style.borderColor = colors.border;
    btn.innerHTML = `
      <div class="product-name">${product.name}</div>
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
    const productIndex = products.findIndex(p => p.name === product.name);
    currentOrder.push({ 
      ...product, 
      quantity: 1,
      colorIndex: productIndex % colorVariations.length
    });
  }
  updateOrderDisplay();
}

function removeItem(index) {
  currentOrder.splice(index, 1);
  updateOrderDisplay();
}

function decreaseQuantity(index) {
  const item = currentOrder[index];
  if(item.quantity > 1) {
    item.quantity--;
  } else {
    currentOrder.splice(index, 1);
  }
  updateOrderDisplay();
}

function increaseQuantity(index) {
  const item = currentOrder[index];
  const product = products.find(p => p.name === item.name);
  if(product.stock > item.quantity) {
    item.quantity++;
  } else {
    alert(`Only ${product.stock} ${product.name} available!`);
  }
  updateOrderDisplay();
}

function updateOrderDisplay() {
  const orderList = document.getElementById('orderList');
  const total = currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  orderList.innerHTML = currentOrder.map((item, index) => {
    const colors = colorVariations[item.colorIndex];
    return `
    <div class="order-item" style="background:${colors.bg};border-color:${colors.border}">
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-price">₱${(item.price * item.quantity).toFixed(2)}</div>
      </div>
      <div class="quantity-controls">
        <button class="qty-btn" onclick="decreaseQuantity(${index})">−</button>
        <span class="quantity">${item.quantity}</span>
        <button class="qty-btn" onclick="increaseQuantity(${index})">+</button>
        <button class="delete-btn" onclick="removeItem(${index})"><i class='bx bx-trash'></i></button>
      </div>
    </div>
    `;
  }).join('');
  document.getElementById('total').textContent = total.toFixed(2);
}

async function checkout() {
  if (currentOrder.length === 0) return alert("No items in order!");
  const outOfStock = currentOrder.some(item => {
    const product = products.find(p => p.name === item.name);
    return product.stock < item.quantity;
  });
  if (outOfStock) return alert("Not enough stock for some items!");
  const total = currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (!await confirmAction(`Confirm checkout for ₱${total.toFixed(2)}?`)) return;

  currentOrder.forEach(item => {
    const product = products.find(p => p.name === item.name);
    product.stock -= item.quantity;
  });

  const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
  transactions.push({
    date: new Date().toLocaleString(),
    items: currentOrder.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price
    })),
    total: total,
    paymentMethod: paymentMethod
  });

  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('products', JSON.stringify(products));
  currentOrder = [];
  updateOrderDisplay();
  document.getElementById('amountGiven').value = '';
  document.getElementById('changeAmount').textContent = '0.00';
  createProductButtons();
  Swal.fire('Success!', 'Order completed!', 'success');
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

async function updateStock(productName) {
  const newStock = parseInt(document.getElementById(`stock-${productName}`).value);
  if (!await confirmAction(`Set ${productName} stock to ${newStock}?`)) return;
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
      <div class="sale-total">Total: ₱${t.total.toFixed(2)} (${t.paymentMethod.toUpperCase()})</div>
    </div>
  `).join('');
}

function closeSalesModal() {
  document.getElementById('salesModal').style.display = 'none';
}

async function clearAll() {
  if (!await confirmAction("Clear current order?")) return;
  currentOrder = [];
  updateOrderDisplay();
}

async function deleteLastTransaction() {
  if (!await confirmAction("Delete last transaction?")) return;
  transactions.pop();
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

async function clearAllData() {
  if (!await confirmAction("WARNING: This will permanently delete ALL transaction data!\nAre you absolutely sure?")) return;
  transactions = [];
  localStorage.removeItem('transactions');
}

async function exportToExcel() {
  if (!await confirmAction("Export all transactions to Excel?")) return;
  const productHeaders = products.map(p => p.name);
  const wsData = [
    ["Date", ...productHeaders, "Total", "Payment Method"]
  ];
  transactions.forEach(t => {
    const row = [t.date];
    const quantityMap = {};
    t.items.forEach(item => {
      quantityMap[item.name] = item.quantity;
    });
    products.forEach(product => {
      row.push(quantityMap[product.name] || 0);
    });
    row.push(`₱${t.total.toFixed(2)}`);
    row.push(t.paymentMethod.toUpperCase());
    wsData.push(row);
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  XLSX.writeFile(wb, "ItsAWrap_Sales.xlsx");
  Swal.fire('Success!', 'Excel file exported!', 'success');
}

createProductButtons();

