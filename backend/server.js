require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/* --------------------
   MongoDB connection
-------------------- */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.error("DB error ❌", err.message));

/* --------------------
   Stock model
-------------------- */
const Stock = mongoose.model("Stock", new mongoose.Schema({
  name: String,

  totalStock: Number,
  currentStock: Number,

  price: Number,
  arrivalDate: Date,
  expiryDate: Date,

  // computed fields
  marketValue: Number,
  finalPrice: Number,
  status: String,
  route: String
}));

/* --------------------
   Dynamic Pricing Algorithm
-------------------- */
function calculateStockIntelligence(stock) {
  const today = new Date();
  const expiry = new Date(stock.expiryDate);
  const arrival = new Date(stock.arrivalDate);

  // Days to expiry
  const daysToExpiry = Math.ceil(
    (expiry - today) / (1000 * 60 * 60 * 24)
  );

  // Days spent in store
  const daysInStore = Math.ceil(
    (today - arrival) / (1000 * 60 * 60 * 24)
  );

  // Unsold ratio
  const unsoldRatio = stock.currentStock / stock.totalStock;

  let discountRate = 0;
  let status = "Normal";
  let route = "Warehouse";

  /* ---- Base discount by expiry ---- */
  if (daysToExpiry <= 1) {
    discountRate = 0.7;
    status = "Near Expiry";
  } else if (daysToExpiry <= 3) {
    discountRate = 0.5;
    status = "High Discount";
  } else if (daysToExpiry <= 7) {
    discountRate = 0.3;
    status = "Discounted";
  }

  /* ---- Extra discount if slow moving ---- */
  if (daysInStore > 7 && unsoldRatio > 0.6) {
    discountRate += 0.1;
    status = "Slow Moving";
  }

  // Cap max discount to 80%
  discountRate = Math.min(discountRate, 0.8);

  const finalPrice = Math.round(stock.price * (1 - discountRate));
  const marketValue = stock.currentStock * finalPrice;

  /* ---- Routing logic ---- */
  if (daysToExpiry <= 0 || finalPrice <= stock.price * 0.2) {
    status = "Donate";
    route = "NGO";
  } else if (discountRate > 0) {
    route = "Marketplace";
  }

  return {
    daysToExpiry,
    daysInStore,
    marketValue,
    finalPrice,
    status,
    route
  };
}

/* --------------------
   Routes
-------------------- */

// Health check
app.get("/", (req, res) => {
  res.send("Server + DB running 🚀");
});

// Add stock (called from add-stock.html)
app.post("/api/stock", async (req, res) => {
  try {
    const intelligence = calculateStockIntelligence(req.body);

    const stock = new Stock({
      ...req.body,
      marketValue: intelligence.marketValue,
      finalPrice: intelligence.finalPrice,
      status: intelligence.status,
      route: intelligence.route
    });

    await stock.save();
    res.json(stock);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch stock (dashboard + marketplace)
app.get("/api/stock", async (req, res) => {
  const stocks = await Stock.find();

  const updatedStocks = stocks.map(stock => {
    const intelligence = calculateStockIntelligence(stock);
    return { ...stock.toObject(), ...intelligence };
  });

  res.json(updatedStocks);
});

/* -------------------- */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// Delete stock
app.delete("/api/stock/:id", async (req, res) => {
  try {
    await Stock.findByIdAndDelete(req.params.id);
    res.json({ message: "Stock deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
