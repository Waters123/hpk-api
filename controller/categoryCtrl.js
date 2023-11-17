const Category = require("../models/categoryModel");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

const createCategory = asyncHandler(async (req, res) => {
  try {
    const cookie = req.cookies;
    if (!cookie?.refreshToken)
      res.status(403).json({ message: "No Refresh Token in Cookies" });
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({
      refreshToken: { $elemMatch: { token: refreshToken } },
    });

    const { categoryTitle, subCategory } = req.body;
    const newCategory = await Category.create({
      categoryTitle,
      subCategory: subCategory || [],
      createdBy: {
        firstName: user.firstName,
        lastName: user.lastName,
        _id: user._id,
      },
    });
    res.json(newCategory);
  } catch (err) {
    throw new Error(err);
  }
});

const deleteCategory = asyncHandler(async (req, res) => {
  try {
    const categoryId = req.params.id;
    const deletedCategory = await Category.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully", deletedCategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

const editCategory = asyncHandler(async (req, res) => {
  console.log("sss");
  try {
    const { categoryId } = req.params;
    const { categoryTitle, subCategory } = req.body;

    const existingCategory = await Category.findById(categoryId);

    if (!existingCategory) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    existingCategory.categoryTitle = categoryTitle;
    existingCategory.subCategory = subCategory || [];

    const updatedCategory = await existingCategory.save();

    res.json(updatedCategory);
  } catch (err) {
    throw new Error(err);
  }
});

const getSingleCategory = asyncHandler(async (req, res) => {
  try {
    const { categoryId } = req.params; // Extract categoryId from request parameters

    // Find the category by its ID
    const category = await Category.findById(categoryId);

    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    res.json(category);
  } catch (err) {
    throw new Error(err);
  }
});

const getAllCategories = asyncHandler(async (req, res) => {
  try {
    const getAllCategories = await Category.find();
    res.json(getAllCategories);
  } catch (err) {
    throw new Error(err);
  }
});

const deleteSubCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.categoryId; // Category ID
  const subCategoryId = req.params.subCategoryId; // Subcategory ID

  try {
    // Use findOneAndUpdate to delete the subcategory
    const updatedCategory = await Category.findOneAndUpdate(
      { _id: categoryId },
      {
        $pull: { subCategory: { _id: subCategoryId } },
      },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(updatedCategory);
  } catch (err) {
    throw new Error(err);
  }
});

const addSubCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.categoryId; // Category ID

  try {
    // Create a new subcategory object based on the request data
    const newSubCategory = {
      subCategoryTitle: req.body.subCategoryTitle, // Assuming subCategoryTitle is sent in the request body
      subCategory: req.body.subCategory || [], // Assuming subcategories can be nested
    };

    const updatedCategory = await Category.updateOne(
      { _id: categoryId },
      {
        $addToSet: {
          subCategory: newSubCategory,
        },
      }
    );

    if (updatedCategory.nModified === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Subcategory added successfully" });
  } catch (err) {
    throw new Error(err);
  }
});

module.exports = {
  createCategory,
  getAllCategories,
  deleteSubCategory,
  editCategory,
  getSingleCategory,
  deleteCategory,
};
