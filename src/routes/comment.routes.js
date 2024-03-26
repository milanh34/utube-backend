import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addCommentToTweet, addCommentToVideo, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJWT);
router.route("/v/:videoId").get(getVideoComments).post(addCommentToVideo)
router.route("/t/:tweetId").post(addCommentToTweet)
router.route("/:commentId").patch(updateComment).delete(deleteComment)

export default router