import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPlaylist, getPlaylistById } from "../controllers/playlist.controller.js";

const router = Router();

router.use(verifyJWT)
router.route("/").post(createPlaylist)
router.route("/:playlistId")
    .get(getPlaylistById)

export default router