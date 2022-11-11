const { sendResponse, AppError, catchAsync } = require("../helpers/utils");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Friend = require("../models/Friend");
const userController = {};

userController.register = catchAsync(async (req, res, next) => {
  // get data from request
  let { name, email, password } = req.body;
  // validation
  let user = await User.findOne({ email: email });
  if (user)
    throw new AppError(400, "User already exists", "registration Error");
  // process
  const salt = await bcrypt.genSalt(10);
  password = await bcrypt.hash(password, salt);
  user = await User.create({ name, email, password });
  const accessToken = await user.generateToken();

  // response
  sendResponse(res, 200, true, { user }, null, "create user successfully");
});

userController.getUsers = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  let { page, limit, ...filter } = { ...req.query };
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  const filterConditions = [{ isDeleted: false }];
  if (filter.name) {
    filterConditions.push({ name: { $regex: filter.name, $options: "i" } });
  }
  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};

  const count = await User.countDocuments(filterCriteria);
  const totalPages = Math.ceil(count / limit);
  const offset = limit * (page - 1);

  let users = await User.find(filterCriteria)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);

  const promises = users.map(async (user) => {
    let temp = user.toJSON();
    temp.friendShip = await Friend.findOne({
      $or: [
        { from: currentUserId, to: user._id },
        { from: user._id, to: currentUserId },
      ],
    });
    return temp;
  });
  const usersWithFriendShip = await Promise.all(promises);
  return sendResponse(
    res,
    200,
    true,
    { users: usersWithFriendShip, totalPages, count },
    null,
    "get user successfully"
  );
});

userController.getCurrentUser = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const user = await User.findById(currentUserId);
  if (!user)
    throw new AppError(400, "User not found", "Get Current User Error");
  return sendResponse(
    res,
    200,
    true,
    user,
    null,
    "get current user successfully"
  );
});

userController.getSingleUser = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const userId = req.params.id;

  let user = await User.findById(userId);
  if (!user) throw new AppError(400, "User not found", "Get Single User Error");

  user = user.toJSON();
  user.friendShip = await Friend.findOne({
    $or: [
      { from: currentUserId, to: userId },
      { from: userId, to: currentUserId },
    ],
  });

  return sendResponse(
    res,
    200,
    true,
    user,
    null,
    "get Single user successfully"
  );
});

userController.updateProfile = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const userId = req.params.id;

  if (currentUserId !== userId)
    throw new AppError(400, "Permission denied", "Update User Error");
  let user = await User.findById(userId);
  if (!user) throw new AppError(400, "User not found", "Update User Error");

  const allows = [
    "name",
    "avatarUrl",
    "aboutMe",
    "city",
    "country",
    "company",
    "jobTitle",
    "facebookLink",
    "instagramLink",
    "linkedinLink",
    "twitterLink",
  ];
  allows.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });
  await user.save();

  return sendResponse(res, 200, true, user, null, "Update user successfully");
});

module.exports = userController;
