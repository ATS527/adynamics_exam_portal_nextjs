'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, FolderPen, Loader2, Lock, LockKeyhole, Mail } from 'lucide-react'
import Image from 'next/image'
import randomBgData from '@/constants/randomBgData'




export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [ randomBg, setRandomBg ] = useState('')

  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'user' // Set default role in user metadata
          }
        }
      })
      if (error) throw error

      if (data.user) {
        // Upsert the user data into the users table
        const { error: upsertError } = await supabase
          .from('users')
          .upsert([
            {
              id: data.user.id,
              name: name,
              role: 'user'
            }
          ], 
          { 
            onConflict: 'id',
            ignoreDuplicates: false
          })
        
        if (upsertError) throw upsertError

        router.push('/login?message=Registration successful. Please log in.')
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

  return (
    <>
    <main className={`relative w-full sm:h-screen sm:flex flex-col items-center md:justify-center`}>
      <div className="w-full h-screen lg:max-w-7xl flex sm:items-center md:justify-around">
        <div className="hidden sm:block">
          <div className="relative w-80 h-20">
            <Image
              src={"/images/horizontal_logo_white.png"}
              alt="logo"
              fill
              className="object-contain w-full"
            />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center w-full md:w-auto">
          {error && (
            <Alert variant="destructive" className="mb-4 max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Card className="w-full max-w-md border-none shadow-none sm:border sm:shadow-sm">
            <CardHeader>
              <Image src={'/images/horizontal_logo.png'} alt='logo' width={200} height={80} className='ml-[-12px] mb-2 sm:hidden'/>
              <CardTitle>Register</CardTitle>
              <CardDescription>
                Create a new account for the exam portal
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className='flex items-center justify-start'><FolderPen className='mr-2 w-4 h-4'/>Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
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
                <div className="space-y-2">
                <Label htmlFor="confirmPassword" className='flex items-center justify-start'><LockKeyhole className='mr-2 w-4 h-4'/>Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register"
                  )}
                </Button>
                <p className="text-sm text-center">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-main hover:underline hover:text-mainDark transition-colors duration-300 ease-in-out"
                  >
                    Login here
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>

            <div className='absolute w-full h-full top-0 left-0 -z-10 hidden sm:block'>
              <Image src={randomBg} alt='bg' fill className='object-cover w-full h-full'/>
            </div>
    </main>
    </>
  );
}