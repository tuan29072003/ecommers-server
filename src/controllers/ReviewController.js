/** @format */

const ReviewModel = require("../models/ReviewModel");


const addnew = async (req, res) => {
	const body = req.body;

	try {
		const item = new ReviewModel(body);
		await item.save();
		res.status(200).json({
			data: item,
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
// const getAll = async (req, res) => {
// 	const { id, limit } = req.query;
// 	try {
// 		const items = await ReviewModel.find({ parentId: id }).limit(limit ?? 5);
// 		console.log(id)

// 		res.status(200).json({
// 			data: items,
// 		});
// 	} catch (error) {
// 		res.status(404).json({
// 			message: error.message,
// 		});
// 	}
// };
const getAll = async (req, res) => {
    const { id, limit } = req.query;

    try {
        // Lấy 5 review có parentId bằng với id từ query
        const parentReviews = await ReviewModel.find({ parentId: id }).limit(Number(limit) || 5);

        // Lấy danh sách các _id của 5 review ban đầu
        const parentIds = parentReviews.map(review => review._id.toString());

        // Kiểm tra xem có review con nào không
        const childReviewCounts = await ReviewModel.aggregate([
            { $match: { parentId: { $in: parentIds } } },
            { $group: { _id: "$parentId", count: { $sum: 1 } } }
        ]);

        // Chuyển đổi dữ liệu về dạng object để kiểm tra nhanh hơn
        const childReviewMap = {};
        childReviewCounts.forEach(item => {
            childReviewMap[item._id] = item.count > 0;
        });

        // Gán key `children: true` nếu có review con
        const data = parentReviews.map(review => {
            const reviewObj = review.toObject();
            if (childReviewMap[reviewObj._id.toString()]) {
                reviewObj.children = true;
            }
            return reviewObj;
        });

        res.status(200).json({
            data: data,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};


const getData = async (req, res) => {
	const { id } = req.query;
	try {
		const items = await ReviewModel.find({ parentId: id });

		res.status(200).json({
			data: {
				count: items.reduce((a, b) => a + b.star, 0) / items.length,
				total: items.length,
			},
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};

const update = async (req, res) => {
	const { id } = req.query;
	const body = req.body;
	console.log(body)

	try {
		await ReviewModel.findByIdAndUpdate(id, body);


		res.status(200).json({
			message: 'Updated',
		});
	} catch (error) {
		res.status(404).json({
			message: error.message,
		});
	}
};
const remove = async (req, res) => {
	const { id } = req.query;

	try {
		// Xóa review có id từ query
		await ReviewModel.findByIdAndDelete(id);

		// Xóa tất cả review có parentId là id
		await ReviewModel.deleteMany({ parentId: id });

		res.status(200).json({
			message: 'Deleted successfully',
		});
	} catch (error) {
		res.status(500).json({
			message: error.message,
		});
	}
};
module.exports = { addnew, getAll, update, getData, remove };