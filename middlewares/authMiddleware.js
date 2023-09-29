const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const ROLES = {
  User: 156,
  Editor: 289,
  Admin: 578,
};

const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;
  const cookie = req.cookies;
  if (!cookie.refreshToken)
    res.status(403).json({ message: "no refresh token" });
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({
    refreshToken: { $elemMatch: { token: refreshToken } },
  });
  if (user && req?.headers?.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    try {
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded?.id);
        req.user = user;
        next();
      }
    } catch (error) {
      res.status(403).json({ message: "token expired" });
    }
  } else {
    throw new Error("there is no token attached to header");
  }
});

const isAdmin = asyncHandler(async (req, res, next) => {
  const { email } = req.user;
  const user = await User.findOne({ email });
  if (user.role >= ROLES.Admin) {
    next();
  } else {
    throw new Error("you do not have access this resource");
  }
});

module.exports = { authMiddleware, isAdmin };
