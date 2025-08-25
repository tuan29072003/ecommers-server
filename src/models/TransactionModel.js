const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        walletId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'wallet',
            required: true,
        },
        transactionType: {
            type: String,
            enum: ['payment', 'refund', 'deposit'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ['success', 'failed'],
            default: 'success',
        },
        method: {
            type: String,
        },
        description: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true, // Tự động thêm createdAt và updatedAt
    }
);
const TransactionModel = mongoose.model('WalletTransaction', transactionSchema);

module.exports = TransactionModel
