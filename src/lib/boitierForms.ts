import { rawCreateSite } from '@/api/rawBackend'
import type { BackendSite } from '@/types/backend'

export interface SiteChoice {
  siteId: string
  newName: string
  newLocation: string
}

export const EMPTY_SITE_CHOICE: SiteChoice = { siteId: '', newName: '', newLocation: '' }

/** « XXXXXXXX » → « XXXX XXXX » : plus facile à recopier sur le boîtier. */
export function groupCode(code: string): string {
  return code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4)}` : code
}

export function siteChoiceReady(sites: BackendSite[], value: SiteChoice): boolean {
  return sites.length > 0 || (value.newName.trim().length > 0 && value.newLocation.trim().length > 0)
}

export async function resolveSiteId(sites: BackendSite[], value: SiteChoice): Promise<string> {
  if (sites.length > 0) return value.siteId || sites[0].id
  return (
    await rawCreateSite({
      nom: value.newName.trim(),
      localisation: value.newLocation.trim(),
    })
  ).id
}
