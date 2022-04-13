#!/bin/bash

set -e

cp filtered.pbf filtered.pbf.bak

# update the pbf with new data
pyosmium-up-to-date -v --size 10000 filtered.pbf

# filter updated pbf to just nodes that interest us (again) since updates add other stuff
osmosis --read-pbf filtered.pbf --node-key-value keyValueList="emergency.defibrillator" --write-pbf filtered2.pbf compress=none
mv filtered2.pbf filtered.pbf

date

# convert to geojson
ogr2ogr -f GeoJSON defibrillators.geojson -lco RFC7946=YES filtered.pbf points --config OSM_CONFIG_FILE /home/aeduser/osmconf.ini

cp /home/aeduser/defibrillators.geojson /var/www/html/defibrillators.geojson

date

# converting geojson to vetor tiles as dir
#/usr/local/bin/tippecanoe --output-to-directory=/var/www/mvt-staging/ --force --layer=defibrillators --maximum-zoom=16 --cluster-distance=20 -r1 /home/aeduser/defibrillators.geojson

/usr/local/bin/tippecanoe --output-to-directory=/var/www/mvt-staging-clustered/ --force --layer=defibrillators --maximum-zoom=12 --cluster-distance=20 -r1 /home/aeduser/defibrillators.geojson

/usr/local/bin/tippecanoe --output-to-directory=/var/www/mvt-staging-unclustered/ --force --layer=defibrillators --minimum-zoom=13 --maximum-zoom=13 -r1 /home/aeduser/defibrillators.geojson

date

echo "rsync"

#rsync --recursive --delete /var/www/mvt-staging/ /var/www/mvt/

rsync --recursive --exclude 'metadata.json' /var/www/mvt-staging-clustered/ /var/www/mvt/

rsync --recursive --exclude 'metadata.json' /var/www/mvt-staging-unclustered/ /var/www/mvt/

date
