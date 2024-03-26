import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getCommentReplies } from "../controllers/reply.contoller.js";

const router = Router()

router.use(verifyJWT)
router.route("/c/:commentId").get(getCommentReplies).post()
router.route("/:replyId").patch().delete()

export default router