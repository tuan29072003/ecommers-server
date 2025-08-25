/** @format */
const OrderModel = require("../models/OrderModel");
const BillModel = require("../models/BillModel");
const CategoryModel = require("../models/CategoryModel");
const ProductModel = require("../models/ProductModel");
const SubProductModel = require("../models/SubProductModel");
const UserModel = require("../models/UserModel");
const ContactModel = require("../models/ContactModel");
const moment = require('moment');
const now = moment().format('YYYY-MM-DD');

const getTimes = (timeType) => {
    let start;
    let end;
    const now = new Date();

    switch (timeType) {
        case 'weekly':
            start = new Date(now.setDate(now.getDate() - now.getDay()));
            end = new Date(now.setDate(now.getDate() - now.getDay() + 6));
            break;
        case 'monthly':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case 'yearly':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
            break;
    }

    return { start, end };
};

const getDatas = async (date, type) => {
    const filter =
        type === 'yearly'
            ? {
                createdAt: {
                    $gte: new Date(date.setMonth(date.getMonth())),
                    $lt: new Date(date.setMonth(date.getMonth() + 1)),
                },
            }
            : {
                createdAt: {
                    $gte: new Date(date.setHours(0, 0, 0, 0)),
                    $lt: new Date(date.setHours(23, 59, 59, 999)),
                },
            };

    const orders = await OrderModel.find(filter);
    const purchases = await BillModel.find(filter);
    const constPrice = purchases.reduce((total, item) => {
        return total + item.products.reduce((sum, product) => {
            const costPrice = product.costPrice ?? Math.floor(product.price * 0.7);
            return sum + product.count * costPrice;
        }, 0);
    }, 0);
    return {
        orders: orders.reduce((a, b) => a + b.total, 0),
        purchase: purchases.reduce((a, b) => a + b.total, 0),
        cost: constPrice
    };
};

const getOrderAndPurchase = async (req, res) => {
    const { timeType } = req.query;

    try {
        const dates = getTimes(timeType);
        const nums =
            timeType === 'yearly'
                ? 12
                : dates.start && dates.end
                    ? dates.end.getDate() - dates.start.getDate() + 1
                    : 0;

        const days = [];
        for (let i = 0; i < nums; i++) {
            if (timeType === 'yearly') {
                dates.start = new Date(dates.start);
                dates.start.setMonth(i);

                const day = new Date(dates.start);
                days.push(day);
            } else {
                const day = new Date(dates.start);
                day.setDate(day.getDate() + i);
                days.push(day);
            }
        }

        const promises = days.map(async (day) => ({
            date: day,
            data: await getDatas(day, timeType),
        }));

        const results = await Promise.all(promises);

        res
            .status(200)
            .json({ message: 'Get order and purchase successfully', data: results });
    } catch (error) {
        console.log(error);
        res.status(404).send({ message: error.message });
    }
};
const getProductDetail = async (items) => {
    const promises = items.map(async (item) => {
        const product = await ProductModel.findById(item.productId);

        return {
            ...item,
            product,
        };
    });

    return await Promise.all(promises);
};

const getTopSellingAndLowQuantity = async (req, res) => {
    try {
        const bills = await BillModel.find();

        const sellings = bills.map((bill) => bill.products).flat();
        const subProductsSellings = [];

        if (sellings.length > 0) {
            sellings.forEach((product) => {
                const index = subProductsSellings.findIndex(
                    (subProduct) => subProduct._id === product._id
                );

                const total = product.price * product.count;

                if (index === -1) {
                    subProductsSellings.push({
                        _id: product._id,
                        count: product.count,
                        qty: product.qty,
                        productId: product.productId,
                        total: total ?? 0,
                    });
                } else {
                    subProductsSellings[index].count += product.count;
                    subProductsSellings[index].qty += product.qty;
                    subProductsSellings[index].total += total;
                }
            });
        }

        const topSelling = subProductsSellings
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const products = await ProductModel.find().select('_id images title');

        const promises = products.map(async (product) => {
            const subProduct = await SubProductModel.find({
                productId: product._id,
            }).select('qty');

            const qty = subProduct.reduce((a, b) => a + b.qty, 0);

            return {
                ...product._doc,
                qty,
            };
        });

        const productsWithQty = await Promise.all(promises);
        const lowQuantity = productsWithQty
            .sort((a, b) => a.qty - b.qty)
            .slice(0, 5);

        res.status(200).json({
            message: 'Get top selling and low quantity successfully',
            data: {
                topSelling: await getProductDetail(topSelling),
                lowQuantity,
            },
        });
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
};
const getBillsAndOrders = async (dates) => {
    const filter = dates
        ? {
            createdAt: {
                $gte: dates.start,
                $lt: dates.end,
            },
        }
        : {};

    try {
        const bills = await BillModel.find(filter);
        const orders = await OrderModel.find(filter);

        return { bills, orders };
    } catch (error) {
        console.log(error);
        return { bills: [], orders: [] };
    }
};

const getTotalProfit = async (req, res) => {
    const datas = await getBillsAndOrders();

    const { bills, orders } = datas;

    const revenue =
        orders.reduce((a, b) => a + b.total, 0) -
        bills.reduce((a, b) => a + b.total, 0);

    const startMonth = moment().startOf('month').toDate();
    const endMonth = moment().endOf('month').toDate();
    const startYear = moment().startOf('year').toDate();
    const endYear = moment().endOf('year').toDate();

    const datasOfMonth = await getBillsAndOrders({
        start: startMonth,
        end: endMonth,
    });
    const datasOfYear = await getBillsAndOrders({
        start: startYear,
        end: endYear,
    });
    const totalCost = (value) => {
        return value.reduce((total, item) => {
            return total + item.products.reduce((sum, product) => {
                const costPrice = product.costPrice;
                return sum + product.count * costPrice;
            }, 0);
        }, 0);
    };
    try {
        res.status(200).json({
            message: 'Get total profit successfully',
            data: {
                profitMonth:
                    datasOfMonth.bills.reduce((a, b) => a + b.total, 0) -
                    totalCost(datasOfMonth.bills),
                profitYear:
                    datasOfYear.bills.reduce((a, b) => a + b.total, 0) -
                    totalCost(datasOfYear.bills),
                bills,
                orders,
                revenue,
            },
        });
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
};
const getTopCategories = async (req, res) => {
    try {
        const bills = await BillModel.find();
        const sellings = bills.map((bill) => bill.products).flat();
        const subProductsSellings = [];

        if (sellings.length > 0) {
            sellings.forEach((product) => {
                const index = subProductsSellings.findIndex(
                    (subProduct) => subProduct._id.toString() === product._id.toString()
                );

                const total = product.price * product.count;

                if (index === -1) {
                    subProductsSellings.push({
                        _id: product._id,
                        count: product.count,
                        qty: product.qty,
                        productId: product.productId,
                        total: total ?? 0,
                    });
                } else {
                    subProductsSellings[index].count += product.count;
                    subProductsSellings[index].qty += product.qty;
                    subProductsSellings[index].total += total;
                }
            });
        }

        const products = [];

        subProductsSellings.forEach((subProduct) => {
            const index = products.findIndex(
                (product) => product._id.toString() === subProduct.productId.toString()
            );

            if (index !== -1) {
                products[index].count += subProduct.count;
                products[index].qty += subProduct.qty ? subProduct.qty : 0;
                products[index].total += subProduct.total;
            } else {
                products.push({
                    _id: subProduct.productId,
                    count: subProduct.count,
                    qty: subProduct.qty ?? 0,
                    total: subProduct.total,
                });
            }
        });

        const categories = await CategoryModel.find();

        const countOfCategories = await Promise.all(
            categories.map(async (category) => {
                const productsOfCategory = await ProductModel.find({
                    categories: { $all: [category._id] },
                }).select('_id');

                const vals =
                    productsOfCategory.length > 0
                        ? productsOfCategory.map((product) => {
                            const item = products.find(
                                (element) => element._id.toString() === product._id.toString()
                            );

                            return item
                                ? {
                                    count: item.count,
                                    total: item.total,
                                }
                                : {
                                    count: 0,
                                    total: 0,
                                };
                        })
                        : [];

                return {
                    ...category._doc,
                    count: vals.reduce((a, b) => a + b.count, 0),
                    total: vals.reduce((a, b) => a + b.total, 0),
                };
            })
        );

        const topCategories = countOfCategories.sort((a, b) => b.count - a.count).slice(0, 4);

        res.status(200).json({
            message: 'Get top categories successfully',
            data: topCategories,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
};
const getCustomer = async (req, res) => {
    try {
        // Lọc những user có role = 0
        const customers = await UserModel.find({ rule: 0 }, "id name");

        // Tạo danh sách tùy chọn cho khách hàng
        const customerOptions = customers.map((customer) => ({
            value: customer.id, // ID làm giá trị
            label: `${customer.name}`, // Hiển thị Họ + Tên
        }));

        res.status(200).json({
            message: 'Get customer list successfully',
            data: customerOptions
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const addInfo = async (req, res) => {
    try {
        const body = req.body;

        // Kiểm tra xem có bản ghi nào tồn tại chưa
        let info = await ContactModel.findOne();

        if (info) {
            // Nếu đã tồn tại, cập nhật thông tin mới
            info = await ContactModel.findOneAndUpdate({}, body, { new: true });
            res.status(200).json({
                message: 'Information updated successfully',
                data: info,
            });
        } else {
            // Nếu chưa có, tạo mới
            info = new ContactModel(body);
            await info.save();
            res.status(201).json({
                message: 'Information added successfully',
                data: info,
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getInfo = async (req, res) => {

    try {
        const info = await ContactModel.find()

        res.status(200).json({
            message: 'Get customer list successfully',
            data: info
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



/**
 * Hàm tổng hợp dữ liệu từ mảng hóa đơn:
 * Nhóm theo tên sản phẩm và tính:
 *  - totalCost: tổng chi phí (số lượng * costPrice hoặc 70% của giá bán nếu không có costPrice)
 *  - totalRevenue: tổng doanh thu (số lượng * giá bán)
 *  - profit: lợi nhuận = doanh thu - chi phí
 *  - totalRevenueSimilar: tổng doanh thu của các bill có cùng sản phẩm
 *
 * Lưu ý: Ưu tiên sử dụng product.title nếu có.
 */
const aggregateBillsReport = (bills) => {
    const report = {};
    bills.forEach(bill => {
        if (bill.products && Array.isArray(bill.products)) {
            bill.products.forEach(product => {
                const name = product.title || product.name || 'Unknown Product';
                const count = Number(product.count) || 0;
                const price = Number(product.price) || 0;
                const costPrice = product.costPrice ? Number(product.costPrice) : Math.floor(price * 0.7);
                const revenue = price * count;
                const cost = costPrice * count;
                if (!report[name]) {
                    report[name] = {
                        name,
                        totalCost: 0,
                        cost: 0,
                        price: 0,
                        totalRevenue: 0,
                        profit: 0,
                        count: 0,
                    };
                }
                report[name].totalCost += cost;
                report[name].totalRevenue += revenue;
                report[name].profit += (revenue - cost);
                report[name].count += count;
                report[name].price = price;
                report[name].cost = costPrice;
            });
        }
    });
    return Object.values(report);
};

/**
 * Xác định khoảng thời gian cho mốc báo cáo:
 * - daily, weekly, monthly, yearly
 */
const getTimesReport = (timeType) => {
    const now = new Date();
    let start, end;
    switch (timeType) {
        case 'dayly':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case 'weekly':
            // Giả sử tuần bắt đầu từ Chủ nhật
            start = new Date(now);
            start.setDate(now.getDate() - now.getDay());
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            break;
        case 'monthly':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'yearly':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
        default:
            throw new Error('Invalid timeType');
    }
    return { start, end };
};


const getDatasReport = async (start, end) => {
    // Chú ý: Nếu dữ liệu mẫu không có trường isDeleted thì có thể bỏ điều kiện này
    const bills = await BillModel.find({
        createdAt: { $gte: start, $lte: end }
    });
    return bills ? aggregateBillsReport(bills) : [];
};

/**
 * Controller xuất báo cáo theo mốc thời gian
 *
 * Cấu trúc payload JSON truyền vào:
 * {
 *    type: "all" | "timeline" | "timerange",
 *    filter: Nếu type là "timeline" thì là { start: "YYYY-MM-DD HH:mm:ss", end: "YYYY-MM-DD HH:mm:ss" }
 *            Nếu type là "timerange" thì là chuỗi: "daily", "weekly", "monthly", "yearly"
 * }
 *
 * - "all": Lấy tất cả bill và tổng hợp theo sản phẩm
 * - "timeline": Lấy bill trong khoảng thời gian filter.start - filter.end và tổng hợp báo cáo
 * - "timerange": Lấy bill theo mốc thời gian (dựa trên getTimesReport) và tổng hợp báo cáo
 */
const exportTimeReport = async (req, res) => {
    const { type, filter } = req.body;
    try {
        if (type === 'all') {
            // Lấy tất cả bill
            const bills = await BillModel.find({});
            const report = aggregateBillsReport(bills);
            return res.status(200).json({
                message: 'Export report successfully',
                data: { report },
            });
        } else if (type === 'timeline') {
            // Sử dụng khoảng thời gian truyền vào
            const start = new Date(filter.start);
            const end = new Date(filter.end);
            const report = await getDatasReport(start, end);
            return res.status(200).json({
                message: 'Export report successfully',
                data: {
                    dateRange: `${start.toISOString()} - ${end.toISOString()}`,
                    report,
                },
            });
        } else if (type === 'timerange') {
            // Sử dụng mốc thời gian: "daily", "weekly", "monthly", "yearly"
            const timeType = filter; // ví dụ: "weekly"
            const { start, end } = getTimesReport(timeType);
            const report = await getDatasReport(start, end);
            return res.status(200).json({
                message: 'Export report successfully',
                data: {
                    timeType,
                    dateRange: `${start.toISOString()} - ${end.toISOString()}`,
                    report,
                },
            });
        } else {
            return res.status(400).json({ message: 'Invalid export type' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};
module.exports = {
    getOrderAndPurchase,
    getTopSellingAndLowQuantity,
    getTotalProfit,
    getTopCategories,
    getCustomer,
    addInfo,
    getInfo, exportTimeReport
}