import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Question } from '@/types/questions'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  try {
    const { data: question, error } = await supabase
      .from('questions')
      .select('*, options(*)')
      .eq('id', params.questionId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    return NextResponse.json(question)
  } catch (error) {
    console.error('Error in GET /api/questions/[questionId]:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  try {
    const updateData: Question = await request.json()
    const { options, ...questionData } = updateData

    // Call the stored procedure
    const { data, error: transactionError } = await supabase.rpc('update_question_with_options', {
      p_question_id: params.questionId,
      p_question_data: questionData,
      p_options: options || []
    })

    if (transactionError) {
      console.error('Transaction error:', transactionError)
      return NextResponse.json({ error: transactionError.message }, { status: 500 })
    }

    // Return the updated question data
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/questions/[questionId]:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  try {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', params.questionId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Question deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/questions/[questionId]:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
