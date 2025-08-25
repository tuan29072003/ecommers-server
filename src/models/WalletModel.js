const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true,
        },
        balance: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: ['active', 'locked'],
            default: 'active',
        },
    },
    {
        timestamps: true, // Tự động thêm createdAt và updatedAt
    }
);
const WalletModel = mongoose.model('wallet', walletSchema);//save in collectiion user and get information as UsersChema

module.exports = WalletModel
