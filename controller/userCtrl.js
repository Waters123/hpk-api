const { generateToken } = require("../config/jwToken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbID = require("../utils/validateMongoDb");
const { generateRefreshToken } = require("../config/refreshToke");
const jwt = require("jsonwebtoken");

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
              deviceUID: deviceUID,
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
    throw new Error("User already Exists");
  }
});

const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password, deviceUID } = req.body;
  const findUser = await User.findOne({ email });
  if (findUser && (await findUser.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateUser = await User.findByIdAndUpdate(
      findUser?._id,
      {
        $push: {
          refreshToken: {
            token: refreshToken,
            deviceUID: deviceUID,
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

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      path: "/",
      maxAge: 72 * 60 * 60 * 1000,
      secure: true,
      // sameSite: "none",
      // domain: ".happykidss.shop",
    });
    res.json({
      _id: findUser?._id,
      firstName: findUser?.firstName,
      lastName: findUser?.lastName,
      email: findUser?.email,
      mobile: findUser?.mobile,
      role: findUser?.role,
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
  await User.updateOne(
    { _id: user._id },
    { $pull: { refreshToken: { token: refreshToken } } }
  );

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
};
