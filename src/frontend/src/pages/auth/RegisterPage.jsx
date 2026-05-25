import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import { registerApi } from '@/services/authService'
import { loginSuccess } from '@/features/auth/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardContent, CardFooter } from '@/components/ui/card'
import { AlertCircle, Building2, GraduationCap, Mail, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import {
  AuthCard,
  AuthShell,
  AuthStatusCard,
  FormField,
  PasswordField,
  SubmitButton,
} from '@/pages/auth/components/AuthLayout'
import { cn } from '@/lib/utils'

const schema = yup.object({
  name: yup.string().min(2, 'Tên tối thiểu 2 ký tự').required('Vui lòng nhập họ tên'),
  email: yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  password: yup.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').required('Vui lòng nhập mật khẩu'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng xác nhận mật khẩu'),
  role: yup.string().oneOf(['student', 'landlord']).required('Vui lòng chọn loại tài khoản'),
})

function RoleOption({ active, icon: Icon, title, description, onClick, id }) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      className={cn(
        'flex min-h-28 flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all',
        active
          ? 'border-primary bg-primary/10 text-primary shadow-sm'
          : 'border-border bg-background hover:border-primary/50 hover:bg-muted/40'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs leading-relaxed text-muted-foreground">{description}</span>
    </button>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [showPassword, setShowPassword] = useState(false)
  const [landlordVerifyPending, setLandlordVerifyPending] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { role: 'student' },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data) => {
    setApiError('')
    try {
      const res = await registerApi(data)

      if (res.data.data?.token) {
        dispatch(loginSuccess(res.data.data))
        toast.success('Đăng ký thành công! Chào mừng bạn')
        navigate('/')
        return
      }

      if (res.data.data?.requireEmailVerification) {
        setPendingEmail(data.email)
        setLandlordVerifyPending(true)
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản')
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Đăng ký thất bại'
      setApiError(message)
      toast.error(message)
    }
  }

  return (
    <AuthShell
      title="Tạo tài khoản"
      description="Chọn vai trò phù hợp để bắt đầu tìm phòng hoặc quản lý tin đăng."
      asideTitle="Bắt đầu với tài khoản phù hợp cho nhu cầu của bạn."
      asideDescription="Sinh viên có thể lưu phòng và đặt lịch xem. Chủ trọ có thể đăng tin, quản lý lịch hẹn và trao đổi với người thuê."
      asideItems={[
        { icon: GraduationCap, title: 'Người thuê', desc: 'Tìm phòng, lưu tin và đặt lịch nhanh.' },
        { icon: Building2, title: 'Chủ trọ', desc: 'Đăng phòng và quản lý khách liên hệ.' },
        { icon: MessageCircle, title: 'Trao đổi', desc: 'Chat trực tiếp trong hệ thống.' },
      ]}
      footerPrompt="Đã có tài khoản?"
      footerLinkText="Đăng nhập"
      footerLinkTo="/login"
      className="items-start pt-4 sm:pt-8 lg:items-center lg:pt-2"
    >
      {landlordVerifyPending ? (
        <AuthStatusCard
          icon={Mail}
          tone="primary"
          title="Kiểm tra email của bạn"
          description="Chúng tôi đã gửi liên kết xác thực để kích hoạt tài khoản chủ trọ."
        >
          <div className="rounded-lg border bg-muted/40 p-4 text-left">
            <p className="text-xs font-medium uppercase text-muted-foreground">Email nhận xác thực</p>
            <p className="mt-1 break-all text-sm font-semibold text-foreground">{pendingEmail}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Liên kết có hiệu lực trong 24 giờ. Nếu không thấy email, vui lòng kiểm tra thư mục Spam hoặc Junk.
            </p>
          </div>
          <Button variant="outline" asChild className="h-11 w-full rounded-lg">
            <Link to="/login">Quay lại đăng nhập</Link>
          </Button>
        </AuthStatusCard>
      ) : (
        <AuthCard
          icon={ShieldCheck}
          title="Tạo tài khoản"
          description="Thông tin này giúp hệ thống cá nhân hóa trải nghiệm và bảo vệ tài khoản của bạn."
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-medium">Bạn tham gia với vai trò</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <RoleOption
                    id="role-student"
                    active={selectedRole === 'student'}
                    icon={GraduationCap}
                    title="Sinh viên / Người thuê"
                    description="Tìm phòng, lưu tin yêu thích và đặt lịch xem phòng."
                    onClick={() => setValue('role', 'student', { shouldValidate: true })}
                  />
                  <RoleOption
                    id="role-landlord"
                    active={selectedRole === 'landlord'}
                    icon={Building2}
                    title="Chủ trọ"
                    description="Đăng tin và quản lý phòng cho thuê."
                    onClick={() => setValue('role', 'landlord', { shouldValidate: true })}
                  />
                </div>
                {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
              </div>

              {apiError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  <div className="flex-1 font-semibold leading-relaxed">{apiError}</div>
                </div>
              )}

              <FormField id="register-name" label="Họ và tên" error={errors.name?.message}>
                <Input
                  id="register-name"
                  autoComplete="name"
                  placeholder="Nguyễn Văn A"
                  className={cn(
                    'h-11 rounded-lg transition-all duration-300',
                    errors.name ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'
                  )}
                  {...register('name')}
                />
              </FormField>

              <FormField id="register-email" label="Email" error={errors.email?.message}>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  className={cn(
                    'h-11 rounded-lg transition-all duration-300',
                    errors.email ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'
                  )}
                  {...register('email')}
                />
              </FormField>

              <PasswordField
                id="register-password"
                label="Mật khẩu"
                autoComplete="new-password"
                register={register('password')}
                error={errors.password?.message}
                show={showPassword}
                onToggle={() => setShowPassword((value) => !value)}
              />

              <FormField id="register-confirm-password" label="Xác nhận mật khẩu" error={errors.confirmPassword?.message}>
                <Input
                  id="register-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={cn(
                    'h-11 rounded-lg transition-all duration-300',
                    errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'
                  )}
                  {...register('confirmPassword')}
                />
              </FormField>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <SubmitButton id="btn-register-submit" loading={isSubmitting} loadingText="Đang tạo tài khoản...">
                Đăng ký
              </SubmitButton>
              <p className="text-center text-sm text-muted-foreground">
                Chủ trọ cần xác thực email trước khi đăng tin.
              </p>
            </CardFooter>
          </form>
        </AuthCard>
      )}
    </AuthShell>
  )
}
