import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getLikedTweets, getLikedVideos, toggleCommentLike, toggleReplyLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJWT)
router.route("/toggle/v/:videoId").post(toggleVideoLike)
router.route("/toggle/t/:tweetId").post(toggleTweetLike)
router.route("/toggle/c/:commentId").post(toggleCommentLike)
router.route("/toggle/r/:replyId").post(toggleReplyLike)
router.route("/videos").get(getLikedVideos)
router.route("/tweets").get(getLikedTweets)

export default router