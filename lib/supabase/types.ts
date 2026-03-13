export type Member = {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  phone: string | null
  discord: string | null
  is_active: boolean
  is_admin: boolean
  created_at: string
}

export type Invite = {
  id: string
  email: string
  name: string | null
  token: string
  invited_by: string | null
  sent_at: string
  accepted_at: string | null
  expires_at: string
}

export type Bay = {
  id: string
  name: string
  is_active: boolean
}

export type BookingGuest = {
  name: string
  email: string
}

export type Booking = {
  id: string
  member_id: string
  bay_id: string
  start_time: string
  duration_minutes: 60 | 90 | 120
  end_time: string
  guests: BookingGuest[]
  cancelled_at: string | null
  created_at: string
}

export type MembershipRequest = {
  id: string
  full_name: string
  email: string
  phone: string | null
  referral_source: string | null
  message: string | null
  status: 'pending' | 'contacted' | 'invited' | 'declined' | 'onboarded'
  created_at: string
}

export type NewBooking = {
  member_id: string
  bay_id: string
  start_time: string
  duration_minutes: 60 | 90 | 120
  guests: BookingGuest[]
}

export type NewMember = {
  email: string
  full_name: string
  password: string
}

// Booking with bay name joined (from getMemberBookings)
export type BookingWithBay = Booking & {
  bays: { name: string } | null
}
