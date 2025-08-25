const express = require("express");
const dotenv = require('dotenv');
const mongoose = require("mongoose");
const http = require("http");
const cors = require('cors');
const { verifyToken } = require("./middleware/verifyToken");

const UserRouter = require('./routers/UserRouter');
const SupplierRouter = require('./routers/SupplierRouter');
const ProductRouter = require('./routers/ProductRouter');
const PromotionRouter = require('./routers/PromotionRouter');
const CartRouter = require('./routers/CartRouter');
const ReviewRouter = require('./routers/ReviewRouter');
const SliderRouter = require('./routers/SliderRouter');
const PaymentRouter = require('./routers/PaymentRouter');
const NotificationRouter = require('./routers/NotificationRouter');
const WishlistRouter = require('./routers/WishlistRouter');
const orderRouter = require('./routers/OrderRouter');
const adminRouter = require('./routers/AdminRouter');
const BlogRouter = require('./routers/BlogRouter');
const ChatRouter = require('./routers/ChatRouter');
const WalletController = require('./routers/WalletRouter');
const initializeSocket = require("./socket/chatSocket"); // ✅ Import socket.io setup

dotenv.config();

const app = express();
const server = http.createServer(app); // ✅ Tạo server HTTP
const port = process.env.PORT || 3001; // ✅ Định nghĩa cổng

// ✅ Cấu hình CORS chính xác
app.use(cors({
    origin: "*", // Thay "*" bằng frontend domain nếu cần
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json()); // ✅ Chuyển dữ liệu sang JSON

// ✅ API Routes
app.use('/auth', UserRouter);
app.use('/products', ProductRouter);
app.use('/slider', SliderRouter);
app.use('/reviews', ReviewRouter);
app.use('/carts', CartRouter);
app.use('/payments', PaymentRouter);
app.use('/promotions', PromotionRouter);
app.use('/blogs', BlogRouter);
app.use('/supplier', SupplierRouter);
app.use('/admin', adminRouter);
app.use("/message", ChatRouter);
app.use("/wallet", WalletController);

// ✅ Chỉ bảo vệ API cần thiết
app.use('/notifications', verifyToken, NotificationRouter);
app.use('/wishlist', verifyToken, WishlistRouter);
app.use('/orders', verifyToken, orderRouter);

// ✅ Kết nối MongoDB với options ổn định hơn
mongoose.connect(process.env.MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

// ✅ Khởi tạo WebSocket
initializeSocket(server);

// ✅ Sử dụng `server.listen` thay vì `app.listen`
server.listen(port, () => {
    console.log("Server is running on port:", port);
});
