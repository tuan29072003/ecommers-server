const jwt = require('jsonwebtoken');
const verifyToken = (req, res, next) => {
    const headers = req.headers.authorization;
    const accesstoken = headers ? headers.split(' ')[1] : '';
    try {
        if (!accesstoken) {
            throw new Error('Không có quyền');
        }

        const verify = jwt.verify(
            accesstoken,
            process.env.SECRET_KEY
        );
        if (!verify) {
            throw new Error('Invalid token');
        }

        req.uid = verify._id;

        next();
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};
const checkRole = (req, res, next) => {
    const headers = req.headers.authorization;
    const accesstoken = headers ? headers.split(' ')[1] : '';
    try {
        if (!accesstoken) {
            throw new Error('Không có quyền');
        }

        const verify = jwt.verify(
            accesstoken,
            process.env.SECRET_KEY
        );
        if (!verify) {
            throw new Error('Invalid token');
        }
        if (verify.rule === 1) {
            throw new Error('Không đủ quyền!!');

        }
        req.uid = verify._id;

        next();
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

module.exports = { verifyToken, checkRole };
