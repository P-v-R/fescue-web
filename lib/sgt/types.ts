export type SgtTour = {
  tourId: number
  name: string
  start_date: string
  end_date: string
  active: 0 | 1
  teamTour: 0 | 1
}

export type SgtTournament = {
  tournamentId: number
  tourId: number
  name: string
  courseName: string
  start_date: string
  end_date: string
  status: 'In Progress' | 'Completed' | 'Upcoming' | string
  tourType: string
}

export type SgtStandingsEntry = {
  position: number | string
  user_name: string
  user_has_avatar: string | null
  hcp: number
  events: number
  first: number
  top5: number
  top10: number
  points: number
  country_code: string
}

export type SgtScorecard = {
  registrationId: number
  tournamentId: number
  playerId: number
  player_name: string
  hcp_index: number
  round: number
  activeHole: number
  total_gross: number
  toPar_gross: number
  total_net: number
  toPar_net: number
  out_gross: number
  in_gross: number
  out_net: number
  in_net: number
  courseName: string
  user_has_avatar: string | null
  country_code: string
}

// Aggregated leaderboard row (all rounds for one player)
export type SgtLeaderboardRow = {
  position: number
  player_name: string
  user_has_avatar: string | null
  hcp_index: number
  rounds: { round: number; total_gross: number; total_net: number; toPar_gross: number; toPar_net: number }[]
  total_gross: number
  total_net: number
  toPar_gross: number
  toPar_net: number
}
