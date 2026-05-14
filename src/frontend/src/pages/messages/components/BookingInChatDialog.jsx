import { useState } from 'react'
import dayjs from 'dayjs'
import { Calendar, CalendarPlus, Clock, Home } from 'lucide-react'
import { toast } from 'sonner'
import { createAppointmentApi } from '@/services/appointmentService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const SLOTS = [
  { value: 'morning', label: 'Sáng', sub: '8h - 12h' },
  { value: 'afternoon', label: 'Chiều', sub: '13h - 17h' },
  { value: 'evening', label: 'Tối', sub: '18h - 20h' },
]

export function BookingInChatDialog({ open, onClose, conv, conversationId, onBooked }) {
  const room = conv?.room
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('morning')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const minDate = dayjs().add(1, 'day').format('YYYY-MM-DD')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!room?._id || !date) return
    try {
      setSaving(true)
      const res = await createAppointmentApi({ roomId: room._id, date, timeSlot: slot, note: note.trim(), conversationId })
      toast.success('Đã gửi lịch hẹn')
      onBooked?.(res.data?.data?.appointment)
      onClose()
      setDate('')
      setNote('')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đặt lịch thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4 text-primary" />
            Đặt lịch xem phòng
          </DialogTitle>
        </DialogHeader>

        {room ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              {room.images?.[0] ? (
                <img src={room.images[0]} alt={room.title} className="h-14 w-16 shrink-0 rounded-lg border object-cover" />
              ) : (
                <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                  <Home className="h-5 w-5" />
                </div>
              )}
              <p className="line-clamp-2 text-sm font-semibold">{room.title}</p>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Ngày xem
              </label>
              <input
                type="date"
                min={minDate}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Khung giờ
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SLOTS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSlot(item.value)}
                    className={cn(
                      'rounded-lg border py-2.5 text-center text-xs font-medium transition-colors',
                      slot === item.value ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/40 hover:bg-muted/50'
                    )}
                  >
                    <p>{item.label}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{item.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Lời nhắn tùy chọn</label>
              <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="VD: Mình đến khoảng 9h sáng..." maxLength={200} />
            </div>

            <DialogFooter className="gap-2 pt-1">
              <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
              <Button type="submit" disabled={!date || saving}>{saving ? 'Đang gửi...' : 'Gửi lịch hẹn'}</Button>
            </DialogFooter>
          </form>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">Hội thoại này không gắn với phòng trọ nào.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
