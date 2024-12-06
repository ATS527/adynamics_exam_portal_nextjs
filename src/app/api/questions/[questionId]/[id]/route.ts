import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*, options(*)')
      .eq('id', params.questionId)
      .single()

    if (questionError) throw questionError

    return NextResponse.json(question)
  } catch (error: any) {
    console.error('Error fetching question:', error)
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    const body = await request.json()
    const { question_text, options } = body

    // Update question
    const { error: questionError } = await supabase
      .from('questions')
      .update({
        question_text,
        question_type: 'static'
      })
      .eq('id', params.questionId)

    if (questionError) throw questionError

    // Update options if provided
    if (options && Array.isArray(options)) {
      // First delete existing options
      const { error: deleteError } = await supabase
        .from('options')
        .delete()
        .eq('question_id', params.questionId)

      if (deleteError) throw deleteError

      // Then insert new options
      const { error: optionsError } = await supabase
        .from('options')
        .insert(
          options.map((opt: any) => ({
            question_id: params.questionId,
            option_text: opt.option_text,
            is_correct: opt.is_correct
          }))
        )

      if (optionsError) throw optionsError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating question:', error)
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    // Delete options first (due to foreign key constraint)
    const { error: optionsError } = await supabase
      .from('options')
      .delete()
      .eq('question_id', params.questionId)

    if (optionsError) throw optionsError

    // Then delete the question
    const { error: questionError } = await supabase
      .from('questions')
      .delete()
      .eq('id', params.questionId)

    if (questionError) throw questionError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting question:', error)
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    )
  }
}
