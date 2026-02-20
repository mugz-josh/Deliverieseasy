const nodemailer = require('nodemailer');

// Create transporter for sending emails using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'joshua.mugisha.upti@gmail.com',
      pass: process.env.EMAIL_PASS || 'kjhiydpbinboutln'
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send booking confirmation email
const sendBookingConfirmationEmail = async (email, customerName, service, bookingId) => {
  try {
    const transporter = createTransporter();
    
    const adminEmail = 'joshua.mugisha.upti@gmail.com';
    
    const mailOptions = {
      from: `"QuickDeliver" <${adminEmail}>`,
      to: [email, adminEmail], // Send to BOTH customer AND admin
      subject: 'Booking Confirmation – QuickDeliver',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px;">
            <h1 style="color: white; margin: 0; text-align: center;">✅ Booking Confirmed!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Dear <strong>${customerName}</strong>,</p>
            
            <p style="font-size: 16px; color: #333;">Thank you for booking with <strong>QuickDeliver</strong>!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #333;">Booking Details:</h3>
              <p style="margin: 10px 0;"><strong>Booking ID:</strong> #${bookingId}</p>
              <p style="margin: 10px 0;"><strong>Service:</strong> ${service}</p>
              <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #28a745;">Pending</span></p>
            </div>
            
            <p style="font-size: 14px; color: #666;">Our team will contact you shortly to confirm pickup and delivery details.</p>
            
            <p style="font-size: 14px; color: #666;">If you have any questions, please don't hesitate to contact us.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="font-size: 14px; color: #888; margin: 0;">Best regards,</p>
              <p style="font-size: 16px; color: #667eea; font-weight: bold; margin: 5px 0;">The QuickDeliver Team</p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to customer and admin!');
    console.log('📧 Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendBookingConfirmationEmail
};
