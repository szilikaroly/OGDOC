#!/usr/bin/env bash
# ÖNÁLLÓ OGDOC-REPÓ ELŐÁLLÍTÁSA — a teljes előzménnyel és a forrástárral.
#
# Az OGDOC ma az `anamnezis-asszisztens` repó `ogdoc/` alkönyvtárában él, mert
# a projekt indulásakor a repó létrehozása nem volt engedélyezve. Ez a szkript
# kiemeli önálló repóvá ÚGY, hogy a 42 commit előzménye megmarad — a
# `git subtree split` minden commitot átír az `ogdoc/` gyökérre.
#
# Miért nem elég egy másolat: egy előzmény nélküli repóban nem látszik, MIKOR
# és MIÉRT dőlt el valami. A projekt minden döntése commit-üzenetben van
# indokolva; ez a réteg nem díszítés, hanem a követhetőség maga.
#
#   tools/publish/standalone.sh <célkönyvtár> [--uploads <feltöltések>]
#
# Utána a feltöltés két lépés:
#   1. hozd létre az ÜRES repót a GitHubon (a szkript nem tud repót létrehozni)
#   2. cd <célkönyvtár> && git remote add origin <URL> && git push -u origin main
set -euo pipefail

DEST="${1:?Használat: standalone.sh <célkönyvtár> [--uploads <könyvtár>]}"
UPLOADS=""
[ "${2:-}" = "--uploads" ] && UPLOADS="${3:?}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PARENT="$(cd "$ROOT/.." && pwd)"

echo "── előzmény kiemelése (git subtree split) ──"
cd "$PARENT"
git branch -D ogdoc-standalone 2>/dev/null || true
git subtree split --prefix=ogdoc -b ogdoc-standalone >/dev/null

rm -rf "$DEST"
git clone --quiet --branch ogdoc-standalone --single-branch "$PARENT" "$DEST"
cd "$DEST"
git remote remove origin
git branch -m main
echo "  $(git rev-list --count HEAD) commit, gyökérben az ogdoc tartalma"

if [ -n "$UPLOADS" ]; then
  # A forrástár ALAPBÓL benne van a kiemelt előzményben (ogdoc/forrasok/).
  # Ez az ág csak FRISSÍTI, ha újabb kiadások érkeztek.
  echo "── forrástár frissítése ──"
  python3 "$ROOT/tools/publish/forrasok.py" --uploads "$UPLOADS" --out forrasok
  if ! git diff --quiet; then
    git add forrasok
    git -c user.name="OGDOC" -c user.email="noreply@example.invalid" \
        commit --quiet -m "Forrástár frissítve"
  else
    echo "  változatlan"
  fi
fi

echo "  forrástár: $(du -sh forrasok | cut -f1), $(python3 -c "
import json;print(len(json.load(open('forrasok/manifest.json'))['tetelek']))") tétel"

echo
echo "── kész: $DEST ──"
echo "  git remote add origin git@github.com:<felhasználó>/ogdoc.git"
echo "  git push -u origin main"
