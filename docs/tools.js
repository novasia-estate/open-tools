(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NovAsiaTools = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FACTORS = Object.freeze({ sqm: 1, sqft: 0.09290304, rai: 1600, wah: 4, are: 100, hectare: 10000 });
  function number(input, style = 'auto') {
    if (!['auto', 'dot', 'comma'].includes(style)) throw Error('Choose a valid number format.');
    let value = String(input).trim().replace(/[\s\u00a0\u202f']/g, '');
    if (!value || value.length > 100 || !/^[+]?\d[\d.,]*$/.test(value)) throw Error('Enter one nonnegative number, without a range.');
    let decimal = style === 'comma' ? ',' : '.';
    if (style === 'auto') {
      const dot = value.lastIndexOf('.'), comma = value.lastIndexOf(',');
      if (dot >= 0 && comma >= 0) decimal = dot > comma ? '.' : ',';
      else if (dot >= 0 || comma >= 0) {
        const sep = dot >= 0 ? '.' : ',';
        const parts = value.split(sep);
        if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) decimal = sep === '.' ? ',' : '.';
        else decimal = sep;
      }
    }
    const grouping = decimal === '.' ? ',' : '.';
    const halves = value.split(decimal);
    if (halves.length > 2 || (halves.length === 2 && !/^\d+$/.test(halves[1]))) throw Error('Invalid decimal separator.');
    const groups = halves[0].replace(/^\+/, '').split(grouping);
    if (groups.length > 1 && (!/^\d{1,3}$/.test(groups[0]) || groups.slice(1).some(part => !/^\d{3}$/.test(part)))) throw Error('Thousands groups must contain three digits. Choose the number format explicitly if needed.');
    value = groups.join('') + (halves.length === 2 ? '.' + halves[1] : '');
    const result = Number(value);
    if (!Number.isFinite(result) || result > 1e12) throw Error('Use a finite value no larger than 1 trillion.');
    return result;
  }
  function price(input, { style = 'auto', currency = '' } = {}) {
    const original = String(input).trim();
    if (!original || original.length > 200) throw Error('Enter a price, for example THB 3.5 million.');
    let rest = original;
    const detected = new Set();
    const codes = { '฿': 'THB', '€': 'EUR', '£': 'GBP', '₽': 'RUB' };
    rest = rest.replace(/THB|USD|IDR|EUR|GBP|RUB|AUD|SGD|KHR|฿|€|£|₽/gi, match => { detected.add(codes[match] || match.toUpperCase()); return ' '; });
    rest = rest.replace(/\$/g, () => { if (!currency) throw Error('The $ symbol is ambiguous. Select its currency.'); return ' '; });
    if (detected.size > 1) throw Error('One price cannot contain multiple currencies.');
    const code = [...detected][0] || currency;
    if (currency && detected.size && currency !== code) throw Error('Selected currency conflicts with the price text.');
    if (!/^[A-Z]{3}$/.test(code)) throw Error('Select a currency or include its three-letter code. No exchange-rate conversion is performed.');
    let multiplier = 1, suffixCount = 0;
    rest = rest.replace(/(?:billion|миллиард(?:а|ов)?|млрд|bn|b|million|миллион(?:а|ов)?|млн|mn|m|thousand|тысяч(?:а|и)?|тыс|k)\.?\s*$/i, match => {
      suffixCount++;
      const s = match.trim().replace(/\.$/, '').toLowerCase();
      multiplier = /^(b|bn|billion|млрд|миллиард)/.test(s) ? 1e9 : /^(k|thousand|тыс)/.test(s) ? 1e3 : 1e6;
      return '';
    });
    const amount = number(rest, style) * multiplier;
    if (!Number.isFinite(amount) || amount > 1e12) throw Error('Price must be no larger than 1 trillion.');
    return { original, amount: Math.round(amount * 100) / 100, currency: code, interpretation: style === 'auto' ? 'Auto: one separator followed by exactly 3 digits is a thousands separator. Choose dot/comma explicitly to override.' : `Explicit ${style} decimal separator.`, abbreviated: suffixCount > 0 };
  }
  function area(input, unit = 'sqm', style = 'auto') {
    const original = String(input).trim();
    let sqm;
    if (unit === 'deed') {
      const match = original.match(/^(\d+)\s*-\s*([0-3])\s*-\s*(\d+(?:\.\d+)?)$/);
      if (!match || Number(match[3]) >= 100) throw Error('Use rai-ngan-square wah, e.g. 1-2-50; ngan 0–3 and square wah below 100.');
      sqm = Number(match[1]) * 1600 + Number(match[2]) * 400 + Number(match[3]) * 4;
    } else {
      if (!(unit in FACTORS)) throw Error('Select a supported area unit.');
      sqm = number(original, style) * FACTORS[unit];
    }
    if (!(sqm > 0) || sqm > 1e12) throw Error('Area must be positive and no larger than 1 trillion m².');
    return { original, unit, sqm, sqft: sqm / FACTORS.sqft, rai: sqm / 1600 };
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01' || value > '9999-12-31' || !Number.isFinite(Date.parse(value + 'T00:00:00Z')) || new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) !== value) throw Error('Use a real date in YYYY-MM-DD format, year 1900–9999.');
    return value;
  }
  function schedule(totalInput, milestoneText, currency = 'USD') {
    const total = number(totalInput, 'dot');
    if (!(total > 0) || Math.abs(total * 100 - Math.round(total * 100)) > 0.01) throw Error('Total must be positive with at most two decimal places.');
    if (!/^[A-Z]{3}$/.test(currency)) throw Error('Enter an uppercase three-letter currency label.');
    const lines = String(milestoneText).trim().split(/\r?\n/);
    if (!lines[0] || lines.length > 100) throw Error('Enter between 1 and 100 milestones.');
    const totalCents = Math.round(total * 100);
    let cumulative = 0, assigned = 0;
    const rows = lines.map((line, i) => {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length !== 3 || !parts[0] || parts[0].length > 200 || /[\x00-\x1f\x7f]/.test(parts[0])) throw Error(`Line ${i + 1}: use Label | YYYY-MM-DD | percentage.`);
      const percent = number(parts[2], 'dot');
      const points = Math.round(percent * 100);
      if (percent <= 0 || percent > 100 || Math.abs(percent * 100 - points) > 0.000001) throw Error(`Line ${i + 1}: percentage must be 0.01–100 with at most two decimals.`);
      cumulative += points;
      const through = Number((BigInt(totalCents) * BigInt(cumulative) + 5000n) / 10000n);
      const cents = through - assigned;
      assigned = through;
      return { label: parts[0], date: validDate(parts[1]), percent, amount: cents / 100, currency, order: i + 1 };
    });
    if (cumulative !== 10000) throw Error(`Percentages must add to 100%; current total is ${cumulative / 100}%.`);
    for (let i = 1; i < rows.length; i++) if (rows[i].date < rows[i - 1].date) throw Error('Milestones must be in date order. Same-day milestones are allowed.');
    return { total, currency, rows };
  }
  function parseCSV(text, delimiter = 'auto') {
    text = String(text).replace(/^\uFEFF/, '');
    if (text.length > 2e6) throw Error('Limit this browser tool to 2 MB of CSV text.');
    if (!text.trim()) throw Error('Paste CSV with a header row.');
    if (delimiter === 'auto') {
      const counts = { ',': 0, ';': 0, '\t': 0 }; let quoted = false;
      for (let i = 0; i < text.length && !(!quoted && /[\r\n]/.test(text[i])); i++) {
        if (text[i] === '"') { if (quoted && text[i + 1] === '"') i++; else quoted = !quoted; }
        else if (!quoted && text[i] in counts) counts[text[i]]++;
      }
      delimiter = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    }
    if (![',', ';', '\t'].includes(delimiter)) throw Error('Use comma, semicolon or tab.');
    const rows = []; let row = [], cell = '', quoted = false, closed = false;
    const endCell = () => { row.push(cell); cell = ''; closed = false; if (row.length > 200) throw Error('Limit CSV to 200 columns.'); };
    const endRow = () => { endCell(); rows.push(row); row = []; if (rows.length > 10001) throw Error('Limit CSV to 10,000 data rows.'); };
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quoted) { if (char === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } } else cell += char; }
      else if (char === delimiter) endCell();
      else if (char === '\n' || char === '\r') { if (char === '\r' && text[i + 1] === '\n') i++; endRow(); }
      else if (char === '"') { if (cell || closed) throw Error('Invalid CSV quote. Quote the whole field and escape inner quotes as double quotes.'); quoted = true; }
      else { if (closed) throw Error('Unexpected text after a closing CSV quote.'); cell += char; }
    }
    if (quoted) throw Error('CSV has an unclosed quoted field.');
    if (cell || closed || row.length) endRow();
    return { rows, delimiter };
  }
  function safeCell(value) { value = String(value); return /^[\s\uFEFF]*[=+\-@\t\r]/.test(value) ? "'" + value : value; }
  function csv(rows) { return rows.map(row => row.map(value => '"' + safeCell(value).replace(/"/g, '""') + '"').join(',')).join('\r\n') + '\r\n'; }
  function cleanCSV(text, { delimiter = 'auto', trim = true, dedupe = true } = {}) {
    const parsed = parseCSV(text, delimiter);
    const rows = parsed.rows.map(row => row.map(value => trim ? value.trim() : value));
    const headers = rows.shift();
    if (!headers || headers.some(value => !value) || new Set(headers).size !== headers.length) throw Error('Headers must be nonempty and unique.');
    const seen = new Set(), output = []; let duplicates = 0, blank = 0;
    for (const row of rows) {
      if (row.every(value => !value.trim())) { blank++; continue; }
      if (row.length !== headers.length) throw Error(`Data row ${output.length + duplicates + blank + 1} has ${row.length} columns; expected ${headers.length}. No columns were silently dropped.`);
      const key = JSON.stringify(row);
      if (dedupe && seen.has(key)) { duplicates++; continue; }
      seen.add(key); output.push(row);
    }
    const protectedCells = [headers, ...output].flat().filter(value => safeCell(value) !== value).length;
    return { headers, rows: output, duplicates, blank, delimiter: parsed.delimiter, protectedCells, csv: csv([headers, ...output]) };
  }
  function calendar(plan, stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')) {
    if (!/^\d{8}T\d{6}Z$/.test(stamp)) throw Error('Invalid calendar generation timestamp.');
    const escape = text => String(text).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
    const fold = text => { let line = '', bytes = 0, result = ''; for (const char of text) { const n = new TextEncoder().encode(char).length; if (bytes + n > 75) { result += line + '\r\n'; line = ' '; bytes = 1; } line += char; bytes += n; } return result + line; };
    let hash = 2166136261;
    for (const char of JSON.stringify(plan)) hash = Math.imul(hash ^ char.codePointAt(0), 16777619) >>> 0;
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NovAsia//Open Tools//EN', 'CALSCALE:GREGORIAN'];
    for (const row of plan.rows) lines.push('BEGIN:VEVENT', `UID:${hash.toString(16)}-${row.order}@open-tools.novasia.estate`, 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + row.date.replace(/-/g, ''), 'SUMMARY:' + escape(row.label), 'DESCRIPTION:' + escape(`${row.amount.toFixed(2)} ${row.currency} (${row.percent}%). User-created payment scenario; not a payment instruction or confirmed obligation.`), 'TRANSP:TRANSPARENT', 'END:VEVENT');
    lines.push('END:VCALENDAR');
    return lines.map(fold).join('\r\n') + '\r\n';
  }
  return Object.freeze({ number, price, area, schedule, parseCSV, cleanCSV, csv, calendar, FACTORS });
});
