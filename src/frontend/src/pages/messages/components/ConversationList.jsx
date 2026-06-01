import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { MessageCircle, Search } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ConvAvatar } from './ConvAvatar'

function getConversationText(conv) {
  if (conv.lastMessage?.messageType === 'appointment') return 'Lịch hẹn xem phòng'
  if (conv.lastMessage?.content) return conv.lastMessage.content
  if (conv.lastMessage?.attachments?.length) return 'File đính kèm'
  return conv.room?.title || 'Bắt đầu hội thoại'
}

export function ConversationList({
  conversations,
  activeConvId,
  onSelect,
  currentUserId,
  onlineUsers,
  typingUsers,
  loading,
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return conversations
    return conversations.filter((conv) => {
      const other = conv.participants?.find((person) => String(person._id) !== String(currentUserId))
      return [other?.name, conv.room?.title, getConversationText(conv)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    })
  }, [conversations, currentUserId, query])

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm người hoặc phòng"
            className="h-10 w-full rounded-lg border bg-muted/40 pl-9 pr-3 text-sm outline-none transition-colors focus:bg-background focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-1">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="flex gap-3 rounded-lg p-3">
                <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center text-muted-foreground">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{conversations.length ? 'Không tìm thấy hội thoại' : 'Chưa có hội thoại nào'}</p>
              <p className="mt-1 text-xs leading-5">{conversations.length ? 'Thử nhập tên hoặc phòng khác.' : 'Tin nhắn từ chủ trọ và sinh viên sẽ nằm ở đây.'}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((conv) => {
              const other = conv.participants?.find((person) => String(person._id) !== String(currentUserId))
              const isActive = conv._id === activeConvId
              const isTyping = (typingUsers[conv._id]?.size || 0) > 0
              const unread = conv.unreadCount || 0
              const isUnread = !isActive && unread > 0

              return (
                <button
                  key={conv._id}
                  type="button"
                  onClick={() => onSelect(conv._id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors',
                    isActive ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted/70'
                  )}
                >
                  <ConvAvatar name={other?.name} avatar={other?.avatar} online={onlineUsers[String(other?._id)]} size="md" />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn('truncate text-sm', isUnread ? 'font-bold' : 'font-semibold')}>
                        {other?.name || 'Người dùng'}
                      </p>
                      {conv.room && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />}
                    </div>
                    <p className={cn(
                      'mt-0.5 truncate text-xs',
                      isTyping ? 'font-medium italic text-primary' : isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'
                    )}>
                      {isTyping ? 'Đang nhập...' : getConversationText(conv)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {conv.lastMessageAt && (
                      <span className={cn('text-[11px]', isUnread ? 'font-semibold text-primary' : 'text-muted-foreground')}>
                        {dayjs(conv.lastMessageAt).fromNow(true)}
                      </span>
                    )}
                    {isUnread && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
