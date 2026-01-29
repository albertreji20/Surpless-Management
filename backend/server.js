require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --------------------
// MongoDB Connection
// --------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.error("DB error ❌", err.message));

// --------------------
// Stock Model
// --------------------
const Stock = mongoose.model("Stock", new mongoose.Schema({
  name: String,
  quantity: Number,
  expiryDays: Number,
  price: Number,

  // algorithm outputs
  status: String,
  finalPrice: Number,
  route: String
}));

// --------------------
// Dynamic Pricing Algorithm
// --------------------
function applyDynamicPricing(stock) {
  let discountRate = 0;
  let status = "Normal";
  let route = "Warehouse";

  if (stock.expiryDays <= 1) {
    discountRate = 0.7;
    status = "Near Expiry";
    route = "Marketplace";
  } else if (stock.expiryDays <= 3) {
    discountRate = 0.5;
    status = "High Discount";
    route = "Marketplace";
  } else if (stock.expiryDays <= 7) {
    discountRate = 0.3;
    status = "Discounted";
    route = "Marketplace";
  }

  const finalPrice = Math.round(stock.price * (1 - discountRate));

  // auto-donate if value too low
  if (finalPrice <= stock.price * 0.2) {
    status = "Donate";
    route = "NGO";
  }

  return { status, finalPrice, route };
}

// --------------------
// Routes
// --------------------

// Test route
app.get("/", (req, res) => {
  res.send("Server + DB running 🚀");
});

// GET stock → frontend reads
app.get("/api/stock", async (req, res) => {
  const stocks = await Stock.find();
  res.json(stocks);
});

// POST stock → form submits
app.post("/api/stock", async (req, res) => {
  try {
    const { status, finalPrice, route } = applyDynamicPricing(req.body);

    const stock = new Stock({
      ...req.body,
      status,
      finalPrice,
      route
    });

    await stock.save();
    res.json(stock);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
