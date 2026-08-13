const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema(
    {
        requester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },

        // Sorted requester/recipient pair, used to enforce a single unique
        // connection between two users regardless of who sent the request.
        userMin: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        userMax: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        respondedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

connectionSchema.pre("validate", function () {
    if (this.requester && this.recipient) {
        const [min, max] = [this.requester.toString(), this.recipient.toString()].sort();
        this.userMin = min;
        this.userMax = max;
    }
});

// Only one pending/accepted connection allowed between any two users;
// rejected connections are excluded so a fresh request can be sent again.
connectionSchema.index(
    { userMin: 1, userMax: 1 },
    { unique: true, partialFilterExpression: { status: { $in: ["pending", "accepted"] } } }
);

connectionSchema.index({ recipient: 1, status: 1 });
connectionSchema.index({ requester: 1, status: 1 });

module.exports = mongoose.model("Connection", connectionSchema);
