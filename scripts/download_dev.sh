#!/bin/bash

python3 /home/aeduser/aed-mapa-dev/download_data.py /home/aeduser/data_dev/ /home/aeduser/

cp /home/aeduser/data_dev/aed_poland.ods /var/www/dev/aed_poland.ods
cp /home/aeduser/data_dev/aed_poland.geojson /var/www/dev/aed_poland.geojson
cp /home/aeduser/data_dev/aed_poland_metadata.json /var/www/dev/aed_poland_metadata.json
cp /home/aeduser/data_dev/aed_poland.csv /var/www/dev/aed_poland.csv
