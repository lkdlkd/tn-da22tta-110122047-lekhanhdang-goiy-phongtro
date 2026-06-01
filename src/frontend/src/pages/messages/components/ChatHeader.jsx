import { ArrowLeft, CalendarPlus, ExternalLink, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ConvAvatar } from './ConvAvatar'

export function ChatHeader({ otherUser, isOnline, isTyping, conv, onBack, onOpenBooking }) {
  return (
    <div className="shrink-0 border-b bg-background">
      <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-lg md:hidden" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <ConvAvatar name={otherUser?.name} avatar={otherUser?.avatar} size="md" online={isOnline} />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{otherUser?.name || 'Người dùng'}</p>
          <p className="mt-0.5 h-4 text-xs">
            {isTyping ? (
              <span className="animate-pulse font-medium italic text-primary">Đang nhập...</span>
            ) : isOnline ? (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Đang hoạt động
              </span>
            ) : (
              <span className="text-muted-foreground">Không hoạt động</span>
            )}
          </p>
        </div>

        {conv?.room && (
          <Button variant="outline" size="sm" className="hidden h-9 rounded-lg text-xs sm:inline-flex" onClick={onOpenBooking}>
            <CalendarPlus className="h-3.5 w-3.5" />
            Đặt lịch
          </Button>
        )}
      </div>

      {conv?.room && (
        <div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-2">
          {conv.room.images?.[0] ? (
            <img src={conv.room.images[0]} alt="" className="h-9 w-12 shrink-0 rounded-md object-cover" />
          ) : (
            <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Home className="h-4 w-4" />
            </div>
          )}
          <Link to={`/rooms/${conv.room.slug}`} className="min-w-0 flex-1 truncate text-xs font-medium text-primary hover:underline">
            {conv.room.title}
          </Link>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
