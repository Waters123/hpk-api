const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    subCategoryTitle: {
      type: String,
    },
    subCategory: [this],
  },
  {
    timestamps: true,
  }
);

const categorySchema = new mongoose.Schema(
  {
    categoryTitle: {
      type: String,
      required: true,
      unique: true,
    },
    subCategory: [subCategorySchema],
    createdBy: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Assuming your User model is named 'User'
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Category", categorySchema);
