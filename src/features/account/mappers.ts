/** Turns account rows from the API into what the pages render. */
import { initialsOf } from '@/features/organizations/mappers'
import type { ApiUser } from './api'

export type CurrentUser = {
  fullName: string
  username: string
  email: string
  /** Job title, e.g. `ML Engineer`. */
  role: string
  bio: string
  initials: string
  color: string
}

export function toCurrentUser(row: ApiUser): CurrentUser {
  return {
    fullName: row.full_name,
    username: row.username,
    email: row.email,
    role: row.job_role,
    bio: row.bio,
    initials: initialsOf(row.full_name),
    color: row.color,
  }
}
