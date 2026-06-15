const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const { db } = require('../database')

// Temporary storage (mas maganda kung sa database mo i-save)
const resetTokens = new Map()

// ========== FORGOT PASSWORD - SEND RESET LINK ==========
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }
  
  try {
    // Hanapin ang user sa database
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' })
    }
    
    const user = result.rows[0]
    
    // Gumawa ng reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 3600000) // 1 hour
    
    // I-save ang token sa database
    await db.query(
      'UPDATE users SET reset_token = $1, reset_expires = $2 WHERE email = $3',
      [resetToken, resetExpires, email]
    )
    
    // I-configure ang email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,  // Ilagay sa .env
        pass: process.env.EMAIL_PASS   // Ilagay sa .env (app password)
      }
    })
    
    // Reset link (palitan ang URL ng iyong frontend)
    const resetLink = `https://your-frontend-url.com/reset-password?token=${resetToken}`
    
    // Send email
    await transporter.sendMail({
      from: `"INR Packaging" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #dc3545;">INR Packaging System</h2>
          <h3>Reset Your Password</h3>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Reset Password
          </a>
          <p>Or copy this link:</p>
          <p style="background: #f4f4f4; padding: 10px; border-radius: 5px;">${resetLink}</p>
          <p style="color: #999; font-size: 12px;">This link expires in 1 hour.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
          <hr>
          <p style="color: #999; font-size: 11px;">INR Packaging Corp</p>
        </div>
      `
    })
    
    res.json({ message: 'Reset link sent to your email!' })
    
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// ========== RESET PASSWORD - VERIFY TOKEN ==========
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' })
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }
  
  try {
    // Hanapin ang user gamit ang token
    const result = await db.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_expires > NOW()',
      [token]
    )
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' })
    }
    
    const user = result.rows[0]
    
    // I-hash ang bagong password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // I-update ang password at i-clear ang token
    await db.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    )
    
    res.json({ message: 'Password reset successful! You can now login.' })
    
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

module.exports = router