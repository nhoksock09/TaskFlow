const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    searchUsers,
    sendRequest,
    getIncomingRequests,
    getOutgoingRequests,
    acceptRequest,
    rejectRequest,
    getConnections,
    removeConnection,
} = require("../controllers/connectionController");

router.use(protect);

router.get("/search", searchUsers);
router.get("/requests/incoming", getIncomingRequests);
router.get("/requests/outgoing", getOutgoingRequests);
router.post("/requests", sendRequest);
router.put("/requests/:id/accept", acceptRequest);
router.put("/requests/:id/reject", rejectRequest);

router.route("/").get(getConnections);
router.route("/:id").delete(removeConnection);

module.exports = router;
