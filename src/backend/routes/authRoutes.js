const express = require('express')
const router = express.Router()
const { authenticate } = require('../middlewares/auth')
const {
  register,
  finalizeRole,
  login,
  logout,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  googleRedirect,
  googleCallback,
  googleLoginApi,
  resendVerification,
} = require('../controllers/authController')

// Public routes
router.post('/register', register)
router.post('/finalize-role', finalizeRole)
router.post('/login', login)
router.post('/logout', logout)
router.get('/verify-email/:token', verifyEmail)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/google', googleLoginApi)
router.post('/resend-verification', resendVerification)

// Google OAuth2 — backend redirect flow
router.get('/google', googleRedirect)
router.get('/google/callback', googleCallback)

// Protected routes
router.get('/me', authenticate, getMe)

module.exports = router
