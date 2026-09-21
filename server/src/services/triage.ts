import { db } from '../db/connection.js';
import type { TriageLevel, TriageAutoRule, TriageVitals } from '../types.js';

interface LevelRow {
  id: string;
  code: TriageLevel['code'];
  name: string;
  max_wait_minutes: number;
  description: string | null;
  color: string;
  active: number;
  ord: number;
}

function toLevel(r: LevelRow): TriageLevel {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    maxWaitMinutes: r.max_wait_minutes,
    description: r.description ?? '',
    color: r.color,
    active: Boolean(r.active),
    order: r.ord,
  };
}

interface RuleRow {
  id: string;
  level_code: string;
  field: TriageAutoRule['field'];
  min_value: number | null;
  max_value: number | null;
}

function toRule(r: RuleRow): TriageAutoRule {
  return { id: r.id, levelCode: r.level_code as TriageAutoRule['levelCode'], field: r.field, min: r.min_value, max: r.max_value };
}

export function classifyTriage(vitals: TriageVitals): { level: TriageLevel; matched: TriageAutoRule[] } | null {
  const levels = (db.prepare('SELECT * FROM triage_levels WHERE active = 1').all() as LevelRow[]).map(toLevel);
  const rules = (db.prepare('SELECT * FROM triage_auto_rules').all() as RuleRow[]).map(toRule);
  const active = new Set(levels.map((l) => l.code));

  const matches: { level: TriageLevel; rule: TriageAutoRule }[] = [];
  for (const rule of rules) {
    const level = levels.find((l) => l.code === rule.levelCode);
    if (!level || !active.has(rule.levelCode)) continue;
    const key = rule.field;
    const value = vitals[key];
    if (value === null || value === undefined) continue;
    const aboveMin = rule.min === null || value >= rule.min;
    const belowMax = rule.max === null || value <= rule.max;
    if (aboveMin && belowMax) matches.push({ level, rule });
  }
  if (matches.length === 0) return null;
  const best = matches.sort((a, b) => b.level.order - a.level.order)[0];
  return { level: best.level, matched: matches.map((m) => m.rule) };
}