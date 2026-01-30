const stockTable = document.querySelector("#stockTable tbody");

fetch("http://localhost:5000/api/stock")
  .then(res => res.json())
  .then(items => {
    items.forEach(item => {
      addStockRow(item);
    });
  })
  .catch(err => {
    console.error("Error fetching stock:", err);
  });

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB");
}

function addStockRow(item) {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${item.name}</td>
    <td>${item.currentStock}/${item.totalStock}</td>
    <td>${formatDate(item.arrivalDate)}</td>
    <td>${formatDate(item.expiryDate)}</td>
    <td>${item.daysToExpiry}</td>
    <td>₹${item.price}</td>

    
  `;

  stockTable.appendChild(row);
}
