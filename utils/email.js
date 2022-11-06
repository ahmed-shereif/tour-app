/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-console */
// npm install nodemailer

require('dotenv').config();
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  console.log('👧', '$$$$$$$$$$$$$$$$$$$$$$$');
  // 1) Create a transporter
  //   ~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //  transporter is a service that we are going to send email with it
  // we will use Emailtrap it is like gmail but just for sending fake email for develpoing
  //   const transporter = nodemailer.createTransport({
  //     host: process.env.EMAIL_HOST,
  //     port: 2525,
  //     secure: false,
  //     auth: {
  //       user: process.env.EMAIL_USERNAME,
  //       pass: process.env.EMAIL_PASSWORD,
  //     },
  //   });

  const transport = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 587,
    auth: {
      user: 'ea74bde83a1032',
      pass: 'c5edc1c6b4ad5a',
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false,
    },
  });

  //   2) define the email option
  const mailOptions = {
    from: 'ahmed1996sherif@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  //   3) Actually send Eamil
  transport.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.log('🤛');
      console.log(err);
    } else {
      console.log(info);
    }
  });
};

module.exports = sendEmail;
