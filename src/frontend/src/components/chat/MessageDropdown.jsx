import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useSelector } from 'react-redux'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import { getConversationsApi, markConversationReadApi } from '@/services/chatService'
import { Button } from '@/components/ui/button'
import { getSocket } from '@/hooks/useSocket'
import { cn } from '@/lib/utils'

dayjs.extend(relativeTime)
dayjs.locale('vi')

export function MessageDropdown() {
  const user = useSelector((state) => state.auth?.user)
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef(null)

  const socket = getSocket()

  // Load conversations on open or mount
  const fetchConversations = () => {
    if (!user) return
    getConversationsApi()
      .then((res) => {
        const convs = res.data?.data?.conversations || []
        setConversations(convs)
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (open) {
      fetchConversations()
    }
  }, [open, user])

  // Sync unreadCount state from socket unread_count event
  useEffect(() => {
    if (!user) return
    const onUnread = ({ count }) => setUnreadCount(count)
    socket.on('unread_count', onUnread)

    // Initial load of unread count
    fetchConversations()

    return () => {
      socket.off('unread_count', onUnread)
    }
  }, [user, socket])

  // Real-time messages update unread status / last message in dropdown
  useEffect(() => {
    const onMsg = (msg) => {
      const convId = msg.conversation?._id || msg.conversation
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === convId)
        if (exists) {
          return prev.map((c) =>
            c._id === convId
              ? { ...c, lastMessage: msg, lastMessageAt: msg.createdAt, unreadCount: (c.unreadCount || 0) + 1 }
              : c
          ).sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt))
        } else {
          // If it's a new conversation, fetch the list again
          fetchConversations()
          return prev
        }
      })
    }
    socket.on('receive_message', onMsg)
    return () => socket.off('receive_message', onMsg)
  }, [socket])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 rounded-lg"
        aria-label="Tin nhắn"
      >
        <MessageCircle className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="fixed inset-x-4 top-16 z-50 mt-2 rounded-xl border bg-popover shadow-xl md:absolute md:right-0 md:left-auto md:top-full md:w-80 md:inset-x-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <span className="text-sm font-semibold">Tin nhắn gần đây</span>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-destructive/10 text-destructive font-bold px-2 py-0.5 rounded-full">
                {unreadCount} chưa đọc
              </span>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
                <MessageCircle className="h-6 w-6 opacity-30" />
                Chưa có cuộc trò chuyện nào
              </div>
            ) : (
              conversations.map((conv) => {
                const otherParticipant = conv.participants?.find((p) => String(p._id) !== String(user?._id))
                if (!otherParticipant) return null

                const name = otherParticipant.name || 'Người dùng'
                const avatar = otherParticipant.avatar
                const isUnread = conv.unreadCount > 0

                return (
                  <Link
                    key={conv._id}
                    to={`/messages?to=${otherParticipant._id}`}
                    onClick={() => {
                      setOpen(false)
                      if (isUnread) {
                        markConversationReadApi(conv._id).catch(() => {})
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50',
                      isUnread && 'bg-primary/5'
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {avatar ? (
                        <img src={avatar} className="h-9 w-9 rounded-full object-cover" alt="" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {name[0].toUpperCase()}
                        </span>
                      )}
                      {isUnread && (
                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-destructive" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={cn('text-xs font-semibold truncate', isUnread ? 'text-foreground' : 'text-muted-foreground')}>
                          {name}
                        </p>
                        <span className="text-[9px] text-muted-foreground/60 shrink-0">
                          {dayjs(conv.lastMessageAt || conv.updatedAt).fromNow()}
                        </span>
                      </div>
                      <p className={cn('text-xs truncate mt-0.5', isUnread ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                        {conv.lastMessage?.content || (conv.lastMessage?.attachments?.length ? '[Tệp đính kèm]' : 'Bắt đầu trò chuyện')}
                      </p>
                      {conv.room && (
                        <span className="inline-block text-[9px] text-primary bg-primary/5 px-1.5 py-0.5 rounded-md mt-1 truncate max-w-full">
                          Phòng: {conv.room.title}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2 text-center bg-muted/10 rounded-b-xl">
            <Link to="/messages" onClick={() => setOpen(false)} className="text-xs text-primary hover:underline font-medium">
              Xem tất cả tin nhắn
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
