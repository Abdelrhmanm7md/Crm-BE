import nodemailer from "nodemailer";
import { emailTemplate } from "./emailTemp.js";
import { sendNotification } from "../utils/sendNotification.js";
// import { userModel } from "../../database/models/user.model.js";

export async function sendEmail(email,text) {
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',  // Hostinger SMTP server
    port: 465,                   // Use 587 for TLS or 465 for SSL
    secure: true,               // Set true for port 465
    auth: {
        user: 'support@request-sa.com', // Your Hostinger email address
        pass: 'Request@2025',    // Your Hostinger email password
    },
});
  // const transporter = nodemailer.createTransport({
  //   service: "gmail",
  //   auth: {
  //     user: "abdelrahmanmohammed851@gmail.com",
  //     pass: "ykejlphmzcmmwlgw",
  //   },
  // });

  const info = await transporter.sendMail({
    from: `Admin " <support@request-sa.com>`, // sender address
    to: `${email}`, // list of receivers
    subject: "Email Verification", // Subject line
    text: `${text}`, // plain text body
  });

  console.log("Message sent: %s", info.messageId);
}
export async function sendInvite(recipient,projectName,roleName,id,link) {
  try {

  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',  // Hostinger SMTP server
    port: 465,                   // Use 587 for TLS or 465 for SSL
    secure: true,               // Set true for port 465
    auth: {
        user: 'support@request-sa.com', // Your Hostinger email address
        pass: 'Request@2025',    // Your Hostinger email password
    },
  });

  const info = await transporter.sendMail({
      from: `Admin " <support@request-sa.com>`,
      to: recipient.email, 
      subject: 'Invitation Email',
      text: `You have been invited to ${projectName} as ${roleName}.
        the link ${link}?id=${id}.`,
    });

  // await Promise.all(info);
    console.log('All emails sent successfully!');
  } catch (error) {
    console.error('Error sending emails:', error);
  }
}

export async function contactUs(name,email,message,id) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',  // Hostinger SMTP server
    port: 465,                   // Use 587 for TLS or 465 for SSL
    secure: true,               // Set true for port 465
    auth: {
        user: 'support@request-sa.com', // Your Hostinger email address
        pass: 'Request@2025',    // Your Hostinger email password
    },
  });

  const messageEmail = await transporter.sendMail({
    from: `Help Center" <support@request-sa.com>`,
    to: "support@request-sa.com", 
    subject: "contact us", 
    html: emailTemplate(name,email,message),
  });
  let message_en = ` Your Message has been successfully submitted to support, and we will contact you as soon as possible `
  let message_ar = 'لقد تم إرسال رسالتك بنجاح إلى الدعم، وسوف نقوم بالتواصل معك في أقرب وقت ممكن '
  sendNotification(message_en,message_ar,"support",id)
  console.log("Message sent: %s", messageEmail.messageId);

}
export async function contactUs2(name,email,phone,message,id) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',  // Hostinger SMTP server
    port: 465,                   // Use 587 for TLS or 465 for SSL
    secure: true,               // Set true for port 465
    auth: {
        user: 'support@request-sa.com', // Your Hostinger email address
        pass: 'Request@2025',    // Your Hostinger email password
    },
  });
  const messageEmail = await transporter.sendMail({
    from: `Help Center" <support@request-sa.com>`,
    to: "support@request-sa.com", 
    subject: "contact us", 
    html: emailTemplate(name,email,phone,message),
  });

  let message_en = ` Your Message has been successfully submitted to support, and we will contact you as soon as possible `
  let message_ar = 'لقد تم إرسال رسالتك بنجاح إلى الدعم، وسوف نقوم بالتواصل معك في أقرب وقت ممكن '
  sendNotification(message_en,message_ar,"support",id)
  console.log("Message sent: %s", messageEmail.messageId);

}