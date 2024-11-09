const nodemailer = require('nodemailer');

exports.sendEmail = async (email, subject, body) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject,
    text: body,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return {
      message: 'Password reset OTP sudah dikirim ke email anda',
      statusCode: 200,
    };
  } catch (error) {
    console.error('Error saat mengirim email: ' + error);
    return { message: 'Error saat mengirim email', statusCode: 500 };
  }
};
