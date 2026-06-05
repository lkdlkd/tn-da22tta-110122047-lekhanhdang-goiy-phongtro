const Room = require('../models/Room')
const User = require('../models/User')
const Notification = require('../models/Notification')
const sendResponse = require('../utils/apiResponse')
const { createNotification } = require('./notificationController')

// GET /api/admin/rooms
exports.adminGetRooms = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.min(Number(req.query.limit) || 20, 50)
    const query = {}
    if (req.query.status) query.status = req.query.status
    if (req.query.search) {
      const re = new RegExp(req.query.search, 'i')
      query.$or = [{ title: re }, { address: re }]
    }

    const [rooms, total] = await Promise.all([
      Room.find(query)
        .populate('landlord', 'name email phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Room.countDocuments(query),
    ])
    return sendResponse(res, 200, true, 'Danh sách phòng', {
      rooms,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}

// PUT /api/admin/rooms/:id/approve
exports.adminApproveRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true })
    if (!room) return sendResponse(res, 404, false, 'Không tìm thấy phòng')

    // Gửi thông báo cho chủ trọ
    await createNotification({
      userId: room.landlord,
      type: 'room_approved',
      title: 'Phòng đã được duyệt',
      body: `Phòng "${room.title}" của bạn đã được admin duyệt và hiển thị công khai.`,
      link: `/rooms/${room.slug}`,
      io: req.app.get('io'),
    })
    return sendResponse(res, 200, true, 'Đã duyệt phòng', { room })
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}

// PUT /api/admin/rooms/:id/reject
exports.adminRejectRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true })
    if (!room) return sendResponse(res, 404, false, 'Không tìm thấy phòng')

    await createNotification({
      userId: room.landlord,
      type: 'room_rejected',
      title: 'Phòng bị từ chối',
      body: `Phòng "${room.title}" của bạn đã bị admin từ chối. Lý do: ${req.body.reason || 'Vi phạm quy định.'}`,
      link: `/landlord/rooms/${room._id}/edit`,
      io: req.app.get('io'),
    })
    return sendResponse(res, 200, true, 'Đã từ chối phòng', { room })
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}

// PUT /api/admin/rooms/:id/hide — Ẩn phòng vi phạm (giữ data, không đổi isAvailable)
exports.adminHideRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { status: 'flagged' },   // chỉ ẩn, KHÔNG đổi isAvailable
      { new: true }
    )
    if (!room) return sendResponse(res, 404, false, 'Không tìm thấy phòng')

    await createNotification({
      userId: room.landlord,
      type: 'system',
      title: '⚠️ Phòng bị ẩn',
      body: `Phòng "${room.title}" đã bị ẩn khỏi danh sách tìm kiếm công khai. Lý do: ${req.body.reason || 'Vi phạm nội quy.'}`,
      link: '/landlord/rooms',
      io: req.app.get('io'),
    })
    return sendResponse(res, 200, true, 'Đã ẩn phòng', { room })
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}

// PUT /api/admin/rooms/:id/restore — Khôi phục phòng flagged về approved
exports.adminRestoreRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    )
    if (!room) return sendResponse(res, 404, false, 'Không tìm thấy phòng')

    await createNotification({
      userId: room.landlord,
      type: 'room_approved',
      title: '✅ Phòng đã được khôi phục',
      body: `Phòng "${room.title}" đã được admin duyệt lại và hiển thị công khai trở lại.`,
      link: `/rooms/${room.slug}`,
      io: req.app.get('io'),
    })
    return sendResponse(res, 200, true, 'Đã khôi phục phòng', { room })
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}

// DELETE /api/admin/rooms/:id — Xóa hẳn phòng
exports.adminDeleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) return sendResponse(res, 404, false, 'Không tìm thấy phòng')

    const landlordId = room.landlord
    const roomTitle = room.title
    await Room.findByIdAndDelete(req.params.id)

    await createNotification({
      userId: landlordId,
      type: 'system',
      title: '🗑️ Phòng bị xóa',
      body: `Phòng "${roomTitle}" đã bị admin xóa khỏi hệ thống. Lý do: ${req.body.reason || 'Vi phạm nghiêm trọng.'}`,
      link: '/landlord/rooms',
      io: req.app.get('io'),
    })
    return sendResponse(res, 200, true, 'Đã xóa phòng', {})
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}

// GET /api/admin/users
exports.adminGetUsers = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.min(Number(req.query.limit) || 20, 50)
    const query = {}
    if (req.query.role) query.role = req.query.role
    if (req.query.isBanned !== undefined && req.query.isBanned !== '') query.isBanned = req.query.isBanned === 'true'
    if (req.query.search) {
      const re = new RegExp(req.query.search, 'i')
      query.$or = [{ name: re }, { email: re }, { phone: re }]
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
    ])
    return sendResponse(res, 200, true, 'Danh sách người dùng', {
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}

// PUT /api/admin/users/:id/ban
exports.adminBanUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: true }, { new: true }).select('-password')
    if (!user) return sendResponse(res, 404, false, 'Không tìm thấy người dùng')
    return sendResponse(res, 200, true, 'Đã khoá tài khoản', { user })
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}

// PUT /api/admin/users/:id/unban
exports.adminUnbanUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: false }, { new: true }).select('-password')
    if (!user) return sendResponse(res, 404, false, 'Không tìm thấy người dùng')
    return sendResponse(res, 200, true, 'Đã mở khoá tài khoản', { user })
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}

// PUT /api/admin/users/:id
exports.adminUpdateUser = async (req, res) => {
  try {
    const { name, phone, role } = req.body

    const user = await User.findById(req.params.id)
    if (!user) return sendResponse(res, 404, false, 'Không tìm thấy người dùng')

    // Không cho phép thay đổi thông tin/vai trò của tài khoản Admin
    if (user.role === 'admin') {
      return sendResponse(res, 400, false, 'Không thể thay đổi thông tin hoặc vai trò của tài khoản Admin')
    }

    // Không cho phép nâng cấp tài khoản khác lên Admin
    if (role === 'admin') {
      return sendResponse(res, 400, false, 'Không thể cấp quyền Admin cho tài khoản khác')
    }

    user.name = name || user.name
    user.phone = phone !== undefined ? phone : user.phone
    user.role = role || user.role

    await user.save()

    const updatedUser = await User.findById(user._id).select('-password')
    return sendResponse(res, 200, true, 'Cập nhật thông tin người dùng thành công', { user: updatedUser })
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}

// PUT /api/admin/users/:id/reset-password
exports.adminResetPassword = async (req, res) => {
  try {
    const { password } = req.body
    if (!password || password.length < 6) {
      return sendResponse(res, 400, false, 'Mật khẩu mới phải có tối thiểu 6 ký tự')
    }

    const user = await User.findById(req.params.id)
    if (!user) return sendResponse(res, 404, false, 'Không tìm thấy người dùng')

    user.password = password
    await user.save()

    return sendResponse(res, 200, true, 'Đã cấp lại mật khẩu thành công')
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}

// DELETE /api/admin/users/:id
exports.adminDeleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return sendResponse(res, 404, false, 'Không tìm thấy người dùng')

    if (user.role === 'admin') {
      return sendResponse(res, 400, false, 'Không thể xóa tài khoản Admin')
    }

    await User.findByIdAndDelete(req.params.id)
    return sendResponse(res, 200, true, 'Đã xóa tài khoản người dùng thành công')
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}

// GET /api/admin/stats
exports.adminGetStats = async (req, res) => {
  try {
    const Comment = require('../models/Comment')
    const [totalRooms, pendingRooms, totalUsers, pendingComments, topRooms, monthlyData] = await Promise.all([
      Room.countDocuments(),
      Room.countDocuments({ status: 'pending' }),
      User.countDocuments(),
      Comment.countDocuments({ status: 'pending' }),
      Room.find({ status: 'approved' }).sort({ viewCount: -1 }).limit(5).select('title slug viewCount images price'),
      // 12 tháng gần nhất
      Room.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ])

    return sendResponse(res, 200, true, 'Thống kê hệ thống', {
      totalRooms, pendingRooms, totalUsers, pendingComments, topRooms, monthlyData,
    })
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}

// POST /api/admin/notifications
exports.adminSendNotification = async (req, res) => {
  try {
    const { title, body, target, userId, link } = req.body
    if (!title || !body || !target) {
      return sendResponse(res, 400, false, 'Vui lòng điền đầy đủ tiêu đề, nội dung và đối tượng nhận thông báo')
    }

    const io = req.app.get('io')

    if (target === 'specific') {
      if (!userId) {
        return sendResponse(res, 400, false, 'Vui lòng cung cấp ID người nhận')
      }
      const user = await User.findById(userId)
      if (!user) {
        return sendResponse(res, 404, false, 'Không tìm thấy người dùng này')
      }

      await createNotification({
        userId,
        type: 'system',
        title,
        body,
        link: link || null,
        io,
      })

      return sendResponse(res, 200, true, 'Đã gửi thông báo tới người dùng thành công')
    }

    // Target filters
    const query = {}
    if (target === 'student') query.role = 'student'
    else if (target === 'landlord') query.role = 'landlord'
    else if (target === 'all') query.role = { $in: ['student', 'landlord', 'admin'] }
    else {
      return sendResponse(res, 400, false, 'Đối tượng nhận thông báo không hợp lệ')
    }

    const users = await User.find(query).select('_id')
    if (users.length === 0) {
      return sendResponse(res, 200, true, 'Không có người dùng nào phù hợp với bộ lọc để gửi thông báo')
    }

    const notificationsData = users.map((u) => ({
      user: u._id,
      type: 'system',
      title,
      body,
      link: link || null,
      isRead: false,
    }))

    const createdNotifications = await Notification.insertMany(notificationsData)

    if (io) {
      createdNotifications.forEach((n) => {
        io.to(`user:${String(n.user)}`).emit('new_notification', n)
      })
    }

    return sendResponse(res, 200, true, `Đã gửi thông báo thành công tới ${users.length} người dùng`)
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}
