// Each stat: label + a function that returns the current (often random) value.
// HUD picks N, rotates them every few seconds, and re-ticks values in between.

const rand = (n) => Math.floor(Math.random() * n)
const bar = (pct, width = 10) => {
  const filled = Math.round((pct / 100) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled) + ` ${pct}%`
}
const pick = (arr) => arr[rand(arr.length)]

export const statPool = [
  // — dev culture —
  { label: 'DAYS SINCE BUG IN PROD', value: () => 0 },
  { label: 'BUG PROBABILITY', value: () => `${88 + rand(12)}%` },
  { label: 'COFFEE LEVEL', value: () => bar(20 + rand(80)) },
  { label: 'CAFFEINE OVERDRIVE', value: () => bar(70 + rand(30)) },
  { label: 'STACKOVERFLOW QUERIES', value: () => 200 + rand(800) },
  { label: 'UNREAD SLACK', value: () => 47 + rand(60) },
  { label: 'TODO COMMENTS', value: () => 100 + rand(400) },
  { label: 'MERGE CONFLICTS', value: () => (rand(4) === 0 ? '∞' : rand(12)) },
  { label: 'CTRL+S TODAY', value: () => 200 + rand(900) },
  { label: 'CTRL+Z STREAK', value: () => rand(60) },
  { label: 'CONFIDENCE', value: () => `${rand(101)}%` },
  { label: 'COMMITS PUSHED TO MAIN', value: () => rand(40) },
  { label: 'TESTS PASSING', value: () => `${rand(40)}/${60 + rand(60)}` },
  { label: 'PROD UPTIME', value: () => `${88 + rand(11)}.${rand(99).toString().padStart(2, '0')}%` },
  { label: 'TECHNICAL DEBT', value: () => '∞' },
  { label: 'TAB vs SPACE WARS', value: () => `${100 + rand(900)}` },
  { label: 'OPEN BROWSER TABS', value: () => 30 + rand(120) },
  { label: 'NPM AUDIT VULNS', value: () => 12 + rand(80) },
  { label: 'CHATGPT TOKENS BURNT', value: () => `${(rand(900) + 100) * 1000}` },
  { label: 'YOLO DEPLOYS', value: () => rand(7) },
  { label: 'ROLLBACKS QUEUED', value: () => rand(4) },
  { label: 'AI-GENERATED LINES', value: () => `${50 + rand(50)}%` },
  { label: 'IMPOSTOR SYNDROME', value: () => bar(40 + rand(60)) },
  { label: 'SLEEP DEBT (HRS)', value: () => 12 + rand(180) },
  { label: 'GIT BLAME HITS', value: () => rand(99) },
  { label: 'DELETED node_modules', value: () => rand(50) },

  // — vibe-coding / AI bro —
  { label: 'PROMPTS PER MINUTE', value: () => 8 + rand(80) },
  { label: 'PROMPT QUALITY', value: () => bar(rand(101)) },
  { label: 'COPILOT ACCEPT RATE', value: () => `${30 + rand(70)}%` },
  { label: 'HALLUCINATIONS/HR', value: () => 1 + rand(40) },
  { label: 'VIBE LEVEL', value: () => bar(60 + rand(40)) },
  { label: 'TAB-COMPLETION COMBO', value: () => `×${1 + rand(99)}` },
  { label: 'BRACES MATCHED', value: () => `${rand(100)}%` },

  // — game-like —
  { label: 'XP', value: () => `${1000 * (1 + rand(99))} / 999,999` },
  { label: 'LEVEL', value: () => `${rand(98) + 1}` },
  { label: 'HP', value: () => bar(10 + rand(90)) },
  { label: 'MANA', value: () => bar(rand(100)) },
  { label: 'ULT CHARGE', value: () => bar(rand(101)) },
  { label: 'COMBO', value: () => `×${2 + rand(99)}` },
  { label: 'CRIT RATE', value: () => `${rand(101)}%` },
  { label: 'KDA', value: () => `${rand(20)}/${rand(40)}/${rand(15)}` },
  { label: 'HIGH SCORE', value: () => `${1337 + rand(900000)}` },
  { label: 'STREAK', value: () => `${rand(99)} 🔥` },
  { label: 'LIVES', value: () => '♥'.repeat(1 + rand(3)).padEnd(3, '·') },
  { label: 'BUFFS ACTIVE', value: () => 1 + rand(7) },
  { label: 'DEBUFFS', value: () => rand(5) },
  { label: 'QUEST', value: () => pick(['write a test', 'merge main', 'fix the flake', 'kiss your colleague', 'ship it', 'silence linter']) },
  { label: 'LOOT DROPPED', value: () => pick(['+1 keyboard', 'rare commit', 'legendary PR', 'cursed YAML', 'epic stack trace']) },
  { label: 'ACHIEVEMENT', value: () => pick(['SHIP IT', 'NO TESTS', 'FRIDAY DEPLOY', 'MERGE MASTER', 'LGTM', '🚀']) },
  { label: 'BOSS HP', value: () => bar(10 + rand(90)) },
  { label: 'DUNGEON', value: () => pick(['legacy-codebase', 'webpack.config', 'CI/CD swamp', 'kubernetes cave']) },
  { label: 'SKILL POINTS', value: () => rand(20) },
  { label: 'RANK', value: () => pick(['BRONZE III', 'SILVER I', 'GOLD II', 'PLATINUM', 'DIAMOND', 'CHALLENGER', 'UNRANKED']) },
  { label: 'PING (ms)', value: () => 12 + rand(290) },
  { label: 'FPS', value: () => 23 + rand(120) },
]
