const User = require("../models/User");
const Connection = require("../models/Connection");

const buildRelationMap = async (userId, otherUserIds) => {
    if (!otherUserIds.length) return {};
    const connections = await Connection.find({
        $or: [
            { requester: userId, recipient: { $in: otherUserIds } },
            { recipient: userId, requester: { $in: otherUserIds } },
        ],
    });

    const map = {};
    connections.forEach((c) => {
        const otherId =
            c.requester.toString() === userId.toString() ? c.recipient.toString() : c.requester.toString();
        if (c.status === "accepted") {
            map[otherId] = { connectionStatus: "accepted", connectionId: c._id };
        } else if (c.status === "pending") {
            map[otherId] = {
                connectionStatus: c.requester.toString() === userId.toString() ? "pending-outgoing" : "pending-incoming",
                connectionId: c._id,
            };
        }
        // rejected connections are treated as 'none' — a fresh request can be sent again
    });
    return map;
};

const searchUsers = async (req, res) => {
    try {
        const { search, page = 1, limit = 5 } = req.query;
        let query = { _id: { $ne: req.user.id } };
        if (search) {
            query = {
                ...query,
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ],
            };
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select("name email dateOfBirth")
            .sort({ name: 1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        const relationMap = await buildRelationMap(
            req.user.id,
            users.map((u) => u._id)
        );

        const data = users.map((u) => {
            const relation = relationMap[u._id.toString()];
            return {
                _id: u._id,
                name: u.name,
                email: u.email,
                dateOfBirth: u.dateOfBirth,
                connectionStatus: relation ? relation.connectionStatus : "none",
                connectionId: relation ? relation.connectionId : undefined,
            };
        });

        res.status(200).json({
            success: true,
            data,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)) || 1,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const sendRequest = async (req, res) => {
    try {
        const { recipientId } = req.body;
        if (!recipientId) {
            return res.status(400).json({ message: "Recipient is required." });
        }
        if (recipientId === req.user.id) {
            return res.status(400).json({ message: "You cannot send a connection request to yourself." });
        }
        const recipient = await User.findById(recipientId);
        if (!recipient) return res.status(404).json({ message: "User not found." });

        const connection = await Connection.create({
            requester: req.user.id,
            recipient: recipientId,
        });

        res.status(201).json({
            success: true,
            message: "Connection request sent.",
            data: connection,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "A connection already exists between these users." });
        }
        res.status(500).json({ message: error.message });
    }
};

const getIncomingRequests = async (req, res) => {
    try {
        const requests = await Connection.find({ recipient: req.user.id, status: "pending" })
            .populate("requester", "name email dateOfBirth")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: requests, total: requests.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getOutgoingRequests = async (req, res) => {
    try {
        const requests = await Connection.find({ requester: req.user.id, status: "pending" })
            .populate("recipient", "name email dateOfBirth")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: requests, total: requests.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const acceptRequest = async (req, res) => {
    try {
        const connection = await Connection.findById(req.params.id);
        if (!connection) return res.status(404).json({ message: "Connection request not found." });
        if (connection.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: "Only the recipient can accept this request." });
        }
        if (connection.status !== "pending") {
            return res.status(400).json({ message: "This request is no longer pending." });
        }
        connection.status = "accepted";
        connection.respondedAt = new Date();
        await connection.save();
        res.status(200).json({ success: true, message: "Connection request accepted.", data: connection });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const rejectRequest = async (req, res) => {
    try {
        const connection = await Connection.findById(req.params.id);
        if (!connection) return res.status(404).json({ message: "Connection request not found." });
        if (connection.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: "Only the recipient can reject this request." });
        }
        if (connection.status !== "pending") {
            return res.status(400).json({ message: "This request is no longer pending." });
        }
        connection.status = "rejected";
        connection.respondedAt = new Date();
        await connection.save();
        res.status(200).json({ success: true, message: "Connection request rejected.", data: connection });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getConnections = async (req, res) => {
    try {
        const { search, page = 1, limit = 5 } = req.query;
        const connections = await Connection.find({
            status: "accepted",
            $or: [{ requester: req.user.id }, { recipient: req.user.id }],
        })
            .populate("requester", "name email dateOfBirth")
            .populate("recipient", "name email dateOfBirth")
            .sort({ respondedAt: -1 });

        let items = connections.map((c) => {
            const isRequester = c.requester._id.toString() === req.user.id;
            const other = isRequester ? c.recipient : c.requester;
            return {
                connectionId: c._id,
                user: {
                    _id: other._id,
                    name: other.name,
                    email: other.email,
                    dateOfBirth: other.dateOfBirth,
                },
                connectedSince: c.respondedAt,
            };
        });

        if (search) {
            const regex = new RegExp(search, "i");
            items = items.filter((item) => regex.test(item.user.name) || regex.test(item.user.email));
        }

        const total = items.length;
        const startIndex = (Number(page) - 1) * Number(limit);
        const paginated = items.slice(startIndex, startIndex + Number(limit));

        res.status(200).json({
            success: true,
            data: paginated,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)) || 1,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const removeConnection = async (req, res) => {
    try {
        const connection = await Connection.findById(req.params.id);
        if (!connection) return res.status(404).json({ message: "Connection not found." });
        const isParticipant =
            connection.requester.toString() === req.user.id || connection.recipient.toString() === req.user.id;
        if (!isParticipant) {
            return res.status(403).json({ message: "You are not part of this connection." });
        }
        await Connection.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Connection removed." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    searchUsers,
    sendRequest,
    getIncomingRequests,
    getOutgoingRequests,
    acceptRequest,
    rejectRequest,
    getConnections,
    removeConnection,
};
