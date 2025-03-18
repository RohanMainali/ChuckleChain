const express = require("express")
const {
  getUserProfile,
  getMyProfile,
  updateProfile,
  followUser,
  getTopUsers,
  getUserFollowers,
  getUserFollowing,
  resetRelationships,
  debugRelationships,
  searchUsers,
} = require("../controllers/users")
const { protect } = require("../middleware/auth")

const router = express.Router()

router.get("/me", protect, getMyProfile)
router.put("/me", protect, updateProfile)
router.get("/top", protect, getTopUsers)
router.get("/debug-relationships", protect, debugRelationships)
router.post("/reset-relationships", protect, resetRelationships)
router.get("/search", protect, searchUsers)
router.get("/:username", protect, getUserProfile)
router.put("/:username/follow", protect, followUser)
router.get("/:username/followers", protect, getUserFollowers)
router.get("/:username/following", protect, getUserFollowing)

module.exports = router

