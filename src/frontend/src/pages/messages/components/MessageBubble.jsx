import dayjs from 'dayjs'
import { Check, CheckCheck } from 'lucide-react'
import { AppointmentBubble } from '@/components/rooms/AppointmentBubble'
import { cn } from '@/lib/utils'
import { ConvAvatar } from './ConvAvatar'

function AttachmentGrid({ attachments }) {
  if (!attachments?.length) return null
  return (
    <div className={cn('mt-2 grid gap-1.5', attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
      {attachments.map((attachment, index) =>
        attachment.type === 'image' ? (
          <a key={`${attachment.url}-${index}`} href={attachment.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
            <img src={attachment.url} alt="" className="max-h-56 w-full object-cover transition-opacity hover:opacity-90" />
          </a>
        ) : (
          <video key={`${attachment.url}-${index}`} src={attachment.url} controls className="max-h-56 w-full rounded-lg bg-black" />
        )
      )}
    </div>
  )
}

export function MessageBubble({ msg, isMine, showAvatar, isRead }) {
  if (msg.messageType === 'appointment' && msg.appointmentRef) {
    return (
      <div className={cn('flex items-end gap-2', isMine ? 'justify-end' : 'justify-start')}>
        {!isMine && showAvatar && <ConvAvatar name={msg.sender?.name} size="sm" />}
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
    <div className={cn('flex items-end gap-2', isMine ? 'justify-end' : 'justify-start')}>
      {!isMine && showAvatar && <ConvAvatar name={msg.sender?.name} size="sm" />}
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
          <AttachmentGrid attachments={msg.attachments} />
        </div>

        <div className={cn('mt-1 flex items-center gap-1 px-1', isMine ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-[10px] text-muted-foreground">{dayjs(msg.createdAt).format('HH:mm')}</span>
          {isMine && (isRead ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3 text-muted-foreground" />)}
        </div>
      </div>
    </div>
  )
}

export function TypingBubble({ name }) {
  return (
    <div className="flex items-end gap-2">
      <ConvAvatar name={name} size="sm" />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border bg-card px-4 py-3 shadow-sm">
        {[0, 1, 2].map((index) => (
          <span key={index} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: `${index * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}
