import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import { MessageCircle } from 'lucide-react'

import {
  getConversationsApi,
  createConversationApi,
  getMessagesApi,
  uploadChatMediaApi,
  markConversationReadApi,
} from '@/services/chatService'
import { getSocket } from '@/hooks/useSocket'

import { ConversationList } from './components/ConversationList'
import { ChatHeader } from './components/ChatHeader'
import { MessageBubble, TypingBubble } from './components/MessageBubble'
import { ChatInput } from './components/ChatInput'
import { BookingInChatDialog } from './components/BookingInChatDialog'
import { cn } from '@/lib/utils'

dayjs.extend(relativeTime)
dayjs.locale('vi')

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const user = useSelector((s) => s.auth?.user)
  const [searchParams] = useSearchParams()

  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [msgPage, setMsgPage] = useState(1)
  const [mediaFiles, setMediaFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)

  // Pending lazy conv creation
  const [pendingTo, setPendingTo] = useState(null)
  const [pendingRoom, setPendingRoom] = useState(null)

  const [onlineUsers, setOnlineUsers] = useState({})
  const [typingUsers, setTypingUsers] = useState({})
  const [hasUnreadNew, setHasUnreadNew] = useState(false) // badge khi cuộn lên xa

  const bottomRef = useRef(null)
  const msgContainerRef = useRef(null)
  const isLoadingMoreRef = useRef(false)
  const isNearBottomRef = useRef(true)   // user đang ở gần đáy hay không
  const hasMoreRef = useRef(false)
  const loadingMoreRef = useRef(false)
  const msgPageRef = useRef(1)
  const activeConvIdRef = useRef(null)
  const typingTimerRef = useRef(null)
  const isTypingRef = useRef(false)

  const socket = getSocket()

  // ── Mark conversation as read ────────────────────────────────────────────
  const markRead = useCallback((convId) => {
    if (!convId || convId === '__pending__') return
    // Optimistic: zero out locally
    setConversations((prev) =>
      prev.map((c) => c._id === convId ? { ...c, unreadCount: 0 } : c)
    )
    // Tell server
    markConversationReadApi?.(convId).catch(() => { })
  }, [])

  // ── Select conversation ──────────────────────────────────────────────────
  const selectConv = useCallback((convId) => {
    setActiveConvId(convId)
    markRead(convId)
  }, [markRead])

  // ── Load conversations ───────────────────────────────────────────────────
  useEffect(() => {
    if (!socket.connected) socket.connect()
    if (user?._id) socket.emit('join_user', user._id)

    getConversationsApi()
      .then((res) => {
        const convs = res.data?.data?.conversations || []
        setConversations(convs)

        const uniqueIds = [...new Set(
          convs
            .flatMap((c) => c.participants || [])
            .filter((p) => String(p._id) !== String(user?._id))
            .map((p) => String(p._id))
        )]
        if (uniqueIds.length) {
          socket.emit('check_online', { userIds: uniqueIds }, (r) => { if (r) setOnlineUsers(r) })
        }
      })
      .catch(() => { })
      .finally(() => setLoadingConvs(false))

    // Auto-open via ?to=
    const toUser = searchParams.get('to')
    const roomId = searchParams.get('room')
    if (toUser) {
      getConversationsApi().then((res) => {
        const convs = res.data?.data?.conversations || []
        const existing = convs.find((c) =>
          c.participants?.some((p) => String(p._id) === String(toUser))
        )
        if (existing) {
          setConversations((prev) =>
            prev.find((c) => c._id === existing._id) ? prev : [existing, ...prev]
          )
          selectConv(existing._id)
        } else {
          setPendingTo(toUser)
          setPendingRoom(roomId)
          setActiveConvId('__pending__')
        }
      }).catch(() => { })
    }
  }, [user?._id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load messages (dùng cho cả lần đầu và load more) ───────────────────────
  const loadMessages = useCallback(async (convId, page, prepend = false) => {
    if (page === 1) setLoadingMsgs(true)
    else setLoadingMore(true)

    isLoadingMoreRef.current = prepend // chẹn auto-scroll khi prepend
    try {
      const res = await getMessagesApi(convId, page, 10)
      const newMsgs = res.data?.data?.messages || []
      const more = res.data?.data?.hasMore ?? false
      setHasMore(more)

      if (prepend) {
        const container = msgContainerRef.current
        const prevScrollHeight = container?.scrollHeight || 0
        setMessages((prev) => [...newMsgs, ...prev])
        // Khôi phục scroll position sau khi prepend
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight
          }
          isLoadingMoreRef.current = false
        })
      } else {
        setMessages(newMsgs)
        // Scroll xuống dưới sau khi load lần đầu
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'instant' })
          isLoadingMoreRef.current = false
        })
      }
    } catch {
      isLoadingMoreRef.current = false
    } finally {
      if (page === 1) setLoadingMsgs(false)
      else setLoadingMore(false)
    }
  }, [])

  // ── Load messages when conv changes ─────────────────────────────────────
  useEffect(() => {
    if (!activeConvId || activeConvId === '__pending__') {
      setMessages([])
      setMsgPage(1)
      setHasMore(false)
      return
    }
    setMsgPage(1)
    setHasMore(false)
    socket.emit('join_conversation', activeConvId)
    loadMessages(activeConvId, 1, false)
  }, [activeConvId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll listener: theo dõi vị trí có gần đáy không ─────────────────────
  useEffect(() => {
    const container = msgContainerRef.current
    if (!container || !activeConvId) return
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const nearBottom = scrollHeight - scrollTop - clientHeight < 80
      isNearBottomRef.current = nearBottom
      if (nearBottom) setHasUnreadNew(false) // xóa badge khi cuộn xuống
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [activeConvId])

  // ── Load more thủ công khi bấm nút ─────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    if (loadingMoreRef.current || isLoadingMoreRef.current || !hasMoreRef.current) return
    const nextPage = msgPageRef.current + 1
    msgPageRef.current = nextPage
    setMsgPage(nextPage)
    loadMessages(activeConvIdRef.current, nextPage, true)
  }, [loadMessages])

  // Sync refs với state
  useEffect(() => { hasMoreRef.current = hasMore }, [hasMore])
  useEffect(() => { loadingMoreRef.current = loadingMore }, [loadingMore])
  useEffect(() => { msgPageRef.current = msgPage }, [msgPage])
  useEffect(() => { activeConvIdRef.current = activeConvId }, [activeConvId])

  // ── Socket listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    const onMsg = (msg) => {
      const convId = msg.conversation?._id || msg.conversation

      if (convId === activeConvId) {
        // Conversation is open — append immediately
        setMessages((prev) => [...prev, msg])
        setConversations((prev) =>
          prev.map((c) =>
            c._id === convId
              ? { ...c, lastMessage: msg, lastMessageAt: msg.createdAt, unreadCount: 0 }
              : c
          )
        )
        // mark read on server since we're viewing it
        markRead(convId)
      } else {
        // Conversation not open — increment unread
        setConversations((prev) => {
          const exists = prev.find((c) => c._id === convId)
          if (exists) {
            return prev.map((c) =>
              c._id === convId
                ? { ...c, lastMessage: msg, lastMessageAt: msg.createdAt, unreadCount: (c.unreadCount || 0) + 1 }
                : c
            )
          }
          // New conversation arrived — prepend it
          return [{ _id: convId, lastMessage: msg, lastMessageAt: msg.createdAt, unreadCount: 1, participants: [msg.sender].filter(Boolean) }, ...prev]
        })
      }

      // Clear typing for this sender
      if (msg.sender?._id) {
        setTypingUsers((prev) => {
          const s = new Set(prev[convId] || [])
          s.delete(String(msg.sender._id))
          return { ...prev, [convId]: s }
        })
      }
    }

    const onOnline = ({ userId }) => setOnlineUsers((p) => ({ ...p, [userId]: true }))
    const onOffline = ({ userId }) => setOnlineUsers((p) => ({ ...p, [userId]: false }))

    const onTypingStart = ({ conversationId, userId }) => {
      if (String(userId) === String(user?._id)) return
      setTypingUsers((p) => {
        const s = new Set(p[conversationId] || [])
        s.add(String(userId))
        return { ...p, [conversationId]: s }
      })
    }
    const onTypingStop = ({ conversationId, userId }) => {
      setTypingUsers((p) => {
        const s = new Set(p[conversationId] || [])
        s.delete(String(userId))
        return { ...p, [conversationId]: s }
      })
    }

    // Real-time appointment status update
    const onApptUpdate = ({ appointmentId, status }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.messageType === 'appointment' &&
            String(m.appointmentRef?._id || m.appointmentRef) === String(appointmentId)
            ? { ...m, appointmentRef: { ...(m.appointmentRef || {}), status } }
            : m
        )
      )
    }

    socket.on('receive_message', onMsg)
    socket.on('user_online', onOnline)
    socket.on('user_offline', onOffline)
    socket.on('typing_start', onTypingStart)
    socket.on('typing_stop', onTypingStop)
    socket.on('appointment_updated', onApptUpdate)

    return () => {
      socket.off('receive_message', onMsg)
      socket.off('user_online', onOnline)
      socket.off('user_offline', onOffline)
      socket.off('typing_start', onTypingStart)
      socket.off('typing_stop', onTypingStop)
      socket.off('appointment_updated', onApptUpdate)
    }
  }, [activeConvId, socket, user?._id, markRead])

  // ── Auto scroll: chỉ scroll xuống khi user đang ở gần đáy ──────────────────
  const prevMsgCountRef = useRef(0)
  useEffect(() => {
    const isNewMsg = messages.length > prevMsgCountRef.current && !isLoadingMoreRef.current
    prevMsgCountRef.current = messages.length
    if (!isNewMsg) return
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setHasUnreadNew(false)
    } else {
      // User đang cuộn lên xem tin cũ → chỉ hiện badge
      setHasUnreadNew(true)
    }
  }, [messages])

  // ── Typing emit ──────────────────────────────────────────────────────────
  const emitTyping = useCallback(() => {
    if (!activeConvId || !user?._id || activeConvId === '__pending__') return
    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket.emit('typing_start', { conversationId: activeConvId, userId: user._id })
    }
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false
      socket.emit('typing_stop', { conversationId: activeConvId, userId: user._id })
    }, 2000)
  }, [activeConvId, user?._id, socket])

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e?.preventDefault()
    if ((!input.trim() && mediaFiles.length === 0) || !activeConvId || !user) return

    let convId = activeConvId
    let attachments = []

    // Lazy conv creation
    if (convId === '__pending__') {
      if (!pendingTo) return
      try {
        const res = await createConversationApi(pendingTo, pendingRoom)
        const conv = res.data?.data?.conversation
        if (!conv) return
        convId = conv._id
        setConversations((prev) =>
          prev.find((c) => c._id === conv._id) ? prev : [conv, ...prev]
        )
        setActiveConvId(conv._id)
        setPendingTo(null); setPendingRoom(null)
        socket.emit('join_conversation', conv._id)
      } catch {
        toast.error('Không thể mở cuộc hội thoại')
        return
      }
    }

    // Upload media
    if (mediaFiles.length > 0) {
      try {
        setUploading(true)
        const fd = new FormData()
        mediaFiles.forEach((f) => fd.append('files', f))
        const res = await uploadChatMediaApi(fd)
        attachments = res.data?.data?.attachments || []
      } catch {
        toast.error('Upload file thất bại')
        setUploading(false)
        return
      } finally {
        setUploading(false)
        setMediaFiles([])
      }
    }

    socket.emit('send_message', {
      conversationId: convId,
      senderId: user._id,
      content: input.trim(),
      attachments,
    })

    clearTimeout(typingTimerRef.current)
    isTypingRef.current = false
    setInput('')
    // Sau khi gửi, luôn scroll xuống đáy
    isNearBottomRef.current = true
    setHasUnreadNew(false)
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }))
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const activeConv = conversations.find((c) => c._id === activeConvId)
  const otherUser = activeConv?.participants?.find((p) => String(p._id) !== String(user?._id))
  const isOtherOnline = otherUser ? !!onlineUsers[String(otherUser._id)] : false
  const isOtherTyping = activeConvId ? (typingUsers[activeConvId]?.size || 0) > 0 : false

  // Total unread count for page title
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100svh-56px)] min-h-[560px] overflow-hidden bg-muted/20">
      {/* ── Sidebar: Conversation List ─────────────────────────────────── */}
      <div
        className={cn(
          'flex w-full shrink-0 flex-col border-r bg-background md:w-80 lg:w-[360px]',
          activeConvId && 'hidden md:flex'
        )}
      >
        {/* Sidebar header — aligns with navbar h-14 */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2 [&>h1]:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-bold">Tin nhắn</h1>
              <p className="text-xs text-muted-foreground">{conversations.length} hội thoại</p>
            </div>
            <h1 className="font-semibold text-base">Tin nhắn</h1>
            {totalUnread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>
        </div>

        {/* List */}
        <div className="min-h-0 flex-1">
          <ConversationList
            conversations={conversations}
            activeConvId={activeConvId}
            onSelect={selectConv}
            currentUserId={user?._id}
            onlineUsers={onlineUsers}
            typingUsers={typingUsers}
            loading={loadingConvs}
          />
        </div>
      </div>

      {/* ── Main: Chat Window ─────────────────────────────────────────────── */}
      <div className={cn('flex flex-1 flex-col min-w-0', !activeConvId && 'hidden md:flex')}>
        {!activeConvId ? (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center text-muted-foreground [&>p]:hidden">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border bg-background">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Chọn một hội thoại</p>
              <p className="mt-1 max-w-sm text-sm leading-6">Trao đổi với chủ trọ hoặc sinh viên, gửi ảnh/video và đặt lịch xem phòng ngay trong chat.</p>
            </div>
            <p className="text-sm">Chọn một cuộc hội thoại để bắt đầu</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <ChatHeader
              otherUser={otherUser}
              isOnline={isOtherOnline}
              isTyping={isOtherTyping}
              conv={activeConv}
              onBack={() => setActiveConvId(null)}
              onOpenBooking={() => setBookingOpen(true)}
            />

            {/* Messages — relative wrapper để floating badge */}
            <div className="relative flex-1 min-h-0 flex flex-col">
              <div
                ref={msgContainerRef}
                className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-muted/20 px-3 py-4 sm:px-5"
              >
                {/* Nút tải tin cũ hơn — chỉ hiện khi còn tin chưa load */}
                {hasMore && !loadingMore && !loadingMsgs && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={handleLoadMore}
                      className="rounded-full border bg-background px-3 py-1 text-[0px] text-muted-foreground shadow-sm transition-colors hover:text-foreground"
                    >
                      <span className="text-xs">Tải tin cũ hơn</span>
                      ↑ Tải tin cũ hơn
                    </button>
                  </div>
                )}
              {/* Spinner khi đang load thêm */}
              {loadingMore && (
                <div className="flex justify-center py-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
              {loadingMsgs ? (
                <div className="space-y-3 pt-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={cn('flex', i % 2 === 0 ? '' : 'justify-end')}>
                      <div className={cn('h-10 w-48 rounded-2xl bg-muted animate-pulse', i % 2 !== 0 && 'bg-primary/20')} />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <>
                <div className="flex flex-col items-center justify-center gap-2 pt-16 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-background text-muted-foreground">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Bắt đầu cuộc trò chuyện</p>
                  <p className="max-w-xs text-xs leading-5 text-muted-foreground">Gửi tin nhắn, ảnh/video hoặc đặt lịch xem phòng nếu hội thoại có gắn phòng.</p>
                </div>
                <p className="hidden">
                  Bắt đầu cuộc trò chuyện 👋
                </p>
                </>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = String(msg.sender?._id || msg.sender) === String(user?._id)
                  const prevMsg = messages[idx - 1]
                  const showAvatar =
                    !isMine &&
                    (idx === 0 || String(prevMsg?.sender?._id || prevMsg?.sender) !== String(msg.sender?._id || msg.sender))
                  const isRead = isMine && idx < messages.length - 1

                  return (
                    <MessageBubble
                      key={msg._id || idx}
                      msg={msg}
                      isMine={isMine}
                      showAvatar={showAvatar}
                      isRead={isRead}
                    />
                  )
                })
              )}

                {isOtherTyping && <TypingBubble name={otherUser?.name} />}
                <div ref={bottomRef} />
              </div>

              {/* Floating badge: tin nhắn mới khi đang cuộn lên */}
              {hasUnreadNew && (
                <button
                  onClick={() => {
                    isNearBottomRef.current = true
                    setHasUnreadNew(false)
                    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[0px] font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90"
                >
                  <span className="text-[11px]">Tin nhắn mới</span>
                  ↓ Tin nhắn mới
                </button>
              )}
            </div>

            {/* Input */}
            <ChatInput
              input={input}
              setInput={setInput}
              onSubmit={handleSend}
              onTyping={emitTyping}
              mediaFiles={mediaFiles}
              setMediaFiles={setMediaFiles}
              uploading={uploading}
              hasRoom={!!activeConv?.room}
              onOpenBooking={() => setBookingOpen(true)}
              disabled={!activeConvId}
            />
          </>
        )}
      </div>

      {/* Booking dialog */}
      <BookingInChatDialog
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        conv={activeConv}
        conversationId={activeConvId}
      />
    </div>
  )
}
