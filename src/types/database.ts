export type UserRole = 'admin' | 'staff';
export type MemberStatus = 'active' | 'inactive';
export type PaymentMethod = 'cash' | 'online';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type Profile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  created_at: string;
};

export type Member = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  gender: Gender;
  join_date: string;
  membership_type: string;
  membership_start_date: string;
  membership_expiry_date: string;
  emergency_contact: string | null;
  notes: string | null;
  status: MemberStatus;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type MembershipPlan = {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  is_active: boolean;
  created_at: string;
};

export type Payment = {
  id: string;
  member_id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  added_by: string | null;
  notes: string | null;
  receipt_id: string;
  screenshot_url: string | null;
  transaction_id: string | null;
  utr_number: string | null;
  upi_id: string | null;
  sender_name: string | null;
  created_at: string;
  members?: Pick<Member, 'full_name' | 'phone'> | null;
  profiles?: Pick<Profile, 'full_name'> | null;
};

export type Attendance = {
  id: string;
  member_id: string;
  check_in_at: string;
  marked_by: string | null;
  notes: string | null;
  members?: Pick<Member, 'full_name' | 'phone'> | null;
};

export type PaymentScreenshot = {
  id: string;
  payment_id: string | null;
  member_id: string | null;
  storage_path: string;
  ocr_text: string | null;
  created_at: string;
};

export type GymSettings = {
  id: string;
  gym_name: string;
  logo_url: string | null;
  theme: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      members: {
        Row: Member;
        Insert: Omit<Member, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Member, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Member>;
      };
      membership_plans: {
        Row: MembershipPlan;
        Insert: Omit<MembershipPlan, 'id' | 'created_at'> & Partial<Pick<MembershipPlan, 'id' | 'created_at'>>;
        Update: Partial<MembershipPlan>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at' | 'members' | 'profiles'> & Partial<Pick<Payment, 'id' | 'created_at'>>;
        Update: Partial<Payment>;
      };
      attendance: {
        Row: Attendance;
        Insert: Omit<Attendance, 'id' | 'members'> & Partial<Pick<Attendance, 'id'>>;
        Update: Partial<Attendance>;
      };
      payment_screenshots: {
        Row: PaymentScreenshot;
        Insert: Omit<PaymentScreenshot, 'id' | 'created_at'> & Partial<Pick<PaymentScreenshot, 'id' | 'created_at'>>;
        Update: Partial<PaymentScreenshot>;
      };
      gym_settings: {
        Row: GymSettings;
        Insert: Partial<GymSettings>;
        Update: Partial<GymSettings>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      member_status: MemberStatus;
      payment_method: PaymentMethod;
      gender_type: Gender;
    };
  };
};
