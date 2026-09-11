#!/bin/bash
# Kompakte Statuszeile der laufenden Guide-Produktion (Iter 169)
tail -15 /app/memory/tmp/poll3.log | awk 'NR==1{print $2} NR>1{ if ($2=="video_ready" && $NF!="stale") r++; else if ($2=="video_ready") s++; else if ($3 ~ /OmniHuman|Stimme|Keyframe|Schnitt/) run=run" "$1"("$3")"; else q++ } END{print "fertig:", r+0, "| stale-fertig:", s+0, "| läuft:" run, "| wartet:", q+0}'
