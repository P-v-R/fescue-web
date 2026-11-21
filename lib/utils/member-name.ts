// Short display name for booking grids: "Marcus Thompson" → "Marcus T."
export function formatMemberName(fullName: string | null | undefined): string {
  if (!fullName) return 'Member'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}
