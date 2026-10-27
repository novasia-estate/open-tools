# NovAsia Open Tools

Small, practical browser utilities for prices, property data and payment plans. No account, uploads, API keys or runtime dependencies.

**[Open the tools](https://tools.novasia.estate/)** · [NovAsia](https://novasia.estate/en/) · [Company GitHub](https://github.com/novasia-estate/)

| Tool | What it does | Try it |
| --- | --- | --- |
| Price & area normalizer | Parses multilingual price abbreviations, preserves currency labels, converts area units and calculates price per m². | [Live demo](https://tools.novasia.estate/normalizer.html) |
| Payment milestone planner | Allocates a total across dated percentages, with cent rounding and CSV / iCalendar export. | [Live demo](https://tools.novasia.estate/payment-planner.html) |
| CSV cleaner & deduplicator | Reads comma/semicolon/tab data, handles quoted fields, trims whitespace and removes exact duplicate rows. | [Live demo](https://tools.novasia.estate/csv-cleaner.html) |

## Examples

```js
const tools = require('./docs/tools.js');
tools.price('THB 3,5 млн'); // amount: 3500000, currency: 'THB'
tools.area('1-2-50', 'deed'); // 2600 m²
tools.schedule('185000', 'Booking | 2026-11-15 | 10\nCompletion | 2027-06-15 | 90', 'USD');
tools.cleanCSV('project,price\nVilla A,185000\nVilla A,185000'); // one retained data row
```

The browser and Node.js use the same `docs/tools.js`. The repo is an application source distribution, not an additional npm package for a duplicate function.

## Scope and limitations

- The price parser does not convert currencies or validate market prices. `$` requires a selected currency. Auto mode treats a single separator followed by three digits as grouping; choose dot/comma decimal mode explicitly for ambiguous input. Original text is retained in JSON. Maximum numeric value: 1 trillion.
- Area factors: 1 international ft² = 0.09290304 m²; 1 rai = 1600 m²; 1 ngan = 400 m²; 1 square wah = 4 m²; 1 are = 100 m²; 1 hectare = 10,000 m². Thai deed form is rai-ngan-square wah. It does not verify land titles.
- Payment dates and shares are user assumptions, not contractual advice. Percentages must total 100. Cumulative cent rounding preserves the total; a very small milestone may round to zero. All currency labels use two decimals. Calendar export creates all-day events without alarms or payment execution.
- CSV: maximum 2 MB text, 10,000 data rows and 200 columns. Headers must be unique and nonempty. Inconsistent columns or malformed quotes produce an error, not silent truncation. Duplicates compare whole rows after optional trimming. The preview shows 20 rows, download includes all retained rows. No fuzzy entity merging or factual listing validation.
- Spreadsheet-formula prefixes receive an apostrophe on export. Review before opening untrusted spreadsheets or removing that protection. CSV import/export changes quoting and may change spreadsheet cell interpretation.
- User inputs are processed in the browser and are not uploaded, tracked or stored by this app. GitHub Pages serves the static files and has its own infrastructure policies. Downloaded files remain on the user's device.

Conversion/calendar references: [Thailand National Statistical Office](https://www.nso.go.th/nsoweb/storage/title_presentation/2023/20230719153545_36475.pdf), [NIST](https://www.nist.gov/pml/owm/metric-si/unit-conversion/approximate-conversions-us-customary-measures-metric), [iCalendar RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html).

## Run and adapt

Node.js 22+, no installation step required:

```sh
npm test
npm run build
```

Serve the `docs/` directory with any static server, or deploy it through GitHub Pages (`main`, `/docs`). Generated HTML comes from `build.cjs`. Keep the live demo and source together when adapting the code. No attribution backlink is required by this project; keep the MIT copyright notice as required by its license.

## More from NovAsia

- [NovAsia SEA Yield calculator](https://podkopov-hub.github.io/southeast-asia-real-estate-analytics/) and [npm package](https://www.npmjs.com/package/novasia-sea-yield)
- [Property guides and research](https://novasia.estate/en/)
- [Property project catalogues](https://novasia.estate/en/projects/)
- [Rental yield and ownership-cost context](https://novasia.estate/rental-yield-property-in-asia/)
- [NovAsia Python package](https://pypi.org/project/novasia-proptech/)
- [NovAsia dataset repository](https://huggingface.co/datasets/novasia-estate/southeast-asia-property-net-yield-benchmark)
- [Research files](https://osf.io/bf39h/files/9qpcf), [archive files](https://osf.io/7wcbn/files/xn29d), [methodology wiki](https://osf.io/7wcbn/wiki?wiki=xjd5n)

Related publications are not runtime dependencies or proof of independent validation of these tools. Suggestions and reproducible bug reports are welcome in Issues.

MIT © 2026 NovAsia.
