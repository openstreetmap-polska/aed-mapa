var map = new maplibregl.Map({
    'container': 'map', // container id
    'center': [20, 52], // starting position [lng, lat]
    'zoom': 6, // starting zoom
    'hash': 'map',
    'style': {
        'version': 8,
        "glyphs": "http://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
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

function mapTag(tagName, tagValue, language) 
{

}

function defineColor(access){
    accessValues = {
        'yes': 'has-background-green',
        'no': 'has-background-grey',
        'private': 'has-background-grey',
        'permissive': 'has-background-link-dark',
        'default': 'has-background-grey'
    };

    accessClass = accessValues[access] || accessValues['default'];
    return accessClass;
}

function defineAccessDescription(access){
    accessValues = {
        'yes': 'ogólnodostępny',
        'no': 'prywatny',
        'private': 'prywatny',
        'permissive': 'o ograniczonej dostępności',
        'default': ''
    };

    accessClass = accessValues[access] || accessValues['default'];
    return accessClass;
}

function defineOpeningHours(openingHours)
{

    if (openingHours) {
        if (openingHours.includes('24/7')) {
            return '<span class="add-new has-text-weight-medium">Dostępny całodobowo</span>';
        }
        else {
            return openingHours;
        }
    }
    else {
        return 'uzupełnij godziny dostępności';
    }
}

function defineIndoor(indoor)
{

    if (indoor == 'yes') {
        return 'Wewnątrz budynku: <span class="add-new has-text-weight-medium">tak</span>';
    }
    else if (indoor = 'no') {
        return 'Wewnątrz budynku: <span class="add-new has-text-weight-medium">nie</span>';
    }
    else {
        return 'Wewnątrz budynku: brak informacji';
    }
}

function showSidebar(properties) {
    // SIDEBAR - UI
    let sidebar = document.getElementsByClassName('sidebar')[0];
    if (sidebar) {
        sidebar.classList.remove('is-invisible');
        createSidebar(properties);
    }
    else {
        console.log('sidebar not found');
        }

    }
    
function hideSidebar() {
    let sidebar = document.getElementsByClassName('sidebar')[0];
    if (sidebar) {
        sidebar.classList.add('is-invisible');
    }
    else {
        console.log('sidebar not found');
        }
    }

function createSidebar(properties)
{
    let sidebarCaption = document.getElementById('sidebar-caption');
    let sidebarTitle = document.getElementById('poi-title');
    let sidebarContent = document.getElementsByClassName('content')[0];
    sidebarContent.innerHTML = '';

    let sidebarHeader = document.getElementById('sidebar-header');
    let sidebarSubheader = document.getElementsByClassName('column is-half')[0];
    let sidebarSubheaderIndoor = document.getElementsByClassName('column is-half')[1];
    sidebarSubheaderIndoor.innerHTML = '';

    sidebarHeader.classList = [];
    let sidebarLink = document.getElementsByClassName('card-footer-item')[0];

    // PRESENTATION
    sidebarHeader.classList.add(defineColor(properties.access));
    sidebarSubheader.innerHTML = defineOpeningHours(properties.opening_hours);
    sidebarSubheaderIndoor.innerHTML = defineIndoor(properties.indoor);
    sidebarCaption.innerHTML = `defibrylator  ${defineAccessDescription(properties.access)}`;
    sidebarContent.innerHTML = ` 
        <p class="has-text-weight-light">Dokładna lokalizacja: <span class="add-new has-text-weight-medium">${properties['defibrillator:location:pl'] || properties['defibrillator:location'] || 'brak - uzupełnij'}</span></p>
        <p class="has-text-weight-light">Opis: <span class="add-new has-text-weight-medium">${properties['description:pl'] || properties['description'] || 'brak - uzupełnij'}</span></p>
        <p class="has-text-weight-light">Numer kontaktowy: <span class="add-new has-text-weight-medium">${properties.phone || 'brak - uzupełnij'}</span></p>

        <p class="has-text-weight-light">Uwagi: <span class="add-new has-text-weight-medium">${properties['note:pl'] || properties['note'] || 'brak uwag'}</span></p>
    `;
    sidebarLink.setAttribute("href", `https://www.openstreetmap.org/edit?editor=id&node=${properties.osm_id}`);
}

map.on('load', () => {
    map.loadImage('./aed_240px.png', (error, image) => {
        if (error) throw error;
        map.addImage('aed-icon', image, {
            'sdf': false
        });
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
                'icon-size': 0.15,
            },
            'filter': ['!', ['has', 'point_count']],
        });
        map.addLayer({
            'id': 'clustered-circle',
            'type': 'circle',
            'source': 'aed-locations',
            'paint': {
                'circle-color': '#008954',
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
        map.on('click', 'unclustered', function (e) {
                if (e.features[0].properties !== undefined) {
                    showSidebar(e.features[0].properties);
                }
            });
    });
});