'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Loader2, Menu, LayoutDashboard } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [shouldRenderLayout, setShouldRenderLayout] = useState(true)

  useEffect(() => {
    // Check if we're on an admin route
    if (router.pathname?.startsWith('/admin')) {
      setShouldRenderLayout(false)
    }
  }, [router.pathname])

  if (!shouldRenderLayout) {
    return <>{children}</>
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
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
      <nav className="bg-gray-900 text-white p-4 sticky top-0 z-50">
        <div className="container mx-auto">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between">
            <span className="text-lg font-semibold">Student Portal</span>
            <div className="flex items-center space-x-1">
              <Link href="/user/dashboard">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-gray-800">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" onClick={handleSignOut} className="text-white hover:text-white hover:bg-gray-800">
                Sign Out
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center justify-between">
            <span className="text-lg font-semibold">Student Portal</span>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-gray-900 text-white border-gray-800">
                <div className="flex flex-col space-y-3 mt-6">
                  <Link href="/user/dashboard">
                    <Button variant="ghost" className="w-full justify-start text-white hover:text-white hover:bg-gray-800">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-white hover:text-white hover:bg-gray-800">
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  )
}