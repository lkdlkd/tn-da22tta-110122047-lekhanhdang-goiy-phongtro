import { useNavigate } from 'react-router-dom'
import { ArrowRight, GitCompare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCompareStore } from '@/store/compareStore'
import { cn } from '@/lib/utils'

export function CompareBar() {
  const navigate = useNavigate()
  const { rooms, removeRoom, clearRooms } = useCompareStore()

  if (rooms.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 shadow-2xl backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto">
          <div className="flex shrink-0 items-center gap-1.5">
            <GitCompare className="h-4 w-4 text-primary" />
            <span className="hidden text-sm font-semibold sm:block">So sánh ({rooms.length}/3)</span>
          </div>

          <div className="flex gap-2">
            {rooms.map((room) => (
              <div key={room._id} className="flex shrink-0 items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-1.5">
                {room.images?.[0] && <img src={room.images[0]} alt="" className="h-8 w-10 rounded object-cover" />}
                <span className="hidden max-w-[120px] truncate text-xs font-medium sm:block">{room.title}</span>
                <button type="button" onClick={() => removeRoom(room._id)} className="ml-1 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {Array.from({ length: 3 - rooms.length }).map((_, index) => (
              <div key={index} className="flex h-11 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed">
                <span className="text-xs text-muted-foreground">Trống</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearRooms} className="h-8 text-xs">Xóa hết</Button>
          <Button size="sm" disabled={rooms.length < 2} onClick={() => navigate('/compare')} className="h-8 gap-1.5">
            So sánh <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function CompareButton({ room, size = 'sm' }) {
  const { addRoom, removeRoom, isInCompare } = useCompareStore()
  const inCompare = isInCompare(room._id)
  const iconOnly = size === 'icon'

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        inCompare ? removeRoom(room._id) : addRoom(room)
      }}
      title={inCompare ? 'Xóa khỏi so sánh' : 'Thêm vào so sánh'}
      className={cn(
        'flex items-center justify-center gap-1 rounded-md border text-xs font-medium transition-colors',
        iconOnly ? 'h-9 w-9 p-0 shadow-sm' : 'px-2 py-1',
        inCompare
          ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
          : 'border-border bg-background/90 text-muted-foreground hover:border-primary/50 hover:text-primary'
      )}
    >
      <GitCompare className={cn(iconOnly ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
      {!iconOnly && (inCompare ? 'Đang so sánh' : 'So sánh')}
    </button>
  )
}
