export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          selected_charity_id: string | null
          credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          selected_charity_id?: string | null
          credits?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          selected_charity_id?: string | null
          credits?: number
          created_at?: string
          updated_at?: string
        }
      }
      charities: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          approved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo_url?: string | null
          approved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          approved?: boolean
          created_at?: string
        }
      }
      global_state: {
        Row: {
          id: number
          pot_total_cents: number
          last_updated: string
        }
        Insert: {
          id?: number
          pot_total_cents?: number
          last_updated?: string
        }
        Update: {
          id?: number
          pot_total_cents?: number
          last_updated?: string
        }
      }
      spins: {
        Row: {
          id: string
          user_id: string
          bet_amount: number
          result_grid: any
          won: boolean
          pot_amount_won: number
          charity_id: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          bet_amount: number
          result_grid: any
          won?: boolean
          pot_amount_won?: number
          charity_id?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          bet_amount?: number
          result_grid?: any
          won?: boolean
          pot_amount_won?: number
          charity_id?: string | null
          timestamp?: string
        }
      }
      donations: {
        Row: {
          id: string
          user_id: string
          charity_id: string
          amount_cents: number
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          charity_id: string
          amount_cents: number
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          charity_id?: string
          amount_cents?: number
          timestamp?: string
        }
      }
      credit_purchases: {
        Row: {
          id: string
          user_id: string
          stripe_payment_intent_id: string | null
          credits_purchased: number
          amount_paid_cents: number
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_payment_intent_id?: string | null
          credits_purchased: number
          amount_paid_cents: number
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_payment_intent_id?: string | null
          credits_purchased?: number
          amount_paid_cents?: number
          timestamp?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
} 