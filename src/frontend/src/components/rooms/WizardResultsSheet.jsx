import { Link } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { RoomCard } from '@/components/rooms/RoomCard'

export function WizardResultsSheet({ open, rooms, onClose, onRetry }) {
  const titleNode = (
    <div className="flex items-center justify-between w-full pr-4">
      <span className="flex items-center gap-2">
        <span className="text-xl">🏠</span>
        <span>
          Tìm được <span className="text-primary">{rooms.length}</span> phòng phù hợp
        </span>
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" /> Sửa tiêu chí
        </Button>
        <Button size="sm" variant="ghost" className="h-8 text-xs" asChild>
          <Link to="/search" onClick={onClose}>Xem tất cả →</Link>
        </Button>
      </div>
    </div>
  )

  return (
    <Sheet open={open} onClose={onClose} side="right" title={titleNode}>
      <div className="space-y-3 pb-6">
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <span className="text-5xl">😔</span>
            <p className="text-sm">Không tìm thấy phòng phù hợp với tiêu chí của bạn.</p>
            <Button variant="outline" onClick={onRetry} className="gap-2 mt-1">
              <RefreshCw className="h-4 w-4" /> Thử lại với tiêu chí khác
            </Button>
          </div>
        ) : (
          rooms.map((room) => <RoomCard key={room._id} room={room} view="list" />)
        )}
      </div>
    </Sheet>
  )
}
