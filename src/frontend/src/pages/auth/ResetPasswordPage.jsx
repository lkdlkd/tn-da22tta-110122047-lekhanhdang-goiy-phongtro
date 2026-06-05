import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import { resetPasswordApi } from '@/services/authService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardContent, CardFooter } from '@/components/ui/card'
import { ArrowLeft, KeyRound, LockKeyhole, ShieldCheck, TimerReset } from 'lucide-react'
import {
  AuthCard,
  AuthShell,
  FormField,
  PasswordField,
  SubmitButton,
} from '@/pages/auth/components/AuthLayout'

const schema = yup.object({
  password: yup.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').required('Vui lòng nhập mật khẩu mới'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng xác nhận mật khẩu'),
})

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) })

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Liên kết đặt lại mật khẩu không hợp lệ')
      return
    }

    try {
      await resetPasswordApi(token, data.password)
      toast.success('Đặt lại mật khẩu thành công!')
      navigate('/login')
    } catch (err) {
      const message = err.response?.data?.message || 'Đặt lại mật khẩu thất bại'
      toast.error(message)
    }
  }

  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      description="Tạo mật khẩu mới để bảo vệ tài khoản của bạn."
      asideTitle="Hoàn tất khôi phục tài khoản bằng mật khẩu mới."
      asideDescription="Chọn mật khẩu dễ nhớ với bạn nhưng khó đoán với người khác. Sau khi hoàn tất, hãy đăng nhập lại để tiếp tục sử dụng hệ thống."
      asideItems={[
        { icon: LockKeyhole, title: 'Mật khẩu mới', desc: 'Tối thiểu 6 ký tự theo yêu cầu hệ thống.' },
        { icon: ShieldCheck, title: 'Bảo mật', desc: 'Không dùng lại mật khẩu quá dễ đoán.' },
        { icon: TimerReset, title: 'Liên kết reset', desc: 'Chỉ dùng được khi token còn hiệu lực.' },
      ]}
      footerPrompt="Đã nhớ mật khẩu?"
      footerLinkText="Đăng nhập"
      footerLinkTo="/login"
    >
      <AuthCard
        icon={KeyRound}
        title="Đặt lại mật khẩu"
        description={token ? 'Nhập mật khẩu mới và xác nhận lại để hoàn tất.' : 'Liên kết không hợp lệ hoặc thiếu mã xác thực.'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5">
            {!token && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
                Không tìm thấy mã đặt lại mật khẩu trong liên kết. Vui lòng yêu cầu gửi email khôi phục mới.
              </div>
            )}

            <PasswordField
              id="reset-password"
              label="Mật khẩu mới"
              autoComplete="new-password"
              register={register('password')}
              error={errors.password?.message}
              show={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
            />

            <FormField id="reset-confirm-password" label="Xác nhận mật khẩu mới" error={errors.confirmPassword?.message}>
              <Input
                id="reset-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-11 rounded-xl"
                {...register('confirmPassword')}
              />
            </FormField>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <SubmitButton
              id="btn-reset-submit"
              loading={isSubmitting}
              loadingText="Đang đặt lại..."
              disabled={!token}
            >
              Đặt lại mật khẩu
            </SubmitButton>
            <Button variant="ghost" asChild className="h-11 w-full rounded-xl">
              <Link to="/login">
                <ArrowLeft className="h-4 w-4" />
                Quay lại đăng nhập
              </Link>
            </Button>
          </CardFooter>
        </form>
      </AuthCard>
    </AuthShell>
  )
}
