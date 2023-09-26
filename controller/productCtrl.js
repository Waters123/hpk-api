const Product = require("../models/productModel");
const slugify = require("slugify");
const asyncHandler = require("express-async-handler");
const validateMongoDbID = require("../utils/validateMongoDb");

const createProduct = asyncHandler(async (req, res) => {
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }
    const newProduct = await Product.create(req.body);
    res.json(newProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbID(id);
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }
    const updateProduct = await Product.findOneAndUpdate(
      { _id: id },
      req.body,
      {
        new: true,
      }
    );
    res.json(updateProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbID(id);
  try {
    const deleteProduct = await Product.findByIdAndDelete(id);
    if (deleteProduct) res.json({ deleteProduct });
    throw new Error("Product not found");
  } catch (error) {
    throw new Error(error);
  }
});

const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const findProduct = await Product.findById(id);
    res.json(findProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const getAllProducts = asyncHandler(async (req, res) => {
  try {
    // Filtering
    const excludedQuery = { ...req.query };

    const excludeFields = ["page", "sort", "limit", "fields", "keyword"]; // Add "keyword" to excluded fields
    excludeFields.forEach((el) => delete excludedQuery[el]);

    // Include search based on a keyword
    if (req.query.keyword) {
      excludedQuery.title = {
        $regex: req.query.keyword,
        $options: "i", // Case-insensitive search
      };
    }

    let queryStr = JSON.stringify(excludedQuery);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); // add $ sign to example {price:{$gte:100}}
    let query = Product.find(JSON.parse(queryStr));

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(`${sortBy} -createdAt`);
    } else {
      query = query.sort("-createdAt");
    }

    // Limiting fields
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }

    // Pagination
    const page = req.query.page || 1; // Default to page 1 if not provided
    const limit = req.query.limit || 10; // Default limit to 10 if not provided
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    // Count the total number of products without pagination
    const totalProductsCount = await Product.countDocuments();

    const products = await query;

    res.json({ itemCount: products.length, totalProductsCount, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
};
