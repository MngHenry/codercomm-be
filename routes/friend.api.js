const express = require("express");
const { body, param } = require("express-validator");
const {
  sendFriendRequest,
  getReceivedFriendRequestList,
  getSentFriendRequestList,
  getFriendList,
  reactFriendRequest,
  cancelFriendRequest,
  removeFriend,
} = require("../controllers/friend.controller");
const authentication = require("../middlewares/authentication");
const validators = require("../middlewares/validators");
const router = express.Router();

/**
 * @route POST /friends/requests
 * @description Send a friend request
 * @body {to: User ID}
 * @access Login required
 */
router.post(
  "/requests",
  authentication.loginRequired,
  validators.validate([
    body("to").exists().isString().custom(validators.checkObjectId),
  ]),
  sendFriendRequest
);
/**
 * @route GET /friends/requests/incoming
 * @description Get the list of received pending requests
 * @access Login required
 */
router.get(
  "/requests/incoming",
  authentication.loginRequired,
  getReceivedFriendRequestList
);

/**
 * @route GET /friends/requests/outgoing
 * @description Get the list of sent pending requests
 * @access Login required
 */
router.get(
  "/requests/outgoing",
  authentication.loginRequired,
  getSentFriendRequestList
);

/**
 * @route GET /friends
 * @description Get the list of friends
 * @access Login required
 */
router.get("/", authentication.loginRequired, getFriendList);

/**
 * @route PUT /friends/requests/:userId
 * @description Accept/Reject a received pending requests
 * @body {status: 'accepted' or 'declined'}
 * @access Login required
 */
router.put(
  "/requests/:userId",
  authentication.loginRequired,
  validators.validate([
    param("userId").exists().isString().custom(validators.checkObjectId),
    body("status").exists().isString().isIn(["accepted", "declined"]),
  ]),
  reactFriendRequest
);

/**
 * @route DELETE /friends/requests/:userId
 * @description Cancel a friend request
 * @access Login required
 */
router.delete(
  "/requests/:userId",
  authentication.loginRequired,
  validators.validate([
    param("userId").exists().isString().custom(validators.checkObjectId),
  ]),
  cancelFriendRequest
);

/**
 * @route DELETE /friends/requests/:userId
 * @description Remove a friend
 * @access Login required
 */
router.delete(
  "/:userId",
  authentication.loginRequired,
  validators.validate([
    param("userId").exists().isString().custom(validators.checkObjectId),
  ]),
  removeFriend
);

module.exports = router;
