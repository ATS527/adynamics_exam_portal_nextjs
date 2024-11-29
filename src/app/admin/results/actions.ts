'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getUserEmails(userIds: string[]) {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error('Error fetching users:', error)
      return {}
    }

    // Create a map of user IDs to emails
    const emailMap = users.reduce((acc: Record<string, string>, user: any) => {
      if (userIds.includes(user.id)) {
        acc[user.id] = user.email
      }
      return acc
    }, {})

    return emailMap
  } catch (error) {
    console.error('Error in getUserEmails:', error)
    return {}
  }
}
