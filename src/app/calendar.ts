// The real calendar for the seasons: the device's month, and a first guess at
// the player's hemisphere from its time zone. The player can change the
// hemisphere in Settings.

import type { Hemisphere } from '../core/state'

/** Time zone prefixes south of the equator (or mostly so). */
const SOUTHERN_ZONES = [
  'Australia/',
  'Antarctica/',
  'Pacific/Auckland',
  'Pacific/Chatham',
  'Pacific/Fiji',
  'Pacific/Tongatapu',
  'Pacific/Apia',
  'Pacific/Noumea',
  'Pacific/Port_Moresby',
  'Pacific/Tahiti',
  'Pacific/Rarotonga',
  'Pacific/Easter',
  'America/Argentina/',
  'America/Buenos_Aires',
  'America/Santiago',
  'America/Punta_Arenas',
  'America/Sao_Paulo',
  'America/Montevideo',
  'America/Asuncion',
  'America/La_Paz',
  'America/Lima',
  'America/Campo_Grande',
  'America/Cuiaba',
  'America/Porto_Velho',
  'America/Rio_Branco',
  'America/Maceio',
  'America/Recife',
  'America/Bahia',
  'Africa/Johannesburg',
  'Africa/Maputo',
  'Africa/Harare',
  'Africa/Lusaka',
  'Africa/Windhoek',
  'Africa/Gaborone',
  'Africa/Maseru',
  'Africa/Mbabane',
  'Africa/Blantyre',
  'Africa/Lubumbashi',
  'Africa/Luanda',
  'Africa/Dar_es_Salaam',
  'Indian/Antananarivo',
  'Indian/Mauritius',
  'Indian/Reunion',
  'Indian/Mayotte',
  'Indian/Comoro',
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
  'Asia/Dili',
]

/** The hemisphere for an IANA time zone name; northern unless known to be southern. */
export function hemisphereOfZone(zone: string | undefined): Hemisphere {
  if (!zone) return 'north'
  return SOUTHERN_ZONES.some((z) => (z.endsWith('/') ? zone.startsWith(z) : zone === z))
    ? 'south'
    : 'north'
}

export function guessHemisphere(): Hemisphere {
  try {
    return hemisphereOfZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  } catch {
    return 'north'
  }
}

/** The current month on this device, 0 = January. */
export function currentMonth(now: number = Date.now()): number {
  return new Date(now).getMonth()
}
