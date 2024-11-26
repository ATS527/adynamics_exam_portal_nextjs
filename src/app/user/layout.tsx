'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (userError || userData.role !== 'user') {
          await supabase.auth.signOut()
          router.push('/login')
        } else {
          setSession(session)
        }
      }
      setIsLoading(false)
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login')
      } else {
        setSession(session)
        checkSession()
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div>
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <span>Exam Portal</span>
          <div className="space-x-4">
            <Link href="/user/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/user/exams" className="hover:underline">Exams</Link>
            <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto py-4">
        {children}
      </main>
    </div>
  )
}