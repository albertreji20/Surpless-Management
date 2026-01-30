const stockTable = document.querySelector("#stockTable tbody");
const API = "https://supplychain-management-system.onrender.com/api/stock";

fetch(API)
  .then(res => res.json())
  .then(items => items.forEach(addStockRow));

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB");
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
