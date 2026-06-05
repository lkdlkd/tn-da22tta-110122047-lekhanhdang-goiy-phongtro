import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { wizardRecommendApi } from '@/services/recommendService'
import { WizardResultsSheet } from './WizardResultsSheet'
import { LocationPickerDialog } from '@/components/common/LocationPickerDialog'

// ── Constants ─────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 5

const ROOM_TYPES = [
  { value: null,             label: 'Tất cả' },
  { value: 'phòng_trọ',     label: 'Phòng trọ' },
  { value: 'chung_cư_mini', label: 'Chung cư mini' },
  { value: 'nhà_nguyên_căn',label: 'Nhà nguyên căn' },
  { value: 'ký_túc_xá',    label: 'Ký túc xá' },
]

const PRICE_RANGES = [
  { label: 'Dưới 1 triệu', min: 0,         max: 1_000_000  },
  { label: 'Từ 1–2 triệu', min: 1_000_000, max: 2_000_000  },
  { label: 'Từ 2–3 triệu', min: 2_000_000, max: 3_000_000  },
  { label: 'Từ 3–5 triệu', min: 3_000_000, max: 5_000_000  },
  { label: 'Trên 5 triệu', min: 5_000_000, max: 20_000_000 },
  { label: 'Linh hoạt',    min: 0,         max: 20_000_000 },
]

const AREA_OPTIONS   = [10, 15, 20, 25, 30, 40]
const CAP_OPTIONS    = [{ value: 1, label: '1 người' }, { value: 2, label: '2 người' }, { value: 3, label: '3+ người' }]
const RADIUS_OPTIONS = [1, 3, 5, 10]

const AMENITY_OPTIONS = [
  { value: 'wifi',            label: 'Wifi' },
  { value: 'điều_hòa',       label: 'Điều hòa' },
  { value: 'nóng_lạnh',      label: 'Nóng lạnh' },
  { value: 'tủ_lạnh',        label: 'Tủ lạnh' },
  { value: 'máy_giặt',       label: 'Máy giặt' },
  { value: 'bếp',            label: 'Bếp nấu' },
  { value: 'chỗ_để_xe',      label: 'Chỗ để xe' },
  { value: 'an_ninh',        label: 'An ninh' },
  { value: 'ban_công',       label: 'Ban công' },
  { value: 'nội_thất',       label: 'Nội thất' },
  { value: 'vệ_sinh_riêng',  label: 'VS riêng' },
  { value: 'thang_máy',      label: 'Thang máy' },
]

// ── Slide animation ───────────────────────────────────────────────────────────
const variants = {
  enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center:        { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
}

// ── Chip selector ─────────────────────────────────────────────────────────────
function Chip({ active, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all h-10',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-input bg-background hover:bg-muted text-foreground',
        className
      )}
    >
      <span className="truncate">{children}</span>
    </button>
  )
}

// ── Step components ───────────────────────────────────────────────────────────
function Step1({ answers, set }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground">Bạn muốn thuê loại phòng nào?</h3>
        <p className="text-xs text-muted-foreground">Chọn một loại hình phòng trọ phù hợp nhất.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ROOM_TYPES.map(({ value, label }) => (
          <Chip
            key={String(value)}
            active={answers.roomType === value}
            onClick={() => set('roomType', value)}
          >
            {label}
          </Chip>
        ))}
      </div>
    </div>
  )
}

function Step2({ answers, set }) {
  const active = PRICE_RANGES.find(
    (r) => r.min === answers.priceMin && r.max === answers.priceMax
  )
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground">Ngân sách hàng tháng của bạn?</h3>
        <p className="text-xs text-muted-foreground">Chọn khoảng giá thuê phù hợp với khả năng chi trả.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {PRICE_RANGES.map((r) => (
          <Chip
            key={r.label}
            active={active?.label === r.label}
            onClick={() => { set('priceMin', r.min); set('priceMax', r.max) }}
          >
            {r.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}

function Step3({ answers, set }) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">Diện tích tối thiểu?</h3>
          <p className="text-xs text-muted-foreground">Chọn diện tích sử dụng mong muốn.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {AREA_OPTIONS.map((a) => (
            <Chip key={a} active={answers.areaMin === a} onClick={() => set('areaMin', a)}>
              Từ {a} m²
            </Chip>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">Số lượng người ở?</h3>
          <p className="text-xs text-muted-foreground">Chọn quy mô thành viên lưu trú.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {CAP_OPTIONS.map(({ value, label }) => (
            <Chip key={value} active={answers.capacity === value} onClick={() => set('capacity', value)}>
              {label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step4({ answers, set }) {
  const toggle = (v) => {
    const cur = answers.amenities
    const next = cur.includes(v) ? cur.filter((a) => a !== v) : [...cur, v]
    set('amenities', next)
  }
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground">Tiện ích cần thiết cho bạn?</h3>
        <p className="text-xs text-muted-foreground">Chọn các tiện ích bạn muốn có ở phòng trọ.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {AMENITY_OPTIONS.map(({ value, label }) => (
          <Chip
            key={value}
            active={answers.amenities.includes(value)}
            onClick={() => toggle(value)}
          >
            {label}
          </Chip>
        ))}
      </div>
    </div>
  )
}

function Step5({ answers, set }) {
  const [locPickerOpen, setLocPickerOpen] = useState(false)

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">Khu vực tìm kiếm?</h3>
          <p className="text-xs text-muted-foreground">Định vị vị trí học tập/làm việc để tính khoảng cách.</p>
        </div>
        <Button
          type="button"
          variant={answers.lat ? 'default' : 'outline'}
          className="w-full rounded-xl text-xs h-10 font-semibold"
          onClick={() => setLocPickerOpen(true)}
        >
          {answers.lat ? 'Đã thiết lập vị trí của bạn' : 'Chọn vị trí của bạn'}
        </Button>
        {answers.lat && (
          <p className="text-[10px] text-muted-foreground text-center">
            Toạ độ: {answers.lat.toFixed(5)}, {answers.lng.toFixed(5)}
          </p>
        )}
        <LocationPickerDialog
          open={locPickerOpen}
          onClose={() => setLocPickerOpen(false)}
          onSelect={(coords) => { set('lat', coords.lat); set('lng', coords.lng) }}
        />
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">Bán kính di chuyển tối đa</h3>
          <p className="text-xs text-muted-foreground">Khoảng cách tối đa từ trọ đến vị trí bạn chọn.</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {RADIUS_OPTIONS.map((r) => (
            <Chip key={r} active={answers.radius === r} onClick={() => set('radius', r)}>
              {r} km
            </Chip>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────
const DEFAULTS = {
  roomType:  null,
  priceMin:  0,
  priceMax:  20_000_000,
  areaMin:   10,
  capacity:  1,
  amenities: [],
  lat:       null,
  lng:       null,
  radius:    5,
}

export function RoomFinderWizard({ open, onClose }) {
  const [step, setStep]         = useState(1)
  const [dir, setDir]           = useState(1)
  const [answers, setAnswers]   = useState(DEFAULTS)
  const [loading, setLoading]   = useState(false)
  const [results, setResults]   = useState(null)
  const [showResults, setShowResults] = useState(false)

  const set = useCallback((key, val) => setAnswers((prev) => ({ ...prev, [key]: val })), [])

  const goNext = () => { setDir(1); setStep((s) => Math.min(s + 1, TOTAL_STEPS)) }
  const goPrev = () => { setDir(-1); setStep((s) => Math.max(s - 1, 1)) }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const res = await wizardRecommendApi({ ...answers, limit: 12 })
      const rooms = res.data?.data?.rooms || []
      setResults(rooms)
      setShowResults(true)
    } catch {
      toast.error('Không thể tìm kiếm. Thử lại sau!')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep(1); setDir(1); setAnswers(DEFAULTS); setResults(null)
    onClose()
  }

  const STEPS = [
    { label: 'Loại phòng', component: <Step1 answers={answers} set={set} /> },
    { label: 'Ngân sách',  component: <Step2 answers={answers} set={set} /> },
    { label: 'Diện tích',  component: <Step3 answers={answers} set={set} /> },
    { label: 'Tiện ích',   component: <Step4 answers={answers} set={set} /> },
    { label: 'Khu vực',    component: <Step5 answers={answers} set={set} /> },
  ]

  return (
    <>
      <Dialog open={open && !showResults} onOpenChange={handleClose}>
        <DialogContent className="max-w-md overflow-hidden rounded-2xl p-6">
          <DialogHeader className="space-y-1.5 pb-2">
            <DialogTitle className="text-base font-bold tracking-tight text-foreground">
              Tìm trọ nhanh — Bước {step}/{TOTAL_STEPS}
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground font-normal leading-relaxed">
              Trả lời các câu hỏi ngắn để hệ thống tìm kiếm phòng trọ tối ưu nhất cho nhu cầu của bạn.
            </p>
          </DialogHeader>

          {/* Progress */}
          <div className="space-y-2 py-1">
            <Progress value={(step / TOTAL_STEPS) * 100} className="h-1.5 rounded-full" />
            
            {/* Step labels */}
            <div className="flex justify-between text-[9px] text-muted-foreground px-0.5 font-medium">
              {STEPS.map(({ label }, i) => (
                <span key={i} className={cn(i + 1 <= step ? 'text-primary font-bold' : 'opacity-70')}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          <Separator className="my-2" />

          {/* Step content with animation */}
          <div className="relative min-h-[260px] overflow-hidden py-2">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="absolute inset-0 overflow-y-auto pb-2"
              >
                {STEPS[step - 1].component}
              </motion.div>
            </AnimatePresence>
          </div>

          <Separator className="my-2" />

          {/* Navigation */}
          <div className="flex justify-between items-center pt-2">
            <Button variant="ghost" onClick={goPrev} disabled={step === 1} className="rounded-xl text-xs h-9 px-4">
              Quay lại
            </Button>

            {step < TOTAL_STEPS ? (
              <Button onClick={goNext} className="rounded-xl text-xs h-9 px-4">
                Tiếp theo
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="rounded-xl text-xs h-9 px-5 font-semibold">
                {loading ? 'Đang tìm...' : 'Tìm phòng ngay'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Results */}
      <WizardResultsSheet
        open={showResults}
        rooms={results || []}
        userLocation={answers.lat && answers.lng ? { lat: answers.lat, lng: answers.lng } : null}
        onClose={() => { setShowResults(false); handleClose() }}
        onRetry={() => setShowResults(false)}
      />
    </>
  )
}
