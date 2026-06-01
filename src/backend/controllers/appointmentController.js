const Appointment = require('../models/Appointment')
const Message = require('../models/Message')
const Conversation = require('../models/Conversation')
const Room = require('../models/Room')
const mongoose = require('mongoose')
const sendResponse = require('../utils/apiResponse')
const { createNotification } = require('./notificationController')

const TIME_SLOT_LABELS = {
  morning: 'Sáng (8h–12h)',
  afternoon: 'Chiều (13h–17h)',
  evening: 'Tối (18h–20h)',
}

// POST /api/appointments — Sinh viên đặt lịch
// POST /api/appointments — Sinh viên hoặc Chủ trọ/Admin đặt đề xuất lịch hẹn
exports.createAppointment = async (req, res) => {
  try {
    const { roomId, date, timeSlot, note, conversationId } = req.body
    if (!roomId || !date || !timeSlot) return sendResponse(res, 400, false, 'Thiếu thông tin đặt lịch')

    const appointDate = new Date(date)
    const tomorrow = new Date(); tomorrow.setHours(0, 0, 0, 0); tomorrow.setDate(tomorrow.getDate() + 1)
    if (appointDate < tomorrow) return sendResponse(res, 400, false, 'Ngày hẹn phải từ ngày mai trở đi')

    const room = await Room.findById(roomId).populate('landlord', '_id name')
    if (!room) return sendResponse(res, 404, false, 'Không tìm thấy phòng')

    let studentId;
    let landlordId = room.landlord._id;

    if (req.user.role === 'student') {
      studentId = req.user._id;
    } else {
      // Đang là landlord hoặc admin tạo lịch hẹn. Cần có conversationId để tìm ra đối tác chat (studentId)
      if (!conversationId || !mongoose.isValidObjectId(conversationId)) {
        return sendResponse(res, 400, false, 'Yêu cầu cuộc hội thoại hợp lệ để đề xuất lịch hẹn')
      }
      const conv = await Conversation.findById(conversationId)
      if (!conv) return sendResponse(res, 404, false, 'Không tìm thấy cuộc hội thoại')
      
      // Tìm người tham gia khác (không phải req.user._id)
      studentId = conv.participants.find(p => String(p) !== String(req.user._id))
      if (!studentId) return sendResponse(res, 400, false, 'Không xác định được sinh viên trong cuộc hội thoại')
    }

    const appointment = await Appointment.create({
      room: roomId,
      student: studentId,
      landlord: landlordId,
      date: appointDate,
      timeSlot,
      note: note?.trim() || '',
      createdBy: req.user._id,
    })

    // ── Tạo message card 'appointment' trong chat nếu có conversationId ──
    const io = req.app.get('io')
    if (conversationId && mongoose.isValidObjectId(conversationId)) {
      const conv = await Conversation.findById(conversationId)
      if (conv && conv.participants.map(String).includes(String(req.user._id))) {
        const msg = await Message.create({
          conversation: conversationId,
          sender: req.user._id,
          content: '',
          messageType: 'appointment',
          appointmentRef: appointment._id,
        })
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: msg._id,
          lastMessageAt: new Date(),
        })
        const populated = await Message.findById(msg._id)
          .populate('sender', 'name avatar')
          .populate({
            path: 'appointmentRef',
            populate: { path: 'room', select: 'title slug images' },
          })
        io.to(`conv:${conversationId}`).emit('receive_message', populated)
      }
    }

    // Gửi thông báo đến bên còn lại
    const isStudent = String(studentId) === String(req.user._id)
    const targetUserId = isStudent ? landlordId : studentId
    const targetTitle = isStudent ? 'Có lịch hẹn xem phòng mới' : 'Có đề xuất lịch hẹn mới'
    const targetBody = isStudent
      ? `${req.user.name} muốn xem phòng "${room.title}" vào ${TIME_SLOT_LABELS[timeSlot]} ngày ${appointDate.toLocaleDateString('vi-VN')}`
      : `Chủ trọ ${req.user.name} đã đề xuất lịch xem phòng "${room.title}" vào ${TIME_SLOT_LABELS[timeSlot]} ngày ${appointDate.toLocaleDateString('vi-VN')}`
    const targetLink = isStudent ? '/landlord/appointments' : '/appointments'

    await createNotification({
      userId: targetUserId,
      type: 'system',
      title: targetTitle,
      body: targetBody,
      link: targetLink,
      io,
    })

    return sendResponse(res, 201, true, 'Tạo đề xuất lịch hẹn thành công', { appointment })
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}

// GET /api/appointments
exports.getAppointments = async (req, res) => {
  try {
    const query = {}
    if (req.user.role === 'student') query.student = req.user._id
    else if (req.user.role === 'landlord') query.landlord = req.user._id

    if (req.query.status) query.status = req.query.status

    const appointments = await Appointment.find(query)
      .populate('room', 'title slug images address')
      .populate('student', 'name email phone')
      .populate('landlord', 'name email phone')
      .sort({ date: -1 })

    return sendResponse(res, 200, true, 'Danh sách lịch hẹn', { appointments })
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}

// PUT /api/appointments/:id/confirm — Chủ trọ xác nhận
// PUT /api/appointments/:id/confirm — Xác nhận lịch hẹn (Xác nhận chéo dựa trên người tạo)
exports.confirmAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id).populate('room', 'title')
    if (!appt) return sendResponse(res, 404, false, 'Không tìm thấy lịch hẹn')

    // Xác định ai là người tạo
    const createdByStr = appt.createdBy ? String(appt.createdBy) : String(appt.student)
    const isCreatedByStudent = createdByStr === String(appt.student)

    // Nếu sinh viên tạo -> Chủ trọ phải là người xác nhận
    // Nếu chủ trọ tạo -> Sinh viên phải là người xác nhận
    if (isCreatedByStudent) {
      if (String(appt.landlord) !== String(req.user._id)) {
        return sendResponse(res, 403, false, 'Không có quyền xác nhận lịch hẹn này (Chỉ chủ trọ mới có quyền xác nhận)')
      }
    } else {
      if (String(appt.student) !== String(req.user._id)) {
        return sendResponse(res, 403, false, 'Không có quyền xác nhận lịch hẹn này (Chỉ sinh viên mới có quyền xác nhận)')
      }
    }

    appt.status = 'confirmed'
    await appt.save()

    const io = req.app.get('io')

    // Notify người tạo (hoặc bên kia)
    const notifyUserId = isCreatedByStudent ? appt.student : appt.landlord
    const notifyTitle = 'Lịch hẹn đã được xác nhận'
    const notifyBody = isCreatedByStudent
      ? `Chủ trọ đã xác nhận lịch hẹn xem phòng "${appt.room.title}" của bạn.`
      : `Người thuê đã đồng ý và xác nhận lịch hẹn xem phòng "${appt.room.title}" của bạn.`
    const notifyLink = isCreatedByStudent ? '/appointments' : '/landlord/appointments'

    await createNotification({
      userId: notifyUserId,
      type: 'system',
      title: notifyTitle,
      body: notifyBody,
      link: notifyLink,
      io,
    })

    // Emit realtime cập nhật card cho cả 2 bên
    io.to(`user:${String(appt.student)}`).emit('appointment_updated', { appointmentId: String(appt._id), status: 'confirmed' })
    io.to(`user:${String(appt.landlord)}`).emit('appointment_updated', { appointmentId: String(appt._id), status: 'confirmed' })

    return sendResponse(res, 200, true, 'Đã xác nhận lịch hẹn thành công', { appointment: appt })
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}

// PUT /api/appointments/:id/cancel
exports.cancelAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id).populate('room', 'title')
    if (!appt) return sendResponse(res, 404, false, 'Không tìm thấy lịch hẹn')

    const isStudent = String(appt.student) === String(req.user._id)
    const isLandlord = String(appt.landlord) === String(req.user._id)
    if (!isStudent && !isLandlord) return sendResponse(res, 403, false, 'Không có quyền')
    if (['cancelled', 'completed'].includes(appt.status)) return sendResponse(res, 400, false, 'Không thể huỷ lịch này')

    appt.status = 'cancelled'
    appt.cancelReason = req.body.cancelReason?.trim() || ''
    await appt.save()

    const io = req.app.get('io')

    // Notify bên còn lại
    const notifyUserId = isStudent ? appt.landlord : appt.student
    await createNotification({
      userId: notifyUserId,
      type: 'system',
      title: 'Lịch hẹn đã bị huỷ',
      body: `Lịch hẹn xem phòng "${appt.room.title}" đã bị huỷ${appt.cancelReason ? `: ${appt.cancelReason}` : '.'}`,
      link: isStudent ? '/landlord/appointments' : '/appointments',
      io,
    })

    // Emit realtime cập nhật card
    io.to(`user:${String(appt.student)}`).emit('appointment_updated', { appointmentId: String(appt._id), status: 'cancelled' })
    io.to(`user:${String(appt.landlord)}`).emit('appointment_updated', { appointmentId: String(appt._id), status: 'cancelled' })

    return sendResponse(res, 200, true, 'Đã huỷ lịch hẹn', { appointment: appt })
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}

// PUT /api/appointments/:id/complete — Chủ trọ đánh dấu hoàn thành
// PUT /api/appointments/:id/complete — Đánh dấu hoàn thành (chủ trọ hoặc sinh viên)
exports.completeAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id)
    if (!appt) return sendResponse(res, 404, false, 'Không tìm thấy lịch hẹn')
    
    // Cả 2 bên đều có thể bấm hoàn thành lịch hẹn xem phòng
    if (String(appt.landlord) !== String(req.user._id) && String(appt.student) !== String(req.user._id)) {
      return sendResponse(res, 403, false, 'Không có quyền')
    }

    appt.status = 'completed'
    await appt.save()

    const io = req.app.get('io')
    io.to(`user:${String(appt.student)}`).emit('appointment_updated', { appointmentId: String(appt._id), status: 'completed' })
    io.to(`user:${String(appt.landlord)}`).emit('appointment_updated', { appointmentId: String(appt._id), status: 'completed' })

    return sendResponse(res, 200, true, 'Đã hoàn thành lịch hẹn', { appointment: appt })
  } catch (error) {
    return sendResponse(res, 500, false, error.message)
  }
}
