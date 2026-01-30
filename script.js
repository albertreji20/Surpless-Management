// Get table body
const stockTable = document.querySelector("#stockTable tbody");

// Fetch stock data from backend
fetch("http://localhost:5000/api/stock")
  .then(response => {
    if (!response.ok) {
      throw new Error("Failed to fetch stock data");
    }
    return response.json();
  })
  .then(stocks => {
    stockTable.innerHTML = "";
    stocks.forEach(stock => addStockRow(stock));
  })
  .catch(error => {
    console.error("Error loading stock data:", error);
  });

// Format date as DD/MM/YYYY
function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB");
}

// Add a row to the inventory table
function addStockRow(stock) {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${stock.name || "-"}</td>
    <td>${stock.currentStock}/${stock.totalStock}</td>
    <td>${formatDate(stock.arrivalDate)}</td>
    <td>${formatDate(stock.expiryDate)}</td>
    <td>${stock.daysToExpiry}</td>
    <td>₹${stock.price}</td>
  `;

  stockTable.appendChild(row);
}
