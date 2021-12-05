var map = new maplibregl.Map({
    'container': 'map', // container id
    'center': [20, 52], // starting position [lng, lat]
    'zoom': 6, // starting zoom
    'hash': 'map',
    'style': {
        'version': 8,
        "glyphs": "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
        'sources': {
            'raster-tiles': {
                'type': 'raster',
                'tiles': [
                    'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                ],
                'tileSize': 256,
                'attribution': 'map © <a target="_top" rel="noopener" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.',
            },
        },
        'layers': [{
            'id': 'background',
            'type': 'raster',
            'source': 'raster-tiles',
            'minzoom': 0,
            'maxzoom': 22,
        }, ]
    },
});

map.on('load', () => {
    map.loadImage('./aed_240px.png', (error, image) => {
        if (error) throw error;
        map.addImage('aed-icon', image, { 'sdf': false });
        map.addSource('aed-locations', {
            'type': 'geojson',
            'data': './aed_poland.geojson',
            'cluster': true,
        });
        map.addLayer({
            'id': 'unclustered',
            'type': 'symbol',
            'source': 'aed-locations',
            'layout': {
                'icon-image': ['image', 'aed-icon'],
                'icon-size': 0.1,
            },
            'filter': ['!', ['has', 'point_count']],
        });
        map.addLayer({
            'id': 'clustered-circle',
            'type': 'circle',
            'source': 'aed-locations',
            'paint': {
                'circle-color': 'rgba(204, 255, 51, 0.72)',
                'circle-radius': 30,
                'circle-stroke-color': '#fff',
                'circle-stroke-width': 3,
            },
            'filter': ['has', 'point_count'],
        });
        map.addLayer({
            'id': 'clustered-label',
            'type': 'symbol',
            'source': 'aed-locations',
            'layout': {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['Open Sans Bold'],
                'text-size': 18,
            },
            'paint': {
                'text-halo-width': 2,
                'text-halo-color': 'white',
            },
            'filter': ['has', 'point_count'],
        });
    });
});
