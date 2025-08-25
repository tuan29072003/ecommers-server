const NotificationModel = require('../models/NotificationModel');
const TransactionModel = require('../models/TransactionModel');
const WalletModel = require('../models/WalletModel'); // Đường dẫn đến model ví
const { VNPay } = require('vnpay');;
// Nếu bạn chưa có logger riêng, có thể định nghĩa một hàm logger rỗng:
const ignoreLogger = () => { };

// Định nghĩa hằng số (có thể tùy chỉnh theo nhu cầu)
const VnpLocale = { VN: 'vn', EN: 'en' };
const ProductCode = { Other: 'other' };
// Hàm lấy thông tin ví
const getWalletInfo = async (req, res) => {
    const { userId } = req.query; // Lấy userId từ query string

    try {
        // Tìm ví theo userId
        const wallet = await WalletModel.findOne({ userId });

        // Nếu không tìm thấy ví
        if (!wallet) {
            return res.status(200).json({
                success: false,
                message: 'Wallet not found for this user. Please create a new wallet.',
                needToCreate: true, // Thông báo client cần tạo ví
            });
        }

        // Trả về thông tin ví
        return res.status(200).json({
            success: true,
            needToCreate: false,
            data: wallet,
        });
    } catch (error) {
        console.error('Error getting wallet info:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve wallet information',
            error: error.message,
        });
    }
};
const createWallet = async (req, res) => {
    const { userId } = req.body;
    try {
        const wallet = new WalletModel({ userId });
        await wallet.save();
        res.status(201).json(wallet);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create wallet' });
    }
}

const deposit = async (req, res) => {
    const body = req.body;
    console.log(body)
    try {
        const wallet = await WalletModel.findById(body.walletId);
        if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

        wallet.balance += body.amount;
        await wallet.save();

        const transaction = new TransactionModel(body);

        console.log(transaction)
        await transaction.save();

        res.status(200).json({ message: 'Deposit successful', data: wallet });
    } catch (error) {
        res.status(500).json({ error: 'Deposit failed' });
    }
}
const getAll = async (req, res) => {
    const { walletId } = req.query;
    try {
        const wallet = await TransactionModel.find({ walletId }).sort({ createdAt: -1 });

        res.status(200).json({ message: 'Deposit successful', data: wallet });
    } catch (error) {
        res.status(500).json({ error: 'Deposit failed' });
    }
}
const createPayment = async (req, res) => {
    // Khởi tạo đối tượng VNPay với cấu hình từ VNPay
    const { default: dateFormat } = await import('dateformat');
    const vnpay = new VNPay({
        tmnCode: 'M4CZ8E16',
        secureSecret: "BTS4G8PKGGZRMWIUICRM9M9DGNV236MJ",
        vnpayHost: 'https://sandbox.vnpayment.vn',
        testMode: true,
        hashAlgorithm: 'SHA512',
        loggerFn: ignoreLogger
    });

    try {
        // Lấy thông tin đơn hàng từ client
        // Ví dụ: { total: 300000, databill: { uid, products, ... } }
        const { amount, databill } = req.body;
        if (!amount || !databill) {
            return res.status(400).json({ message: 'Thiếu thông tin đơn hàng' });
        }

        // Lưu bill vào cơ sở dữ liệu
        const newBill = new TransactionModel(databill);
        // Giả sử trong databill có trường products chứa mảng sản phẩm
        await newBill.save();

        // Sử dụng _id của bill làm mã giao dịch duy nhất
        const txnRef = newBill._id.toString();

        // Tính ngày hết hạn giao dịch (ví dụ: 1 ngày sau)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Gọi hàm buildPaymentUrl của VNPay để tạo URL thanh toán
        const vnpayResponse = await vnpay.buildPaymentUrl({
            vnp_Amount: amount, // Số tiền VNĐ
            vnp_IpAddr: '127.0.0.1', // Có thể thay bằng request IP nếu cần
            vnp_TxnRef: txnRef,
            vnp_OrderInfo: `Thanh toán đơn hàng ${txnRef}`,
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: 'http://localhost:3002/wallet/payment_return',
            vnp_Locale: VnpLocale.VN,
            vnp_CreateDate: dateFormat(new Date(), "yyyymmddHHMMss"),
            vnp_ExpireDate: dateFormat(tomorrow, "yyyymmddHHMMss")
        });

        // Trả về URL thanh toán cho client
        return res.status(200).json({ data: vnpayResponse, message: 'Success', billId: txnRef });
    } catch (error) {
        console.error('Error creating VNPay payment URL:', error);
        return res.status(500).json({ message: 'Lỗi hệ thống khi tạo URL thanh toán' });
    }
};
const paymentReturn = async (req, res) => {
    try {
        console.log('Bắt đầu xử lý phản hồi thanh toán từ VNPay...');
        console.log('Dữ liệu nhận được từ VNPay:', req.query);

        // Khởi tạo VNPay instance với cấu hình của bạn
        const vnpay = new VNPay({
            tmnCode: 'M4CZ8E16',
            secureSecret: "BTS4G8PKGGZRMWIUICRM9M9DGNV236MJ",
            vnpayHost: 'https://sandbox.vnpayment.vn',
            testMode: true,
            hashAlgorithm: 'SHA512',
            loggerFn: ignoreLogger
        });

        // Sử dụng hàm verifyReturnUrl của thư viện để kiểm tra dữ liệu callback
        const result = await vnpay.verifyReturnUrl(req.query);
        console.log('Kết quả kiểm tra chữ ký:', result);

        // Kiểm tra nếu result không tồn tại hoặc isSuccess là false
        if (!result || !result.isSuccess) {
            console.error('Xác thực chữ ký không thành công hoặc không có kết quả.');
            console.log('Thông báo từ VNPay:', result?.message || 'Không có thông báo');
            return res.redirect('http://localhost:3000/profile?payment=fail');
        }

        // Lấy mã giao dịch từ kết quả callback sử dụng vnp_TxnRef
        const txnRef = result.vnp_TxnRef;
        console.log('Mã giao dịch (vnp_TxnRef):', txnRef);
        console.log('Mã phản hồi từ VNPay (vnp_ResponseCode):', result.vnp_ResponseCode);

        if (result.vnp_ResponseCode === '00') {
            console.log('Giao dịch thành công.');
            const bill = await TransactionModel.findById(txnRef);
            const wallet = await WalletModel.findById(bill.walletId)
            wallet.balance += bill.amount;
            await wallet.save();


            return res.redirect('http://localhost:3000/profile?payment=success');
        } else {
            console.log('Giao dịch thất bại với mã phản hồi:', result.vnp_ResponseCode);
            console.log('Xóa hóa đơn với mã:', txnRef);
            await TransactionModel.findByIdAndDelete(txnRef);
            return res.redirect('http://localhost:3000/profile?payment=fail');
        }
    } catch (error) {
        console.error('Error in paymentReturn:', error);
        return res.status(500).json({ message: 'Lỗi hệ thống trong quá trình phản hồi thanh toán' });
    }
};

module.exports = { getWalletInfo, createWallet, deposit, getAll, createPayment, paymentReturn };