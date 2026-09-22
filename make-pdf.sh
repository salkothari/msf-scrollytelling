#!/bin/bash
# Regenerate the downloadable PDFs from the live page.
#
# The PDFs are a SNAPSHOT. Any copy or layout change to the site leaves
# them stale until this is re-run, so run it before publishing changes
# that matter to the offline readers.
#
#   ./make-pdf.sh
#
# Renders index.html?pdf=1 in headless Chrome. That query param
# applies print.css on screen, opens every <details>, un-pins the
# graphics, shows both algorithms, unstacks the quote carousel and
# downsamples the oversized photos. Page size comes from main.js:
# one 105x190mm phone-proportioned file, full bleed.
set -euo pipefail
cd "$(dirname "$0")"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=8765
[ -x "$CHROME" ] || { echo "Chrome not found at $CHROME"; exit 1; }

python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$PWD" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
sleep 2

"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=35000 \
  --print-to-pdf="tb-brief.pdf" \
  "http://localhost:$PORT/index.html?pdf=1" 2>/dev/null
printf '  %-16s %s\n' "tb-brief.pdf" "$(du -h tb-brief.pdf | cut -f1)"
echo "done"
