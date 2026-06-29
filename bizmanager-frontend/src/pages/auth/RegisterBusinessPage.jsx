import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Rocket } from 'lucide-react'
import { authApi } from '../../api/auth'
import { apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const initialForm = {
  businessName: '',
  businessType: '',
  masterAdminName: '',
  phone: '',
  password: '',
}

export default function RegisterBusinessPage() {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await authApi.registerBusiness(form)
      login(res)
      toast.success(`${res.businessName} is set up. You're logged in as MasterAdmin.`)
      navigate('/', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-display text-3xl font-semibold text-paper">BizManager</p>
          <p className="mt-2 text-sm text-muted">Set up your business. You'll be its MasterAdmin.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-line bg-ink-2 p-6">
          <Input label="Business name" name="businessName" value={form.businessName} onChange={update('businessName')} required />
          <Input
            label="Business type"
            name="businessType"
            placeholder="e.g. Water Park, Retail Store"
            hint="Optional, just for your own reference."
            value={form.businessType}
            onChange={update('businessType')}
          />
          <div className="my-1 border-t border-line" />
          <Input label="Your name" name="masterAdminName" value={form.masterAdminName} onChange={update('masterAdminName')} required />
         <Input label="Phone" type="tel" name="phone" autoComplete="tel" value={form.phone} onChange={update('phone')} required />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={6}
            hint="At least 6 characters."
            value={form.password}
            onChange={update('password')}
            required
          />
          {error && <p className="text-sm text-rust">{error}</p>}
          <Button type="submit" loading={loading} className="mt-1 w-full">
            <Rocket size={16} /> Create business
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already set up?{' '}
          <Link to="/login" className="font-medium text-amber hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
