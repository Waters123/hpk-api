const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      immutable: false,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowerCase: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
    },
    quantity: Number,
    images: {
      type: Array,
    },
    color: {
      type: String,
      enum: ["Black", "Brown", "Red"],
    },
    brand: {
      type: String,
    },
    sold: {
      type: Number,
      default: 0,
    },
    rating: [
      {
        star: Number,
        postedby: { type: mongoose.Schema.Types.ObjectId, red: "User" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Product", ProductSchema);
