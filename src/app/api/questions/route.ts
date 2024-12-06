import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question_text, question_bank_id, options } = body

    // Create question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        question_text,
        question_type: 'static',
        question_bank_id
      })
      .select()
      .single()

    if (questionError) throw questionError

    // Insert options if provided
    if (options && Array.isArray(options)) {
      const { error: optionsError } = await supabase
        .from('options')
        .insert(
          options.map((opt: any) => ({
            question_id: question.id,
            option_text: opt.option_text,
            is_correct: opt.is_correct
          }))
        )

      if (optionsError) throw optionsError
    }

    return NextResponse.json(question)
  } catch (error: any) {
    console.error('Error creating question:', error)
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, question_text, options } = body

    // Update question
    const { error: questionError } = await supabase
      .from('questions')
      .update({
        question_text,
        question_type: 'static'
      })
      .eq('id', id)

    if (questionError) throw questionError

    // Update options if provided
    if (options && Array.isArray(options)) {
      // First delete existing options
      const { error: deleteError } = await supabase
        .from('options')
        .delete()
        .eq('question_id', id)

      if (deleteError) throw deleteError

      // Then insert new options
      const { error: optionsError } = await supabase
        .from('options')
        .insert(
          options.map((opt: any) => ({
            question_id: id,
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

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      )
    }

    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*, options(*)')
      .eq('id', id)
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
