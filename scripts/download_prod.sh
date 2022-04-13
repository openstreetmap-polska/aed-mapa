#!/bin/bash

python3 /home/aeduser/aed-mapa/download_data.py /home/aeduser/data_prod/ /home/aeduser/

cp /home/aeduser/data_prod/aed_poland.ods /var/www/html/aed_poland.ods
cp /home/aeduser/data_prod/aed_poland.geojson /var/www/html/aed_poland.geojson
cp /home/aeduser/data_prod/aed_poland_metadata.json /var/www/html/aed_poland_metadata.json
cp /home/aeduser/data_prod/aed_poland.csv /var/www/html/aed_poland.csv
