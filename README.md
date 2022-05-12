## Mapa defibrylatorów AED

__English:__ _Map presenting locations of defibrillators based on OpenStreetMap data._

To repozytorium zawiera kod strony prezentujacej lokalizacje defibrylatorów AED.

Dane pochodzą z bazy OpenStreetMap, którą każdy może uzupełniać do czego chcemy zachęcić.

Informacje o defibrylatorach są zawyczaj udostępniane przez poszczególnych operatorów lub jednostki samorządowe.
Przez taką fragmentację ciężej znaleźć takie urządzenia.
OSM jest otwartym zbiorem danych i zawsze taki pozostanie, więc dane mogą być wykorzystywane przez inne aplikacje webowe i mobilne.

Poza pobieraniem danych bezpośrednio z OSM albo za pomocą usług jak Overpass API dane wyświetlane na stronie można pobrać w formacie:
- GeoJSON: https://aed.openstreetmap.org.pl/aed_poland.geojson
- CSV: https://aed.openstreetmap.org.pl/aed_poland.csv
- Excel: https://aed.openstreetmap.org.pl/aed_poland.ods

### Gitflow [ENG]

All changes should flow from branch `development` to branch `main`.

Branch `development` is hosted on: https://aed.openstreetmap.org.pl/dev/
Branch `main` is hosted on: https://aed.openstreetmap.org.pl/

Github actions deploy the site when new commits are pushed/merged into either branch.

New branches should be based on `development` branch.
Pull Requests (PR) should be targeting `development` branch.

To promote changes from dev env to prod make a PR from `development` to `main`.

### Technical information [ENG]

This is a simple static website using HTML and vanilla JavaScript.
Any webserver (Nginx/Apache) or things like S3 or GitHub Pages can be used to host frontend part.

File _js/osm-integration.js_ contains placeholders for OAuth1 tokens for OpenStreetMap application which are filled during deploy (this allows us to have both prod and dev environments one pointing to OSM DEV API one to osm.org).

The only thing that requires code execution is __Python script__ that downloads data from Overpass API and converts it to GeoJSON and CSV files.

File _requirements.txt_ contains packages used by python script.

#### Scripts used to deploy on our server [ENG]

Stack: Ubuntu/Nginx

Clone repo:
```bash
git clone --branch main --single-branch https://github.com/openstreetmap-polska/aed-mapa.git /home/aeduser/aed-mapa/
```

Command to deploy are in _.github/workflows/_ but in short they copy the files to temporary location then replace the OAuth1 token mentioned earlier and then copy files to `/var/www/html/`.

Download new data (set crontab to run it periodically):
```bash
python3 /home/aeduser/aed-mapa/download_data.py /home/aeduser/data_prod/ /home/aeduser/

cp /home/aeduser/data_prod/aed_poland.ods /var/www/html/aed_poland.ods
cp /home/aeduser/data_prod/aed_poland.geojson /var/www/html/aed_poland.geojson
cp /home/aeduser/data_prod/aed_poland_metadata.json /var/www/html/aed_poland_metadata.json
cp /home/aeduser/data_prod/aed_poland.csv /var/www/html/aed_poland.csv
```

### Deployment to AWS

Build definition is in buildspec.yml file.
Build environment that need to be set:
1. oauth_consumer_key - Key for OSM Integration
2. oauth_secret - Secret for OSM Integration
3. url - URL of OSM API (Probably https://www.openstreetmap.org)

### Alternatives / Inne podobne

* https://github.com/chnuessli/defikarte.ch - https://defikarte.ch/


### Additional info about development [ENG]

#### Editing style

You can use [Maputnik](https://maputnik.github.io/) editor to prepare new style for the map.

Steps:
1. Open https://aed.openstreetmap.org.pl/maputnik/?layer=1311944204%7E0#6/52/20 (it's a copy of maputnik editor with newer version than what is available on the official site).
2. If the AED map style has not been loaded click _open_ and select it.
3. Once finished click _export_ and create PR or an issue with your style attached.

#### Creating sprites with icons

If you want to add new icons to the sprite sheet please place the SVG files in ./web/marker_icons/ folder.

SVG should be scaled to 50x50px size.

```bash
# install requirements (assumes NVM has been installed)
nvm use 8
npm install -g @mapbox/spritezero-cli
# create sprite for regular screens
spritezero --ratio 1 ./web/map_style/sprite ./web/marker_icons/
# create sprite for high-dpi screens
spritezero --ratio 2 ./web/map_style/sprite@2x ./web/marker_icons/
```
