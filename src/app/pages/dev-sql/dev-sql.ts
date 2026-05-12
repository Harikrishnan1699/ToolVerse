import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

const KEYWORDS = [
  'SELECT','FROM','WHERE','AND','OR','NOT','IN','LIKE','BETWEEN','IS NULL','IS NOT NULL',
  'GROUP BY','HAVING','ORDER BY','ASC','DESC','LIMIT','OFFSET',
  'INNER JOIN','LEFT JOIN','RIGHT JOIN','FULL JOIN','CROSS JOIN','JOIN','ON','USING',
  'INSERT INTO','VALUES','UPDATE','SET','DELETE FROM',
  'CREATE TABLE','CREATE INDEX','ALTER TABLE','DROP TABLE','DROP INDEX','ADD','RENAME',
  'PRIMARY KEY','FOREIGN KEY','REFERENCES','UNIQUE','DEFAULT','CHECK','CONSTRAINT',
  'UNION','UNION ALL','INTERSECT','EXCEPT','CASE','WHEN','THEN','ELSE','END',
  'WITH','AS','DISTINCT','EXISTS','ALL','ANY','SOME','RETURNING',
];

@Component({
  selector: 'app-dev-sql',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="SQL Formatter" subtitle="Beautify, uppercase, minify SQL — works with most dialects." icon="DB" color="from-cyan-500 to-blue-600" back="/dev" backLabel="Developer tools" />
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div class="card p-3 mb-3 flex flex-wrap gap-2 items-center">
        <label class="flex items-center gap-2 text-xs">
          <input type="checkbox" [(ngModel)]="upper" (ngModelChange)="run()" /> UPPERCASE keywords
        </label>
        <select class="input !w-auto !py-1 !px-2 text-xs" [(ngModel)]="indent" (ngModelChange)="run()">
          <option value="  ">2 spaces</option>
          <option value="    ">4 spaces</option>
          <option value="\t">Tab</option>
        </select>
        <span class="flex-1"></span>
        <button class="btn-ghost text-xs" (click)="sample()">Sample</button>
        <button class="btn-primary text-sm" (click)="run()">Format</button>
      </div>
      <div class="grid lg:grid-cols-2 gap-4">
        <div class="card p-4">
          <div class="text-xs font-semibold mb-2">Input</div>
          <textarea class="input font-mono text-xs h-[460px]" spellcheck="false" [(ngModel)]="src" (ngModelChange)="run()"></textarea>
        </div>
        <div class="card p-4">
          <div class="text-xs font-semibold mb-2 flex items-center justify-between">
            Output
            <button class="btn-ghost text-xs" (click)="copy()">Copy</button>
          </div>
          <pre class="input font-mono text-xs h-[460px] !bg-slate-50 dark:!bg-slate-800/40 overflow-auto whitespace-pre">{{ dst() }}</pre>
        </div>
      </div>
    </section>
  `,
})
export class DevSql {
  protected src = 'select id, name, email from users where active=1 and created_at > now() - interval 7 day order by created_at desc limit 10;';
  protected dst = signal('');
  protected upper = true;
  protected indent = '  ';

  constructor() { this.run(); }

  run() {
    if (!this.src.trim()) { this.dst.set(''); return; }
    this.dst.set(this.format(this.src));
  }

  sample() {
    this.src = `SELECT u.id, u.name, count(o.id) AS orders FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE u.created_at >= '2026-01-01' AND u.status IN ('active','pending') GROUP BY u.id, u.name HAVING count(o.id) > 5 ORDER BY orders DESC LIMIT 25;`;
    this.run();
  }

  async copy() { try { await navigator.clipboard.writeText(this.dst()); } catch {} }

  private format(sql: string): string {
    // tokenize keywords + everything else
    const upper = sql.toUpperCase();
    const ranges: { start: number; end: number; kw: string }[] = [];
    for (const kw of KEYWORDS) {
      const re = new RegExp(`\\b${kw.replace(/ /g, '\\s+')}\\b`, 'g');
      let m: RegExpExecArray | null;
      while ((m = re.exec(upper))) ranges.push({ start: m.index, end: m.index + m[0].length, kw });
    }
    ranges.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
    const cleaned: typeof ranges = [];
    let last = -1;
    for (const r of ranges) {
      if (r.start >= last) { cleaned.push(r); last = r.end; }
    }

    // build segmented string
    let out = '';
    let cursor = 0;
    const breakBefore = new Set(['SELECT','FROM','WHERE','GROUP BY','HAVING','ORDER BY','LIMIT','OFFSET',
      'INNER JOIN','LEFT JOIN','RIGHT JOIN','FULL JOIN','CROSS JOIN','JOIN','UNION','UNION ALL','INTERSECT','EXCEPT',
      'VALUES','SET','RETURNING','ON','WITH']);
    for (const r of cleaned) {
      const before = sql.slice(cursor, r.start);
      out += before;
      const kwText = this.upper ? r.kw : r.kw.toLowerCase();
      if (breakBefore.has(r.kw) && out.trim()) out += '\n';
      out += kwText;
      cursor = r.end;
    }
    out += sql.slice(cursor);

    // tidy whitespace
    out = out.replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{2,}/g, '\n');

    // indent continuations
    const lines = out.split('\n').map(l => l.trim()).filter(Boolean);
    const result: string[] = [];
    let depth = 0;
    for (const line of lines) {
      if (/^\)\s*[,;]?$/.test(line)) depth = Math.max(0, depth - 1);
      result.push(this.indent.repeat(depth) + line);
      if (line.endsWith('(')) depth++;
    }
    return result.join('\n');
  }
}
