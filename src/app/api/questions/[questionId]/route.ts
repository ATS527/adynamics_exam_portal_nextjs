import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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
    const updateData = await request.json()

    // Update question
    const { error: questionError } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', params.questionId)

    if (questionError) {
      return NextResponse.json({ error: questionError.message }, { status: 500 })
    }

    // If it's a static question, handle options
    if (updateData.question_type === 'static') {
      const options = updateData.options || []
      
      // Delete removed options
      const existingOptionIds = options
        .filter((opt: any) => !opt.id.startsWith('new-'))
        .map((opt: any) => opt.id)

      if (existingOptionIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('options')
          .delete()
          .eq('question_id', params.questionId)
          .not('id', 'in', existingOptionIds)

        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }
      }

      // Update or create options
      for (const option of options) {
        if (option.id.startsWith('new-')) {
          // Create new option
          const { error } = await supabase
            .from('options')
            .insert({
              option_text: option.option_text,
              is_correct: option.is_correct,
              question_id: params.questionId,
            })
          if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
          }
        } else {
          // Update existing option
          const { error } = await supabase
            .from('options')
            .update({
              option_text: option.option_text,
              is_correct: option.is_correct,
            })
            .eq('id', option.id)
          if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/questions/[questionId]:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
