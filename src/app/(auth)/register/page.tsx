'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui';
import { AuthShell, inputClass, labelClass } from '@/components/auth/AuthShell';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [name, setName] = useState('');
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
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return; }
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.ok) { router.push(callbackUrl); router.refresh(); }
    } catch { setError('Something went wrong'); setLoading(false); }
  };

  const handleOAuth = (provider: string) => {
    setOauthLoading(provider);
    signIn(provider, { callbackUrl });
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start collaborating in seconds"
      error={error}
      oauthLoading={oauthLoading}
      onOAuth={handleOAuth}
      footer={
        <>
          Already have an account?{' '}
          <Link
            href={`/login${callbackUrl !== '/dashboard' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
            className="text-accent transition-colors hover:text-[#818CF8]"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Your name" required minLength={2} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters" required minLength={8} className={`${inputClass} pr-10`} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted transition-colors hover:text-txt-secondary">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" size="lg" loading={loading} disabled={loading || !!oauthLoading} className="mt-2 w-full">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
