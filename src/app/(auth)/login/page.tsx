'use client';
import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui';
import { AuthShell, inputClass, labelClass } from '@/components/auth/AuthShell';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  const handleOAuth = (provider: string) => {
    setOauthLoading(provider);
    signIn(provider, { callbackUrl });
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue editing"
      error={error}
      oauthLoading={oauthLoading}
      onOAuth={handleOAuth}
      footer={
        <>
          No account?{' '}
          <Link
            href={`/register${callbackUrl !== '/dashboard' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
            className="text-accent transition-colors hover:text-[#818CF8]"
          >
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required className={`${inputClass} pr-10`} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted transition-colors hover:text-txt-secondary">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" size="lg" loading={loading} disabled={loading || !!oauthLoading} className="mt-2 w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
