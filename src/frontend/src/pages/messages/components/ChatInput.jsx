import { useMemo, useRef } from 'react'
import { CalendarPlus, Film, ImageIcon, Paperclip, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ChatInput({
  input,
  setInput,
  onSubmit,
  onTyping,
  mediaFiles,
  setMediaFiles,
  uploading,
  hasRoom,
  onOpenBooking,
  disabled,
}) {
  const fileInputRef = useRef(null)
  const mediaPreviews = useMemo(() => mediaFiles.map((file) => ({ url: URL.createObjectURL(file), type: file.type })), [mediaFiles])

  return (
    <div className="shrink-0 border-t bg-background">
      {mediaFiles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-3 pb-2 pt-3">
          {mediaPreviews.map((preview, index) => (
            <div key={`${preview.url}-${index}`} className="relative shrink-0">
              {preview.type.startsWith('image') ? (
                <img src={preview.url} alt="" className="h-16 w-16 rounded-lg border object-cover" />
              ) : (
                <div className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border bg-muted">
                  <Film className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground">Video</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setMediaFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-end gap-2 px-3 py-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4,video/quicktime,video/webm"
          multiple
          className="sr-only"
          onChange={(event) => {
            setMediaFiles((prev) => [...prev, ...Array.from(event.target.files || [])].slice(0, 5))
            event.target.value = ''
          }}
        />

        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => fileInputRef.current?.click()} title="Đính kèm ảnh/video" disabled={disabled}>
            <Paperclip className="h-4 w-4" />
          </Button>
          {hasRoom && (
            <Button type="button" size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary" onClick={onOpenBooking} title="Đặt lịch xem phòng" disabled={disabled}>
              <CalendarPlus className="h-4 w-4" />
            </Button>
          )}
        </div>

        <input
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
            onTyping()
          }}
          placeholder="Nhập tin nhắn..."
          disabled={disabled}
          autoComplete="off"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              onSubmit(event)
            }
          }}
          className={cn(
            'min-h-10 min-w-0 flex-1 rounded-lg border bg-muted/40 px-4 py-2 text-sm outline-none transition-colors',
            'focus:bg-background focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground'
          )}
        />

        <Button type="submit" size="icon" className="h-10 w-10 shrink-0 rounded-lg" disabled={(!input.trim() && mediaFiles.length === 0) || uploading || disabled}>
          {uploading ? <ImageIcon className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}
