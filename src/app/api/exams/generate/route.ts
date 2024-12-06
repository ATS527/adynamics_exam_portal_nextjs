import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { generateQuestion } from '@/lib/question-generator'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { questionBankId } = await request.json()
    
    if (!questionBankId) {
      return NextResponse.json(
        { error: 'Question bank ID is required' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Fetch all questions from the question bank
    const { data: questions, error: fetchError } = await supabase
      .from('questions')
      .select('*, options(*)')
      .eq('question_bank_id', questionBankId)

    if (fetchError) {
      console.error('Error fetching questions:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      )
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found in the question bank' },
        { status: 404 }
      )
    }

    // Generate questions based on their types and no_of_times
    const generatedQuestions = questions.flatMap(question => {
      const timesToGenerate = question.no_of_times || 1
      return Array(timesToGenerate)
        .fill(null)
        .map(() => generateQuestion(question))
    })

    // Shuffle the questions
    const shuffledQuestions = generatedQuestions.sort(() => Math.random() - 0.5)

    return NextResponse.json({ questions: shuffledQuestions })
  } catch (error) {
    console.error('Error generating exam:', error)
    return NextResponse.json(
      { error: 'Failed to generate exam' },
      { status: 500 }
    )
  }
}
