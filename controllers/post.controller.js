const { catchAsync, sendResponse, AppError } = require("../helpers/utils");
const Comment = require("../models/Comment");
const Friend = require("../models/Friend");
const Post = require("../models/Post");
const User = require("../models/User");
const postController = {};

const calculatePostCount = async (userId) => {
  const postCount = await Post.countDocuments({
    author: userId,
    isDelete: false,
  });
  await User.findByIdAndUpdate(userId, { postCount });
};
postController.createNewPost = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const { content, image } = req.body;
  let post = await Post.create({ content, image, author: currentUserId });
  await calculatePostCount(currentUserId);
  post = await post.populate("author");
  return sendResponse(
    res,
    200,
    true,
    post,
    null,
    "create new post successfully"
  );
});

postController.getPosts = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const userId = req.params.userId;
  let { page, limit, ...filter } = { ...req.query };

  let user = await User.findById(userId);
  if (!user) throw new AppError(400, "User not found", "Get Post Error");

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  let userFriendIDs = await Friend.find({
    $or: [{ from: userId }, { to: userId }],
    status: "accepted",
  });
  if (userFriendIDs && userFriendIDs.length) {
    userFriendIDs = userFriendIDs.map((friend) => {
      if (friend.from._id.equals(userId)) return friend.to;
      return friend.from;
    });
  } else {
    userFriendIDs = [];
  }
  userFriendIDs = [...userFriendIDs, userId];
  const filterConditions = [
    { isDeleted: false },
    { author: { $in: userFriendIDs } },
  ];
  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};

  const count = await Post.countDocuments(filterCriteria);
  const totalPages = Math.ceil(count / limit);
  const offset = limit * (page - 1);

  let posts = await Post.find(filterCriteria)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate("author");

  return sendResponse(
    res,
    200,
    true,
    { posts, totalPages, count },
    null,
    "get posts successfully"
  );
});

postController.updatePost = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const postId = req.params.id;

  let post = await Post.findById(postId);
  if (!post) throw new AppError(400, "Post not found", "Update Post Error");
  if (!post.author.equals(currentUserId))
    throw new AppError(400, "Only author can update post", "Update Post Error");
  const allows = ["content", "image"];
  allows.forEach((field) => {
    if (req.body[field] !== undefined) {
      post[field] = req.body[field];
    }
  });
  await post.save();

  return sendResponse(res, 200, true, post, null, "Update post successfully");
});

postController.getSinglePost = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const postId = req.params.id;

  let post = await Post.findById(postId);
  if (!post) throw new AppError(400, "Post not found", "Get Single Post Error");

  post = post.toJSON();
  post.comments = await Comment.find({ post: post._id }).populate("author");
  return sendResponse(
    res,
    200,
    true,
    post,
    null,
    "get Single Post successfully"
  );
});

postController.deletePost = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const postId = req.params.id;

  const post = await Post.findOneAndUpdate(
    { _id: postId, author: currentUserId },
    { isDeleted: true },
    { new: true }
  );
  if (!post)
    throw new AppError(
      400,
      "Post not found or User not authorized",
      "Delete post Error"
    );
  return sendResponse(res, 200, true, post, null, "delete post successfully");
});

postController.getCommentsOfPost = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  let { page, limit } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  //validate post exists
  const post = await Post.findById(postId);
  if (!post) throw new AppError(400, "Post not found", "Get Comments Error");

  //get comments
  const count = await Comment.countDocuments({ post: postId });
  const totalPages = Math.ceil(count / limit);
  const offset = limit * (page - 1);

  const comments = await Comment.find({ post: postId })
    .sort({ createAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate("author");

  //send response
  return sendResponse(
    res,
    200,
    true,
    { comments, totalPages, count },
    null,
    "GEt comments successfully"
  );
});
module.exports = postController;
