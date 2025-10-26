export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          guest_email: string
          guest_name: string
          guest_phone: string
          id: string
          notes: string | null
          number_of_guests: number
          property_id: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          guest_email: string
          guest_name: string
          guest_phone: string
          id?: string
          notes?: string | null
          number_of_guests: number
          property_id: string
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          guest_email?: string
          guest_name?: string
          guest_phone?: string
          id?: string
          notes?: string | null
          number_of_guests?: number
          property_id?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          about: string | null
          approved_at: string | null
          approved_by: string | null
          business_name: string | null
          created_at: string
          id: string
          id_passport_number: string | null
          location: string
          status: Database["public"]["Enums"]["partner_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          about?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_name?: string | null
          created_at?: string
          id?: string
          id_passport_number?: string | null
          location: string
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          about?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_name?: string | null
          created_at?: string
          id?: string
          id_passport_number?: string | null
          location?: string
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          amenities: string[] | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string
          featured_image: string
          google_maps_link: string | null
          id: string
          is_active: boolean
          location: string
          max_guests_per_unit: number
          number_of_units: number
          partner_id: string
          price_per_night: number
          property_name: string
          property_type: Database["public"]["Enums"]["property_type"]
          terms_policies: string | null
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description: string
          featured_image: string
          google_maps_link?: string | null
          id?: string
          is_active?: boolean
          location: string
          max_guests_per_unit: number
          number_of_units?: number
          partner_id: string
          price_per_night: number
          property_name: string
          property_type: Database["public"]["Enums"]["property_type"]
          terms_policies?: string | null
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string
          featured_image?: string
          google_maps_link?: string | null
          id?: string
          is_active?: boolean
          location?: string
          max_guests_per_unit?: number
          number_of_units?: number
          partner_id?: string
          price_per_night?: number
          property_name?: string
          property_type?: Database["public"]["Enums"]["property_type"]
          terms_policies?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          property_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          property_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      referrers: {
        Row: {
          id: string
          user_id: string
          referral_code: string
          business_name: string | null
          contact_phone: string | null
          contact_email: string | null
          status: Database["public"]["Enums"]["partner_status"]
          approved_at: string | null
          approved_by: string | null
          commission_rate: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          referral_code: string
          business_name?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          approved_at?: string | null
          approved_by?: string | null
          commission_rate?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          referral_code?: string
          business_name?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          approved_at?: string | null
          approved_by?: string | null
          commission_rate?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          partner_id: string
          referred_at: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          partner_id: string
          referred_at?: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          partner_id?: string
          referred_at?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          id: string
          referrer_id: string
          booking_id: string
          partner_id: string
          property_id: string
          booking_amount: string
          commission_rate: string
          commission_amount: string
          status: string
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          booking_id: string
          partner_id: string
          property_id: string
          booking_amount: string
          commission_rate: string
          commission_amount: string
          status?: string
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          booking_id?: string
          partner_id?: string
          property_id?: string
          booking_amount?: string
          commission_rate?: string
          commission_amount?: string
          status?: string
          paid_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "partner" | "user" | "referrer"
      partner_status: "pending" | "active" | "rejected" | "suspended"
      property_type:
        | "apartment"
        | "cottage"
        | "villa"
        | "guesthouse"
        | "hostel"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "partner", "user", "referrer"],
      partner_status: ["pending", "active", "rejected", "suspended"],
      property_type: [
        "apartment",
        "cottage",
        "villa",
        "guesthouse",
        "hostel",
        "other",
      ],
    },
  },
} as const
