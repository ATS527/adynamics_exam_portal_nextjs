'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Loader2, Lock, Mail } from 'lucide-react'
import Image from 'next/image'
import randomBgData from '@/constants/randomBgData'




export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [ randomBg, setRandomBg ] = useState('')

  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (userError) {
          console.error('Error fetching user data:', userError)
          return
        }

        if (userData.role === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/user/dashboard')
        }
      }
      setIsCheckingSession(false)
    }

    checkSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (userError) throw userError

        if (userData.role === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/user/dashboard')
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(()=>{
    let random = Math.floor(Math.random() * randomBgData.length)
    setRandomBg(randomBgData[random])
  },[])

  if (isCheckingSession) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
    <main className={`relative w-full h-screen flex flex-col items-center justify-center`}>
      <div className='w-full h-[90%] lg:max-w-7xl flex items-center justify-around'>
        <div className='hidden sm:block'>
          <div className="relative w-80 h-20">
            <Image
            src={'/images/horizontal_logo_white.png'}
            alt='logo'
            fill
            className="object-contain w-full"
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center sm:gap-3">
          {error && (
            <Alert variant="destructive" className="mb-4 w-[90%] sm:w-full max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Card className="w-full h-full sm:max-w-md border-none shadow-none sm:border sm:shadow-sm">
            <CardHeader>
              <Image src={'/images/horizontal_logo.png'} alt='logo' width={200} height={80} className='ml-[-12px] mb-2 sm:hidden'/>
              <CardTitle>Login</CardTitle>
              <CardDescription>Enter your credentials to access the exam portal</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="email" className='flex items-center justify-start'><Mail className='mr-2 w-4 h-4'/>Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                <Label htmlFor="password" className='flex items-center justify-start'><Lock className='mr-2 w-4 h-4'/>Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging In...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
                <p className="text-sm text-center">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-main hover:underline hover:text-mainDark">
                    Register here
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>

      <div className='w-full h-[10%] flex items-center justify-center'>
        <div className='w-full lg:max-w-7xl text-center text-sm text-gray-500 sm:text-white'>
          Having trouble logging in? please contact us at <a className='text-main hover:text-mainSoft transition-colors duration-300 ease-in-out' href="mailto:support@adynamics.in">support@adynamics.in</a>
        </div>
      </div>

      <div className='absolute w-full h-full top-0 left-0 -z-10 hidden sm:block'>
        <Image src={randomBg} alt='bg' fill className='object-cover w-full h-full'/>
      </div>
    </main>
    </>
  )
}