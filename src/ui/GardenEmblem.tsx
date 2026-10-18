import type { GardenEmblem as Emblem, GardenMotif } from '../core/content'

/** Simple line motifs on a 24 × 24 grid, drawn in cream on the garden's colour. */
const MOTIFS: Record<GardenMotif, string[]> = {
  // A layered black pine.
  pine: ['M12 20V9', 'M6 12h12', 'M7.5 9h9', 'M9 6h6'],
  // Two bamboo canes with nodes and a leaf.
  bamboo: ['M9 20V4', 'M15 20V6', 'M8 9h2M8 15h2M14 11h2M14 17h2', 'M15 8c2-1 4-1 5 0'],
  // A drop above a ripple.
  water: [
    'M12 4c3 4 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5 5-9z',
    'M4 20c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 4-1.5',
  ],
  // A stone arrangement.
  stones: [
    'M4 18c0-3 2.5-5 6-5s6 2 6 5z',
    'M14 18c0-2 1.5-3.5 3.5-3.5S21 16 21 18z',
    'M9 10c0-2 1.5-3 3-3s3 1 3 3',
  ],
  // A fern frond.
  fern: [
    'M7 20C9 13 12 8 18 4',
    'M9.5 15l-3-1M11 12.5l-3-2M13 10l-2.5-2.5M15 7.5l-1.5-2.5',
    'M10 15.5l2 2.5M12 12.5l2.5 2M14 10l3 1',
  ],
  // A meadow flower.
  flower: [
    'M12 20v-8',
    'M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    'M12 8V5M12 12l2 2M12 12l-2 2M14 10h3M10 10H7',
    'M12 17c2-2 4-2 5-1',
  ],
  // Flowing stream lines.
  stream: ['M4 7c3-2 5 2 8 0s5-2 8 0', 'M4 12c3-2 5 2 8 0s5-2 8 0', 'M4 17c3-2 5 2 8 0s5-2 8 0'],
  // A five-petalled blossom.
  blossom: [
    'M12 10.5c-1.5-2-1.5-4.5 0-6 1.5 1.5 1.5 4 0 6z',
    'M13.4 11.5c2.3-1 4.7-.4 5.5 1.5-2 .8-4.2.4-5.5-1.5z',
    'M12.9 13.2c1 2.3.6 4.7-1 5.8-1-1.9-.7-4.2 1-5.8z',
    'M11.1 13.2c-1 2.3-.6 4.7 1 5.8',
    'M10.6 11.5c-2.3-1-4.7-.4-5.5 1.5 2 .8 4.2.4 5.5-1.5z',
  ],
  // A broad old tree.
  canopy: [
    'M12 20v-6',
    'M12 14l-3-2M12 15l3-2',
    'M5 11a7 5 0 0 1 14 0c0 2-2 3-4 3H9c-2 0-4-1-4-3z',
  ],
  // Reeds and cattails.
  reeds: [
    'M7 20V8',
    'M12 20V5',
    'M17 20V9',
    'M12 5v4',
    'M7 8c-2-1-3-3-3-4',
    'M17 9c2-1 3-3 3-4',
    'M4 20h16',
  ],
  // A circle in four quarters for the turning year.
  seasons: [
    'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z',
    'M12 4v16M4 12h16',
    'M8 8l1 1M16 8l-1 1M8 16l1-1M16 16l-1-1',
  ],
  // A pavilion roof on posts.
  pavilion: ['M3 10c3-1 6-3 9-6 3 3 6 5 9 6', 'M6 10v9M18 10v9', 'M5 14h14', 'M4 19h16'],
}

interface Props {
  emblem: Emblem
  /** The garden's name, for screen readers; omit when the name is shown beside it. */
  label?: string
  size?: number
}

/** A garden's emblem: its motif on its colour, in a small round badge. */
export function GardenEmblem({ emblem, label, size = 32 }: Props) {
  return (
    <svg
      className="garden-emblem"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-motif={emblem.motif}
    >
      <circle cx="12" cy="12" r="12" fill={emblem.colour} />
      <g
        transform="translate(2.4 2.4) scale(0.8)"
        fill="none"
        stroke="#faf7ee"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {MOTIFS[emblem.motif].map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  )
}
