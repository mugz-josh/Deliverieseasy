// Test email script - run locally to test Gmail SMTP
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🧪 Testing Email...');
  
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'joshua.mugisha.upti@gmail.com',
      pass: 'kjhiydpbinboutln'
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // Verify connection
    console.log('🔗 Connecting to Gmail...');
    await transporter.verify();
    console.log('✅ Connection successful!');
    
    // Send test email
    const info = await transporter.sendMail({
      from: '"QuickDeliver" <joshua.mugisha.upti@gmail.com>',
      to: 'joshua.mugisha.upti@gmail.com',
      subject: 'TEST - QuickDeliver Email',
      html: `
        <h1>✅ Test Email Working!</h1>
        <p>This is a test to confirm Gmail SMTP is working.</p>
        <p>If you see this, the email system is configured correctly!</p>
      `
    });
    
    console.log('✅ Email sent!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Check your Gmail inbox!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testEmail();
