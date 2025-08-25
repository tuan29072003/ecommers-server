
const  nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 587,
	secure: false, // true for port 465, false for other ports
	auth: {
		user: process.env.USERNAME_EMAIL,
		pass: process.env.PASSWORD_EMAIL,
	},
});


 const handleSendMail = async (data) => {
	try {
		const res = await transporter.sendMail({
			...data,
			from: data.from || 'trankhacanhtuan29072003@gmail.com',
			text: 'text',
		});

		return res;
	} catch (error) {
		throw new Error(error.message);
	}
};
module.exports={handleSendMail}