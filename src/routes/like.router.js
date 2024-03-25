import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleVideoLike } from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJWT)
router.route("/toggle/v/:videoId").post(toggleVideoLike)
router.route("/toggle/t/:tweetId").post()
router.route("/toggle/c/:commentId").post()
router.route("/videos").get()

export default router