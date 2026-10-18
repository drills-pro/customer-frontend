/** Options and helpers shared by the account pages. The data comes from the API. */

export const accountRoles = ['ML Engineer', 'Data Scientist', 'Admin'] as const
export type AccountRole = (typeof accountRoles)[number]

export type AccountProfile = {
  fullName: string
  username: string
  email: string
  role: AccountRole
  bio: string
}

/** The roles the account's Team page can invite someone as. */
export type TeamRole = 'Admin' | 'Member'

/** "light" → "Light". */
export function themeLabel(theme: string) {
  return theme.charAt(0).toUpperCase() + theme.slice(1)
}
