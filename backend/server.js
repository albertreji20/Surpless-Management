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
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.error("DB error ❌", err.message));

/* --------------------
   Stock model
-------------------- */
const StockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  totalStock: {
    type: Number,
    required: true,
    min: 1
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 1
  },
  arrivalDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },

  // computed fields
  marketValue: Number,
  finalPrice: Number,
  status: String
});

const Stock = mongoose.model("Stock", StockSchema);

/* --------------------
   Dynamic Pricing Algorithm
-------------------- */
function calculateStockIntelligence(stock) {
  const today = new Date();
  const expiry = new Date(stock.expiryDate);
  const arrival = new Date(stock.arrivalDate);

  const daysToExpiry = Math.ceil(
    (expiry - today) / (1000 * 60 * 60 * 24)
  );

  const daysInStore = Math.ceil(
    (today - arrival) / (1000 * 60 * 60 * 24)
  );

  const unsoldRatio =
    stock.totalStock > 0
      ? stock.currentStock / stock.totalStock
      : 0;

  let discountRate = 0;
  let status = "Normal";

  // Expiry-based discount
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

  // Slow-moving stock penalty
  if (daysInStore > 7 && unsoldRatio > 0.6) {
    discountRate = Math.min(discountRate + 0.1, 0.8);
    status = "Slow Moving";
  }

  const finalPrice = Math.round(stock.price * (1 - discountRate));
  const marketValue = stock.currentStock * finalPrice;

  return {
    daysToExpiry,
    daysInStore,
    marketValue,
    finalPrice,
    status
  };
}

/* --------------------
   Routes
-------------------- */

// Health check
app.get("/", (req, res) => {
  res.send("Server + DB running 🚀");
});

// Add stock
app.post("/api/stock", async (req, res) => {
  try {
    const {
      name,
      totalStock,
      currentStock,
      price,
      arrivalDate,
      expiryDate
    } = req.body;

    // Validation
    if (
      !name ||
      totalStock <= 0 ||
      currentStock < 0 ||
      currentStock > totalStock ||
      price <= 0
    ) {
      return res.status(400).json({ error: "Invalid stock data" });
    }

    if (new Date(expiryDate) <= new Date(arrivalDate)) {
      return res
        .status(400)
        .json({ error: "Expiry date must be after arrival date" });
    }

    const normalizedStock = {
      name: name.trim(),
      totalStock,
      currentStock,
      price,
      arrivalDate: new Date(arrivalDate),
      expiryDate: new Date(expiryDate)
    };

    const intelligence = calculateStockIntelligence(normalizedStock);

    const stock = new Stock({
      ...normalizedStock,
      ...intelligence
    });

    await stock.save();
    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all stocks (dashboard + marketplace)
app.get("/api/stock", async (req, res) => {
  const stocks = await Stock.find();

  const updatedStocks = stocks.map(stock => ({
    ...stock.toObject(),
    ...calculateStockIntelligence(stock)
  }));

  res.json(updatedStocks);
});

// Delete stock
app.delete("/api/stock/:id", async (req, res) => {
  try {
    const deleted = await Stock.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Stock not found" });
    }

    res.json({ message: "Stock deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
