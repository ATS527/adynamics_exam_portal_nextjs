'use client'

import Link from 'next/link'
import { useParams,useRouter } from 'next/navigation'
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const Guidence = () => {
    const [confirm, setConfirm] = useState(true)
    const params = useParams()
    const router = useRouter()
    
  return (
    <>
        <main className='w-full flex flex-col items-center justify-center'>
            <div className='flex flex-col gap-4 w-full px-4 py-4 xl:max-w-7xl'>
                <h1 className='text-2xl font-bold'>Exam Subject</h1>
                <div>
                    <h3 className="text-xl font-semibold mb-1">
                        Guidlines
                    </h3>
                    <p>
                        Instructions goes here
                    </p>
                </div>
                <div className='flex items-start justify-start gap-2'>
                    <Checkbox className='checked:bg-main' id="terms" onCheckedChange={()=>setConfirm(!confirm)} />
                    <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 sm:w-1/2"
                    >
                        I have thoroughly reviewed all the instructions, and I'm ready to proceed with answering my test.
                    </label>
                </div>
                <div className='flex items-center justify-start gap-2'>
                    <Link href={`/user/exams/${params.id}`}>
                        <Button variant={"outline"}>
                            Cancel
                        </Button>
                    </Link>
                    <Button className='disabled:cursor-not-allowed' disabled={confirm} onClick={()=>router.push(`/user/exams/${params.id}/take`)}>
                        Start exam
                    </Button>
                </div>
            </div>
        </main>
    </>
  )
}

export default Guidence