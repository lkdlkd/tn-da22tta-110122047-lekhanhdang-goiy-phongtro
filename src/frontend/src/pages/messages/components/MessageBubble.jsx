import { useState } from 'react'
import dayjs from 'dayjs'
import { Check, CheckCheck, X } from 'lucide-react'
import { AppointmentBubble } from '@/components/rooms/AppointmentBubble'
import { cn } from '@/lib/utils'
import { ConvAvatar } from './ConvAvatar'

function AttachmentGrid({ attachments, onImageClick }) {
  if (!attachments?.length) return null
  return (
    <div className={cn('mt-2 grid gap-1.5', attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
      {attachments.map((attachment, index) =>
        attachment.type === 'image' ? (
          <button
            key={`${attachment.url}-${index}`}
            onClick={() => onImageClick?.(attachment.url)}
            className="block w-full overflow-hidden rounded-lg border-0 bg-transparent p-0 text-left cursor-zoom-in"
          >
            <img src={attachment.url} alt="" className="max-h-56 w-full object-cover transition-opacity hover:opacity-90" />
          </button>
        ) : (
          <video key={`${attachment.url}-${index}`} src={attachment.url} controls className="max-h-56 w-full rounded-lg bg-black" />
        )
      )}
    </div>
  )
}

export function MessageBubble({ msg, isMine, showAvatar, isRead }) {
  const [previewUrl, setPreviewUrl] = useState(null)

  if (msg.messageType === 'appointment' && msg.appointmentRef) {
    return (
      <div className={cn('flex items-end gap-2', isMine ? 'justify-end' : 'justify-start')}>
        {!isMine && showAvatar && <ConvAvatar name={msg.sender?.name} avatar={msg.sender?.avatar} size="sm" />}
        {!isMine && !showAvatar && <div className="w-9 shrink-0" />}
        <div className="max-w-[82%] sm:max-w-[72%]">
          <AppointmentBubble appt={msg.appointmentRef} isMine={isMine} />
          <p className={cn('mt-1 px-1 text-[10px] text-muted-foreground', isMine ? 'text-right' : 'text-left')}>
            {dayjs(msg.createdAt).format('HH:mm')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={cn('flex items-end gap-2', isMine ? 'justify-end' : 'justify-start')}>
        {!isMine && showAvatar && <ConvAvatar name={msg.sender?.name} avatar={msg.sender?.avatar} size="sm" />}
        {!isMine && !showAvatar && <div className="w-9 shrink-0" />}

        <div className={cn('flex max-w-[82%] flex-col sm:max-w-[72%]', isMine ? 'items-end' : 'items-start')}>
          <div
            className={cn(
              'rounded-2xl px-3.5 py-2.5 text-sm shadow-sm',
              isMine
                ? 'rounded-br-md bg-primary text-primary-foreground'
                : 'rounded-bl-md border bg-card text-foreground'
            )}
          >
            {msg.content && <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>}
            <AttachmentGrid attachments={msg.attachments} onImageClick={setPreviewUrl} />
          </div>

          <div className={cn('mt-1 flex items-center gap-1 px-1', isMine ? 'flex-row-reverse' : 'flex-row')}>
            <span className="text-[10px] text-muted-foreground">{dayjs(msg.createdAt).format('HH:mm')}</span>
            {isMine && (isRead ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3 text-muted-foreground" />)}
          </div>
        </div>
      </div>

      {previewUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={previewUrl}
            alt="Xem ảnh lớn"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

export function TypingBubble({ name, avatar }) {
  return (
    <div className="flex items-end gap-2">
      <ConvAvatar name={name} avatar={avatar} size="sm" />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border bg-card px-4 py-3 shadow-sm">
        {[0, 1, 2].map((index) => (
          <span key={index} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: `${index * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}
