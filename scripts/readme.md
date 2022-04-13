gdal installation
```bash
sudo add-apt-repository ppa:ubuntugis/ppa
sudo apt update
apt list --upgradable 
sudo apt install gdal-bin
ogrinfo --version
```

ogr config for pbf driver:

edited section for points
```text
[points]
# common attributes
osm_id=yes
osm_version=no
osm_timestamp=yes
osm_uid=no
osm_user=no
osm_changeset=no

# keys to report as OGR fields
#attributes=name,barrier,highway,ref,address,is_in,place,man_made
# keys that, alone, are not significant enough to report a node as a OGR point
unsignificant=created_by,converted_by,source,time,ele,attribution
# keys that should NOT be reported in the "other_tags" field
ignore=created_by,converted_by,source,time,ele,note,todo,openGeoDB:,fixme,FIXME
# uncomment to avoid creation of "other_tags" field
#other_tags=no
# uncomment to create "all_tags" field. "all_tags" and "other_tags" are exclusive
all_tags=yes
```

tippecanoe installation:
```bash
sudo apt-get install build-essential libsqlite3-dev zlib1g-dev
git clone https://github.com/mapbox/tippecanoe.git
cd tippecanoe/
make -j
make install
sudo make install
tippecanoe --version
```
