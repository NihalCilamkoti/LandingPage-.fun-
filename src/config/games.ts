export interface GameControlInfo {
  action: string;
  desktop: string;
  mobile: string;
}

export interface GameDefinition {
  id: 'chase' | 'surge' | 'jump' | 'snake' | 'glider' | 'stars';
  title: string;
  subtitle: string;
  tagline: string;
  badge: string;
  category: string;
  description: string;
  instructions: string[];
  controls: GameControlInfo[];
}

export const GAME_SEQUENCE: GameDefinition[] = [
  {
    id: 'chase',
    title: 'EnthiosHub Chase',
    subtitle: 'Campus 3D Runner',
    tagline: 'Sprint past hurdles, slide under laser gates & grab rare event coins!',
    badge: '3D Runner',
    category: 'Endless 3D Runner',
    description:
      'Pilot the EnthiosHub campus runner across 3 dynamic lanes. Jump over hurdles, slide under laser hall barriers, and collect event coins & power-ups.',
    instructions: [
      'Switch between 3 lanes to avoid roadblocks and collect tokens.',
      'Jump over low ground hurdles and construction barriers.',
      'Slide under laser barriers and overhead gates.',
      'Grab Coin Magnets, Energy Shields, and Overclock Boosts.',
    ],
    controls: [
      { action: 'Change Lane', desktop: 'Left / Right or A / D', mobile: 'Swipe Left / Right or Tap ◀ ▶' },
      { action: 'Jump', desktop: 'Up Arrow / W / Spacebar', mobile: 'Swipe Up or Tap ▲ JUMP' },
      { action: 'Slide', desktop: 'Down Arrow / S', mobile: 'Swipe Down or Tap ▼ SLIDE' },
    ],
  },
  {
    id: 'surge',
    title: 'Cyber Grid Surge',
    subtitle: 'Cyber Kinetic Highway',
    tagline: 'Fly an ultra-fast data glider along the cyber matrix highway!',
    badge: 'Kinetic Arcade',
    category: 'Highway Reflex',
    description:
      'Steer your packet glider along the flat cyber grid. Navigate through open firewall slots while gathering bandwidth orbs and quantum multipliers.',
    instructions: [
      'Guide your data glider smoothly across the cyber grid.',
      'Fly through open slots in firewall barriers to survive.',
      'Collect green bandwidth orbs for bonus points and boost streaks.',
      'Collect quantum keys to activate double-score overclock mode.',
    ],
    controls: [
      { action: 'Steer Glider', desktop: 'Arrow Keys or W / A / S / D', mobile: 'Touch Drag or On-Screen D-Pad' },
    ],
  },
  {
    id: 'jump',
    title: 'Campus Gravity Jumper',
    subtitle: 'Sky Altitude Bouncer',
    tagline: 'Bounce upward across sky platforms and reach the campus clouds!',
    badge: 'Gravity Bouncer',
    category: 'Vertical Platformer',
    description:
      'Bounce upward on campus platforms. Hit spring pads for high altitude launches and collect gold event coins as you climb into the clouds.',
    instructions: [
      'Steer left and right to land on platforms.',
      'Bounce automatically upon landing.',
      'Hit gold spring pads for massive super launches.',
      'Collect coins and avoid falling off the bottom.',
    ],
    controls: [
      { action: 'Steer', desktop: 'Left / Right or A / D', mobile: 'Tap Left / Right sides of screen' },
    ],
  },
  {
    id: 'snake',
    title: 'Neon Grid Crawler',
    subtitle: 'Cyber Matrix Snake',
    tagline: 'Guide the glowing packet stream to consume data nodes and grow!',
    badge: 'Matrix Arcade',
    category: 'Grid Arcade',
    description:
      'Guide your cyber stream across the matrix! Consume green bandwidth nodes and gold event tokens to grow and climb the leaderboard.',
    instructions: [
      'Steer your data stream around the grid matrix.',
      'Consume green nodes to extend your stream length.',
      'Grab golden bonus chips for high multiplier points.',
      'Avoid colliding with the matrix perimeter or your own stream.',
    ],
    controls: [
      { action: 'Change Direction', desktop: 'Arrow Keys or W / A / S / D', mobile: 'Touch D-Pad or Swipe' },
    ],
  },
  {
    id: 'glider',
    title: 'Flappy Bot: Campus Flight',
    subtitle: 'Drone Archway Navigation',
    tagline: 'Flap thrusters to navigate the drone through campus archways!',
    badge: 'Drone Flight',
    category: 'Tap Flight',
    description:
      'Pilot the drone through campus archways and collect golden tokens! Tap to flap your thrusters and maintain altitude.',
    instructions: [
      'Tap or press Spacebar to flap thrusters.',
      'Maintain altitude and fly through gate openings.',
      'Collect golden tokens centered inside each gate.',
      'Avoid colliding with the archway pillars or ground.',
    ],
    controls: [
      { action: 'Flap Thrusters', desktop: 'Spacebar / Up Arrow / Click', mobile: 'Tap anywhere on screen' },
    ],
  },
  {
    id: 'stars',
    title: 'Star Collector',
    subtitle: 'Campus Energy Arena',
    tagline: 'Gather glowing event stars before the timer expires in the campus arena!',
    badge: 'Playhouse Classic',
    category: 'Arena Agility',
    description:
      'The original restored EnthiosHub agility classic! Navigate your energy orb around the field, vacuum up event stars, and evade patrolling glitch anomalies.',
    instructions: [
      'Navigate the arena using smooth directional movement.',
      'Absorb golden sparks and event stars to increase your score.',
      'Maintain unbroken pickup streaks for score multipliers.',
      'Avoid roving red glitch orbs that drain your remaining time.',
    ],
    controls: [
      { action: 'Move Orb', desktop: 'Arrow Keys or A / W / S / D', mobile: 'Touch / Drag Joystick' },
    ],
  },
];
