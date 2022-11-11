var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send({ status: "ok", data: "hello" });
});

// AuthApi
const authApi = require("./auth.api");
router.use("/auth", authApi);

// UserApi
const userApi = require("./user.api");
router.use("/users", userApi);

// PostApi
const postApi = require("./post.api");
router.use("/posts", postApi);

// CommentApi
const commentApi = require("./comment.api");
router.use("/comments", commentApi);

// ReactionApi
const reactionApi = require("./reaction.api");
router.use("/reactions", reactionApi);

// FriendApi
const friendApi = require("./friend.api");
router.use("/friends", friendApi);

module.exports = router;
