const express = require("express");
const {
  createUser,
  loginUserCtrl,
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
  blockUser,
  unBlockUser,
  handleRefreshToken,
  logOut,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  createUserVerificationToken,
  verifyUser,
} = require("../controller/userCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", createUser);
router.post(
  "/send-user-verification",
  authMiddleware,
  createUserVerificationToken
);
router.get("/verify-user/:token", verifyUser);

router.post("/forgot-password-token", forgotPasswordToken);

router.put("/reset-password/:token", resetPassword);

router.put("/changepassword", authMiddleware, updatePassword);
router.post("/login", loginUserCtrl);
router.get("/logout", logOut);
router.get("/all-users", authMiddleware, isAdmin, getAllUsers);
router.get("/getsingleuser/:id", authMiddleware, isAdmin, getUser);
router.delete("/deleteuser/:id", deleteUser);
router.put("/updateuser/:id", updateUser);
router.put("/block-user/:id", authMiddleware, isAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware, isAdmin, unBlockUser);
router.get("/refreshtoken", handleRefreshToken);

module.exports = router;
