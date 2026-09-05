const nodemailer = require('nodemailer');

const sendAppointmentEmail = async (patientEmail, patientName, status, doctorName, date) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const isConfirmed = status === 'Confirmed';
    const subject = isConfirmed ? 'Appointment Confirmed - MediCare' : 'Appointment Update - MediCare';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: ${isConfirmed ? '#0284c7' : '#e11d48'};">
          ${isConfirmed ? 'Appointment Confirmed!' : 'Appointment Cancelled'}
        </h2>
        <p>Dear <b>${patientName}</b>,</p>
        <p>${isConfirmed ? 'Aap ki appointment successfully confirm ho gayi hai.' : 'Afsos, aap ki appointment cancelled kar di gayi hai.'}</p>
        <ul>
          <li><b>Doctor:</b> ${doctorName}</li>
          <li><b>Date:</b> ${date}</li>
          <li><b>Status:</b> ${status}</li>
        </ul>
        <p>Regards,<br/>MediCare Hospital Team</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"MediCare Hospital" <${process.env.EMAIL_USER}>`,
      to: patientEmail,
      subject,
      html: htmlContent
    });

    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ Email Sending Error:', error.message);
  }
};

module.exports = sendAppointmentEmail;