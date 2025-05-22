import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        // Handle expired or invalid magic link
        return NextResponse.redirect(`${origin}/signup?error=expired`)
      }
      
      const { user } = data
      
      if (user) {
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('users')
          .select('selected_charity_id')
          .eq('id', user.id)
          .single()
        
        // If redirect URL is provided, use it
        if (redirect) {
          return NextResponse.redirect(`${origin}${redirect}`)
        }
        
        // If user hasn't selected a charity, send to signup flow
        if (!profile?.selected_charity_id) {
          return NextResponse.redirect(`${origin}/signup?verified=true`)
        }
        
        // Otherwise, send to game
        return NextResponse.redirect(`${origin}/game`)
      }
    } catch (error) {
      // Handle any other errors
      return NextResponse.redirect(`${origin}/signup?error=expired`)
    }
  }

  // If no code or user, redirect to home with error
  return NextResponse.redirect(`${origin}/signup?error=invalid`)
} 