# Mapa defibrylatorów AED

_English: Map presenting locations of defibrillators based on OpenStreetMap data._

To repozytorium zawiera kod strony prezentujacej lokalizacje defibrylatorów AED.

Dane pochodzą z bazy OpenStreetMap, którą każdy może uzupełniać do czego chcemy zachęcić.

Informacje o defibrylatorach są zawyczaj udostępniane przez poszczególnych operatorów lub jednostki samorządowe.
Przez taką fragmentację ciężej znaleźć takie urządzenia.
OSM jest otwartym zbiorem danych i zawsze taki pozostanie, więc dane mogą być wykorzystywane przez inne aplikacje webowe i mobilne.

### Technical information [ENG]

This is a simple static website using HTML and vanilla JavaScript.
Any webserver (Nginx/Apache) or things like S3 or GitHub Pages can be used to host frontend part.

The only thing that requires code execution is Python script that downloads data from Overpass API and converts it to GeoJSON and CSV files.

The only external package used is _requests_ which can be installed using _pip_ if not present in the system already.

Example CSV and GeoJSON files are uploaded to repo.

#### Scripts used to deploy on our server

Stack: Ubuntu/Nginx

Clone repo:
```bash
git clone --branch main --single-branch https://github.com/openstreetmap-polska/aed-mapa.git /home/aeduser/aed-mapa/
```

Deploy to /var/www/:
```bash
cd /home/aeduser/aed-mapa/
git pull
rsync --update --recursive --delete --exclude '*.py' --exclude '*.geojson' --exclude '*.json' --exclude '.git*'  --verbose /home/aeduser/aed-mapa/ /var/www/html/
```

Download new data (set crontab to run it periodically):
```bash
python3 /home/aeduser/aed-mapa/src/download_data.py /home/aeduser/aed_poland.geojson /home/aeduser/aed_poland.csv
cp /home/aeduser/aed_poland.geojson /var/www/html/aed_poland.geojson
cp /home/aeduser/aed_poland_metadata.json /var/www/html/aed_poland_metadata.json
cp /home/aeduser/aed_poland.csv /var/www/html/aed_poland.csv
```
