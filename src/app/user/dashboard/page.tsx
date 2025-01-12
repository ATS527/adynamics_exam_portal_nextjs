'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface Exam {
  id: string
  title: string
}

export default function UserDashboard() {
  const [availableExams, setAvailableExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAvailableExams() {
      try {
        const { data: exams, error } = await supabase
          .from('exams')
          .select('id, title')

        if (error) {
          console.error('Error fetching exams:', error)
        } else {
          setAvailableExams(exams || [])
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableExams()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">User Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Available Exams</CardTitle>
        </CardHeader>
        <CardContent>
          {availableExams.length === 0 ? (
            <p>No exams available at the moment.</p>
          ) : (
            <ul className="space-y-2">
              {availableExams.map((exam) => (
                <li key={exam.id} className="flex justify-between items-center">
                  <span>{exam.title}</span>
                  <Button asChild>
                    <Link href={`/user/exams/${exam.id}/confirm`}>Take Exam</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}