import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, togglePlaylistStatus, updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router();

router.use(verifyJWT)

router.route("/").post(createPlaylist)

router.route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist)

router.route("/user/:userId").get(getUserPlaylists)

router.route("/toggle/:playlistId").patch(togglePlaylistStatus)

export default router