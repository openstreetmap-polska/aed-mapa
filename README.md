# Mapa defibrylatorów AED

_English: Map presenting locations of defibrillators based on OpenStreetMap data._

To repozytorium zawiera kod strony prezentujacej lokalizacje defibrylatorów AED.

Dane pochodzą z bazy OpenStreetMap, którą każdy może uzupełniać do czego chcemy zachęcić.

Informacje o defibrylatorach są zawyczaj udostępniane przez poszczególnych operatorów lub jednostki samorządowe.
Przez taką fragmentację ciężej znaleźć takie urządzenia.
OSM jest otwartym zbiorem danych i zawsze taki pozostanie, więc dane mogą być wykorzystywane przez inne aplikacje webowe i mobilne.

Poza pobieraniem danych bezpośrednio z OSM albo za pomocą usług jak Overpass API dane wyświetlane na stronie można pobrać w formacie:
- GeoJSON: https://aed.openstreetmap.org.pl/aed_poland.geojson
- CSV: https://aed.openstreetmap.org.pl/aed_poland.csv
- Excel: https://aed.openstreetmap.org.pl/aed_poland.ods

### Gitflow
branch 'development' -> branch 'main'

Branch 'development' jest hostowany pod: https://aed.openstreetmap.org.pl/dev/
a branch 'main' pod: https://aed.openstreetmap.org.pl/

Github actions robi deploy gdy pojawiają się nowe commity na tych branch-ach.

Nowe branche powinny być bazowane na 'development' i PR mergowane również do 'development'.
Następnie PR z brancha 'development' do 'main'.

### Technical information [ENG]

This is a simple static website using HTML and vanilla JavaScript.
Any webserver (Nginx/Apache) or things like S3 or GitHub Pages can be used to host frontend part.

File _src/osm-integration.js_ contains placeholders for OAuth1 tokens for OpenStreetMap application which are filled during deploy (this allows us to have both prod and dev environments one pointing to OSM DEV API one to osm.org).

The only thing that requires code execution is Python script that downloads data from Overpass API and converts it to GeoJSON and CSV files.

File _requirements.txt_ contains packages used by python script. The script was __updated__ to create additional layer from Google Sheets to before use you would need to __comment out last line__ from _download_data.py_

Example CSV and GeoJSON files are uploaded to repo.

#### Scripts used to deploy on our server

Stack: Ubuntu/Nginx

Clone repo:
```bash
git clone --branch main --single-branch https://github.com/openstreetmap-polska/aed-mapa.git /home/aeduser/aed-mapa/
```

Command to deploy are in _.github/workflows/_ but they pretty much boil down to copying files to /var/www/.

Download new data (set crontab to run it periodically):
```bash
python3 /home/aeduser/aed-mapa/src/download_data.py /home/aeduser/data_dir/
cp /home/aeduser/data_dir/aed_poland.geojson /var/www/html/aed_poland.geojson
cp /home/aeduser/data_dir/aed_poland_metadata.json /var/www/html/aed_poland_metadata.json
cp /home/aeduser/data_dir/aed_poland.csv /var/www/html/aed_poland.csv
```

### Alternatives / Inne podobne

* https://github.com/chnuessli/defikarte.ch - https://defikarte.ch/


### Additional info about development

#### Editing style

#### Creating sprites with icons

```bash
nvm use 8
npm install -g @mapbox/spritezero-cli
spritezero --ratio 1 ./src/map_style/sprite ./src/marker_icons/
spritezero --ratio 2 ./src/map_style/sprite@2x ./src/marker_icons/
```
