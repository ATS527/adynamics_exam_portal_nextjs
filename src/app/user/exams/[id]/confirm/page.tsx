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
            <div className='flex flex-col gap-4 w-full px-4 py-4 xl:max-w-5xl'>
                <h1 className='text-2xl my-3 font-bold'>Exam Subject</h1>
                <div>
                    <h3 className="text-xl font-semibold mb-2">
                        General Instructions
                    </h3>
                    <p>
                        <ul className='list-disc flex flex-col gap-3 ml-2'>
                            <li>
                                The time remaining to complete the exam is displayed on your screen and at the top-right corner of your screen. When the time runs out, your exam ends.
                            </li>
                            <li>
                                The Questions palette at the right of the screen has one of the following statuses for each of the numbered questions
                                <ul className='mt-3 ml-5'>
                                    <li className='flex gap-2 items-start justify-start mb-2'>
                                        <Button className='bg-main'>
                                            1
                                        </Button>
                                        <span>attempted</span>
                                    </li>
                                    <li className='flex gap-2 items-start justify-start mb-2'>
                                        <Button variant={"secondary"} className='hover:none'>
                                            1
                                        </Button>
                                        <span>unattempted</span>
                                    </li>
                                    <li className='flex gap-2 items-start justify-start mb-2'>
                                        <Button variant={"outline"}>
                                            1
                                        </Button>
                                        <span>unvisited question</span>
                                    </li>
                                </ul>
                            </li>
                            <li>
                                To answer a question, click the number on the question palette at the right of your screen or at the top of your screen (if you are in phone mode). You will be taken to that numbered question. 
                            </li>
                            <li>
                                To read the entire paper, click on the All Questions button.
                            </li>
                            <li>
                                Change your responses by selecting a question and then clicking on the new answer choice followed by a click on <span className='font-bold'>Confirm</span>
                            </li>
                            <li>
                                Click <span className='font-bold'>Reset</span> to clear your selected response.
                            </li>
                            <li>
                            <span className='font-bold'>Next</span> and <span className='font-bold'>Previous</span> buttons are provided so that you may navigate the test. 
                            </li>
                        </ul>
                    </p>
                </div>
                <div className='flex items-start justify-start gap-2 mt-3'>
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