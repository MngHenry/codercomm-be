const { sendResponse, catchAsync, AppError } = require("../helpers/utils");
const Comment = require("../models/Comment");
const Post = require("../models/Post");

const commentController = {};

const calculateCommentCount = async (postId) => {
  const commentCount = await Comment.countDocuments({
    post: postId,
    isDelete: false,
  });
  await Post.findByIdAndUpdate(postId, { commentCount });
};

commentController.createNewComment = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const { content, postId } = req.body;

  //check post exists
  const post = Post.findById(postId);
  if (!post)
    throw new AppError(400, "Post not found", "Create new comment error");
  //create new comment
  let comment = await Comment.create({
    author: currentUserId,
    post: postId,
    content,
  });
  ///update commentCount of the post
  await calculateCommentCount(postId);
  comment = await comment.populate("author");

  return sendResponse(
    res,
    200,
    true,
    comment,
    null,
    "Create new comment successfully"
  );
});

commentController.updateComment = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const commentId = req.params.id;
  const { content } = req.body;

  const comment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      author: currentUserId,
    },
    { content },
    { new: true }
  );

  if (!comment)
    throw new AppError(
      400,
      "Comment not found or User not authorized",
      "Update Comment Error"
    );
  return sendResponse(
    res,
    200,
    true,
    comment,
    null,
    "update comment successfully"
  );
});

commentController.deleteComment = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const commentId = req.params.id;

  const comment = await Comment.findByIdAndDelete({
    _id: commentId,
    author: currentUserId,
  });

  if (!comment)
    throw new AppError(
      400,
      "Comment not found or User not authorized",
      "Delete Comment Error"
    );
  await calculateCommentCount(comment.post);

  return sendResponse(
    res,
    200,
    true,
    comment,
    null,
    "update comment successfully"
  );
});

commentController.getSingleComment = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const commentId = req.params.id;

  let comment = await Comment.findById(commentId);
  if (!comment)
    throw new AppError(400, "Comment not found", "Get Single Comment Error");

  await calculateCommentCount(comment.post);

  return sendResponse(
    res,
    200,
    true,
    comment,
    null,
    "get comment successfully"
  );
});

module.exports = commentController;
