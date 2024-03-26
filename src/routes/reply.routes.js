import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addReply, deleteReply, getCommentReplies, updateReply } from "../controllers/reply.contoller.js";

const router = Router()

router.use(verifyJWT)
router.route("/c/:commentId").get(getCommentReplies).post(addReply)
router.route("/:replyId").patch(updateReply).delete(deleteReply)

export default router