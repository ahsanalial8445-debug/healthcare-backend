
const express = require('express');

const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Appointment = require('./models/Appointment');
const sendAppointmentEmail = require('./utils/sendEmail');
const verifyAdmin = require('./middleware/auth'); // JWT auth middleware

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.error('MongoDB Error:', err));

// --- ROUTES ---

// 1. User: Book Appointment (Public POST)
app.post('/api/appointments', async (req, res) => {
  try {
    const { fullName, phone, email, doctor, preferredDate, message } = req.body;
    
    const newBooking = await Appointment.create({
      fullName,
      phone,
      email,
      doctor,
      preferredDate,
      message
    });

    res.status(201).json({ 
      success: true, 
      message: 'Booking successful!', 
      data: newBooking 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Admin Login (POST) - Real JWT Token Generation
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    // Generate JWT Token valid for 24 hours
    const token = jwt.sign(
      { email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({ success: true, token });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// 3. Admin: Get All Bookings (Protected GET)
app.get('/api/appointments', verifyAdmin, async (req, res) => {
  try {
    const bookings = await Appointment.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Admin: Update Status & Send Instant Email (Protected PATCH)
app.patch('/api/appointments/:id', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Status update in database (Fixed: { new: true } return option)
    const booking = await Appointment.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Send Instant Email Notification
    if (booking.email) {
      await sendAppointmentEmail(
        booking.email, 
        booking.fullName, 
        status, 
        booking.doctor, 
        booking.preferredDate
      );
    }

    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Admin: Delete Appointment (Protected DELETE)
app.delete('/api/appointments/:id', verifyAdmin, async (req, res) => {
  try {
    const deletedBooking = await Appointment.findByIdAndDelete(req.params.id);

    if (!deletedBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.status(200).json({ success: true, message: 'Appointment deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));