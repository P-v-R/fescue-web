import { redirect } from 'next/navigation'

// Booking flow lives on the main reservations grid — redirect there
export default function NewReservationPage() {
  redirect('/reservations')
}
