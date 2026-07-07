#!/bin/bash
# Download CartoCDN dark tiles for Guangzhou area using curl
# Run: bash scripts/download-tiles.sh

BASE="https://a.basemaps.cartocdn.com/dark_nolabels"
OUT="frontend/public/tiles"

NORTH=23.7; SOUTH=22.4; EAST=114.0; WEST=112.8
ZOOMS=(8 9 10 11 12 13 14)

latLngToTile() {
  local lat=$1 lng=$2 z=$3
  local n=$(echo "2^$z" | bc)
  local x=$(echo "scale=0; ($lng + 180) / 360 * $n" | bc)
  local rad=$(echo "scale=10; $lat * 3.1415926535 / 180" | bc -l)
  local y=$(echo "scale=0; (1 - l($rad / (1 - $rad^2)^0.5 + 1 / c($rad)) / 3.1415926535) / 2 * $n" | bc -l 2>/dev/null || echo 0)
  echo "$x $y"
}

total=0; done=0
for z in "${ZOOMS[@]}"; do
  read nw_x nw_y <<< $(latLngToTile $NORTH $WEST $z)
  read se_x se_y <<< $(latLngToTile $SOUTH $EAST $z)
  for ((x=nw_x; x<=se_x; x++)); do
    for ((y=nw_y; y<=se_y; y++)); do
      ((total++))
    done
  done
done
echo "Total tiles: $total"

for z in "${ZOOMS[@]}"; do
  read nw_x nw_y <<< $(latLngToTile $NORTH $WEST $z)
  read se_x se_y <<< $(latLngToTile $SOUTH $EAST $z)
  for ((x=nw_x; x<=se_x; x++)); do
    for ((y=nw_y; y<=se_y; y++)); do
      mkdir -p "$OUT/$z/$x"
      url="$BASE/$z/$x/$y.png"
      dest="$OUT/$z/$x/$y.png"
      if [ ! -f "$dest" ]; then
        curl -s --connect-timeout 5 -o "$dest" "$url" &
      fi
      ((done++))
      echo -ne "\r$done/$total ($((done*100/total))%)"
      # Limit concurrency
      while [ $(jobs -r | wc -l) -gt 10 ]; do sleep 0.1; done
    done
  done
done
wait
echo -e "\nDone!"
