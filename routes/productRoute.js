const express = require("express");
const {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
} = require("../controller/productCtrl");
const { authMiddleware } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/createProduct", createProduct);
router.get("/getAll", authMiddleware, getAllProducts);
router.put("/updateProduct/:id", authMiddleware, updateProduct);
router.get("/getProduct/:id", getProduct);
router.get("/deleteProduct/:id", deleteProduct);

module.exports = router;
