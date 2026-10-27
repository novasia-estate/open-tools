'use strict';
(() => {
  const T = window.NovAsiaTools;
  const form = document.querySelector('#tool-form');
  const result = document.querySelector('#result');
  const error = document.querySelector('#error');
  const mode = document.body.dataset.tool;
  let exportData = null;
  const value = name => form.elements.namedItem(name).value;
  const fmt = amount => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount);
  const element = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
  const metric = (label, amount) => { const block = element('div', undefined, 'result-block'); block.append(element('p', label, 'metriclabel'), element('div', amount, 'metric')); result.append(block); return block; };
  const table = (headers, rows) => { const wrap = element('div', undefined, 'tablewrap'), table = element('table'), head = element('thead'), hr = element('tr'), body = element('tbody'); headers.forEach(value => { const th = element('th', value); th.scope = 'col'; hr.append(th); }); head.append(hr); rows.forEach(row => { const tr = element('tr'); row.forEach(value => tr.append(element('td', value))); body.append(tr); }); table.append(head, body); wrap.append(table); result.append(wrap); };
  const download = (text, name, type) => { const url = URL.createObjectURL(new Blob([text], { type })); const a = element('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const calculate = () => {
    error.hidden = true; exportData = null;
    document.querySelectorAll('[id^="download-"]').forEach(button => { button.hidden = true; });
    try {
      let data;
      if (mode === 'normalizer') {
        const price = T.price(value('price'), { style: value('style'), currency: value('currency') });
        const area = T.area(value('area'), value('unit'), value('style'));
        data = { price, area, pricePerSqm: Math.round(price.amount / area.sqm * 100) / 100 };
        result.replaceChildren(); result.className = '';
        metric('Normalized price', `${fmt(price.amount)} ${price.currency}`);
        metric('Price per square metre', `${fmt(data.pricePerSqm)} ${price.currency} / m²`);
        table(['Area in m²', 'Area in ft²', 'Area in rai'], [[fmt(area.sqm), fmt(area.sqft), fmt(area.rai)]]);
        result.append(element('p', price.interpretation, 'hint'));
        const details = element('details', undefined, 'outputdetails'); details.append(element('summary', 'Original input & JSON'), element('pre', JSON.stringify(data, null, 2))); result.append(details);
        document.querySelector('#download-json').hidden = false;
      } else if (mode === 'planner') {
        data = T.schedule(value('total'), value('milestones'), value('currency'));
        result.replaceChildren(); result.className = '';
        metric('Total planned', `${fmt(data.total)} ${data.currency}`);
        table(['Milestone', 'Date', 'Share', 'Amount'], data.rows.map(row => [row.label, row.date, `${row.percent}%`, `${fmt(row.amount)} ${row.currency}`]));
        result.append(element('p', `${data.rows.length} milestones · 100% allocated · dates are user inputs`, 'hint'));
        document.querySelector('#download-csv').hidden = false; document.querySelector('#download-ics').hidden = false;
      } else if (mode === 'cleaner') {
        data = T.cleanCSV(value('csv'), { delimiter: value('delimiter') === 'tab' ? '\t' : value('delimiter'), trim: form.elements.namedItem('trim').checked, dedupe: form.elements.namedItem('dedupe').checked });
        result.replaceChildren(); result.className = '';
        metric('Rows ready to export', String(data.rows.length));
        result.append(element('p', `${data.duplicates} duplicates removed · ${data.blank} blank rows removed · ${data.headers.length} columns`, 'hint'));
        if (data.protectedCells) result.append(element('p', `${data.protectedCells} cells will receive formula protection in the download.`, 'hint'));
        table(data.headers, data.rows.slice(0, 20));
        document.querySelector('#download-csv').hidden = false;
      }
      exportData = data;
    } catch (err) { result.replaceChildren(element('p', 'No export produced. Check the input and try again.', 'empty')); error.textContent = err.message; error.hidden = false; }
  };
  form.addEventListener('submit', event => { event.preventDefault(); calculate(); });
  document.querySelector('#download-json')?.addEventListener('click', () => { if (exportData) download(JSON.stringify(exportData, null, 2) + '\n', 'novasia-normalized-listing.json', 'application/json'); });
  document.querySelector('#download-csv')?.addEventListener('click', () => { if (!exportData) return; const text = mode === 'planner' ? T.csv([['milestone', 'date', 'percentage', 'amount', 'currency'], ...exportData.rows.map(row => [row.label, row.date, row.percent, row.amount.toFixed(2), row.currency])]) : exportData.csv; download(text, mode === 'planner' ? 'novasia-payment-plan.csv' : 'novasia-cleaned.csv', 'text/csv;charset=utf-8'); });
  document.querySelector('#download-ics')?.addEventListener('click', () => { if (exportData) download(T.calendar(exportData), 'novasia-payment-plan.ics', 'text/calendar;charset=utf-8'); });
  form.addEventListener('input', () => { exportData = null; document.querySelectorAll('[id^="download-"]').forEach(button => { button.hidden = true; }); });
  form.addEventListener('change', () => { exportData = null; document.querySelectorAll('[id^="download-"]').forEach(button => { button.hidden = true; }); });
  form.querySelector('[type="submit"]').disabled = false;
  calculate();
})();
