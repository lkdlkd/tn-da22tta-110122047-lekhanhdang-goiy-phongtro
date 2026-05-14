import { Link } from 'react-router-dom'
import { BedDouble, Globe, GraduationCap, Mail, MapPin, ShieldCheck } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const FOOTER_LINKS = [
  {
    title: 'Khám phá',
    links: [
      { label: 'Trang chủ', to: '/' },
      { label: 'Tìm phòng', to: '/search' },
      { label: 'Gợi ý cho bạn', to: '/recommend' },
      { label: 'So sánh phòng', to: '/compare' },
    ],
  },
  {
    title: 'Tài khoản',
    links: [
      { label: 'Đăng nhập', to: '/login' },
      { label: 'Đăng ký', to: '/register' },
      { label: 'Hồ sơ cá nhân', to: '/profile' },
      { label: 'Phòng yêu thích', to: '/favorites' },
      { label: 'Lịch hẹn', to: '/appointments' },
    ],
  },
  {
    title: 'Chủ trọ',
    links: [
      { label: 'Bảng điều khiển', to: '/landlord/dashboard' },
      { label: 'Đăng tin phòng', to: '/landlord/rooms/create' },
      { label: 'Quản lý phòng', to: '/landlord/rooms' },
      { label: 'Lịch hẹn', to: '/landlord/appointments' },
    ],
  },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_2fr]">
          <div className="space-y-5">
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border bg-card text-primary">
                <BedDouble className="h-5 w-5" />
              </span>
              <span className="leading-tight">
                <span className="block text-base font-extrabold tracking-tight">
                  Phòng Trọ <span className="text-primary">TVU</span>
                </span>
                <span className="text-xs text-muted-foreground">Tìm phòng · Gợi ý · Vĩnh Long</span>
              </span>
            </Link>

            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Nền tảng hỗ trợ sinh viên tìm phòng trọ quanh Vĩnh Long, so sánh thông tin rõ ràng và kết nối nhanh với chủ trọ.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Đồ án tốt nghiệp</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Trường Đại học Trà Vinh · CNTT</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Thông tin minh bạch</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Giá, diện tích, trạng thái và địa chỉ dễ kiểm tra.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {FOOTER_LINKS.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <ul className="mt-3 space-y-2">
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>© {year} Phòng Trọ TVU.</span>
            <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline-block" />
            <span>Thiết kế cho nhu cầu tìm phòng sinh viên.</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Vĩnh Long, Việt Nam
            </span>
            <a href="mailto:support@phongtrotvu.local" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
              <Mail className="h-3.5 w-3.5" />
              Liên hệ
            </a>
            <a href="https://www.tvu.edu.vn" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
              <Globe className="h-3.5 w-3.5" />
              tvu.edu.vn
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
