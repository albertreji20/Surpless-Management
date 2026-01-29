const stockItems = [
  { name: "Tomatoes", qty: 100, expiry: 2, price: 40 },
  { name: "Rice Bags", qty: 50, expiry: 30, price: 1200 },
  { name: "Milk Packets", qty: 80, expiry: 1, price: 30 },
  { name: "Apples", qty: 60, expiry: 7, price: 90 }
];

const stockTable = document.querySelector("#stockTable tbody");
const marketplace = document.getElementById("marketplace");
const donations = document.getElementById("donations");

stockItems.forEach(item => {
  let status = "Normal";
  let discountedPrice = item.price;

  // Surplus prediction + dynamic pricing
  if (item.expiry <= 3) {
    discountedPrice = Math.round(item.price * 0.5);
    status = "Donate";
    addDonation(item);
  } 
  else if (item.expiry <= 7) {
    discountedPrice = Math.round(item.price * 0.7);
    status = "Discounted";
    addToMarketplace(item, discountedPrice);
  }

  addStockRow(item, status);
});

function addStockRow(item, status) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${item.name}</td>
    <td>${item.qty}</td>
    <td>${item.expiry} days</td>
    <td>₹${item.price}</td>
    <td>${status}</td>
  `;
  stockTable.appendChild(row);
}

function addToMarketplace(item, discountedPrice) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h3>${item.name}</h3>
    <p>Qty: ${item.qty}</p>
    <p class="old-price">₹${item.price}</p>
    <p class="price">₹${discountedPrice}</p>
    <button>Buy Now</button>
  `;
  marketplace.appendChild(card);
}

function addDonation(item) {
  const li = document.createElement("li");
  li.textContent = `${item.name} → Routed to NGO`;
  donations.appendChild(li);
}
