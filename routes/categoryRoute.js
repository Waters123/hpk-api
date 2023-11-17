const express = require("express");
const {
  createCategory,
  getAllCategories,
  deleteCategory,
  editCategory,
  getSingleCategory,
} = require("../controller/categoryCtrl");

const router = express.Router();

router.post("/createCategory", createCategory);
router.put("/editCategory/:categoryId", editCategory);
router.get("/getSingleCategory/:categoryId", getSingleCategory);
router.get("/getAll", getAllCategories);
router.delete("/deleteCategory/:id", deleteCategory);
module.exports = router;
