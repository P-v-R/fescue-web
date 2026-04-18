export type Member = {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  phone: string | null
  discord: string | null
  sgt_username: string | null
  is_active: boolean
  is_admin: boolean
  member_since: number | null
  created_at: string
  email_booking_confirmation: boolean
  high_contrast: boolean
  dark_mode: boolean
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
  email?: string
}

export type Booking = {
  id: string
  member_id: string
  bay_id: string
  start_time: string
  duration_minutes: number
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
  zip_code: string | null
  profession: string | null
  referral_source: string | null
  has_membership_org: boolean | null
  membership_org_names: string | null
  message: string | null
  sgt_username: string | null
  status: 'pending' | 'contacted' | 'invited' | 'declined' | 'onboarded'
  created_at: string
}

export type NewBooking = {
  member_id: string
  bay_id: string
  start_time: string
  duration_minutes: number
  guests: BookingGuest[]
}

export type NewMember = {
  email: string
  full_name: string
  password: string
}

export type Event = {
  id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string | null
  location: string | null
  image_url: string | null
  rsvp_enabled: boolean
  created_by: string | null
  created_at: string
}

export type EventRsvp = {
  id: string
  event_id: string
  member_id: string
  status: 'going' | 'not_going'
  created_at: string
}

export type EventRsvpWithMember = EventRsvp & {
  members: { full_name: string; email: string } | null
}

export type JoinRequest = {
  id: string
  full_name: string
  email: string
  phone: string | null
  discord: string | null
  // encrypted_password is intentionally omitted — never sent to the client
  status: 'pending' | 'approved' | 'declined'
  reviewed_at: string | null
  created_at: string
}

// Booking with bay name joined (from getMemberBookings)
export type BookingWithBay = Booking & {
  bays: { name: string } | null
}

// Booking with member name joined (for the reservations grid)
export type BookingWithMember = Booking & {
  members: { full_name: string } | null
}
