const { generateToken } = require("../config/jwToken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbID = require("../utils/validateMongoDb");
const { generateRefreshToken } = require("../config/refreshToke");
const jwt = require("jsonwebtoken");
const sendEmail = require("./emailCtrl");
const crypto = require("crypto");

const createUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  let findUser = await User.findOne({ email: email });

  if (!findUser) {
    // create a new User

    const newUser = await User.create(req.body);

    let findUser = await User.findOne({ email });
    if (findUser && (await findUser.isPasswordMatched(password))) {
      const refreshToken = await generateRefreshToken(newUser?._id);
      const updateUser = await User.findByIdAndUpdate(
        newUser?._id,
        {
          $push: {
            refreshToken: {
              token: refreshToken,
            },
          },
        },
        { new: true }
      );
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        path: "/",
        maxAge: 72 * 60 * 60 * 1000,
        secure: true,
        sameSite: "none",
        domain: ".happykidss.shop",
      });
      res.json({
        _id: newUser?._id,
        firstName: newUser?.firstName,
        lastName: newUser?.lastName,
        email: newUser?.email,
        mobile: newUser?.mobile,
        role: newUser?.role,
        token: generateToken(newUser?._id),
      });
    }
  } else {
    res.sendStatus(409);
  }
});

const createUserVerificationToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found with this email");
  try {
    const token = await user.createVerificationToken();
    await user.save();
    const resetURL = `Hi, Please follow this link to verify User. This link is valid till 10 minutes from now. <a href='http://localhost:3011/auth/verify-user/${token}'>Click Here</>`;
    const data = {
      to: email,
      text: "Hey User",
      subject: "User Verification",
      html: resetURL,
    };
    sendEmail(data);
    res.json({ message: "reset link sent" });
  } catch (error) {
    throw new Error(error);
  }
});

const verifyUser = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error(" Token Expired, Please try again later");
  user.verified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();
  res.json("user verified");
});

const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const findUser = await User.findOne({ email });
  if (findUser && (await findUser.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateUser = await User.findByIdAndUpdate(
      findUser?._id,
      {
        $push: {
          refreshToken: {
            token: refreshToken,
          },
        },
      },
      { new: true }
    );

    await User.findByIdAndUpdate(findUser?._id, {
      $push: {
        refreshToken: {
          $each: [],
          $slice: -3, // Keep the last 3 elements.
        },
      },
    });

    await res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      path: "/",
      maxAge: 72 * 60 * 60 * 1000,
      secure: true,
      sameSite: "none",
      domain: ".happykidss.shop",
    });
    res.json({
      _id: findUser?._id,
      firstName: findUser?.firstName,
      lastName: findUser?.lastName,
      email: findUser?.email,
      mobile: findUser?.mobile,
      role: findUser?.role,
      verified: findUser?.verified,
      token: generateToken(findUser._id),
    });
  } else {
    throw new Error("Ivalid Credentials");
  }
});

const handleRefreshToken = asyncHandler(async (req, res, next) => {
  const cookie = req.cookies;
  if (!cookie.refreshToken) throw new Error("No Refresh Token");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({
    refreshToken: { $elemMatch: { token: refreshToken } },
  }); // find refresh token in array of refreshtoken array
  if (!user) throw new Error("No Refresh token present in Db or not matched");
  jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, decoded) => {
    // find if there is error and remove refresh token
    if (err || user.id !== decoded.id) {
      await User.updateOne(
        { _id: user._id },
        { $pull: { refreshToken: { token: refreshToken } } }
      );

      // Return an appropriate response to the client
      return res
        .status(401)
        .json({ error: "There is something wrong with refresh token" });
    }
    const accessToken = generateToken(user?._id);
    res.json({
      accessToken,
      _id: user?._id,
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      mobile: user?.mobile,
      role: user?.role,
      verified: user?.verified,
    });
  });
});

//logout
const logOut = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({
    refreshToken: { $elemMatch: { token: refreshToken } },
  }); //
  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    return res.sendStatus(204); // forbidden
  }
  if (user.refreshToken.length > 1) {
    await User.updateOne(
      { _id: user._id },
      { $pull: { refreshToken: { token: refreshToken } } }
    );
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });
  res.sendStatus(204); // forbidden
});

//Get all users

const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const getAllUsers = await User.find();
    res.json(getAllUsers);
  } catch (error) {
    throw new Error();
  }
});

//Get single user
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbID(id);
  try {
    const getUser = await User.findById(id);
    res.json(getUser);
  } catch (error) {
    throw new Error(error);
  }
});

//update a user
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbID(id);
  const { firstName, lastName, email, mobile } = req.body;
  try {
    const updateUser = await User.findByIdAndUpdate(
      id,
      {
        firstName,
        lastName,
        email,
        mobile,
      },
      { new: true }
    );
    res.json(updateUser);
  } catch (error) {
    throw new Error(error);
  }
});

//delete user
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbID(id);
  try {
    const deleteUser = await User.findByIdAndDelete(id);
    res.json({ deleteUser });
  } catch (error) {
    throw new Error(error);
  }
});

const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbID(id);
  try {
    const blocked = await User.findByIdAndUpdate(
      id,
      { isBlocked: true },
      { new: true }
    );
    res.json({
      message: "User Blocked",
      blocked,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const unBlockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbID(id);
  try {
    const unBlock = await User.findByIdAndUpdate(
      id,
      { isBlocked: false },
      { new: true }
    );
    res.json({
      message: "User Unblocked",
      unBlock,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { currentPassword, password } = req.body;

  validateMongoDbID(_id);
  const user = await User.findById(_id);
  if (password && (await user.isPasswordMatched(currentPassword))) {
    if (await user.isPasswordMatched(password)) {
      res.status(406).json({ message: "this password is already in use" });
    }
    user.password = password;
    const updatedPassword = await user.save();
    res.json({ password: "password updated" });
  } else {
    res.status(404).json({ message: "error" });
  }
});

const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found with this email");
  try {
    const token = await user.createPasswordResetToken();
    await user.save();
    const resetURL = `Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from now. <a href='http://localhost:3011/auth/reset-password/${token}'>Click Here</>`;
    const data = {
      to: email,
      text: "Hey User",
      subject: "Forgot Password Link",
      html: resetURL,
    };
    sendEmail(data);
    res.json({ message: "reset link sent" });
  } catch (error) {
    throw new Error(error);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error(" Token Expired, Please try again later");
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json(user);
});

module.exports = {
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
};
