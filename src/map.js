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
            'maxzoom': 19,
        }, ]
    },
});

let control = new maplibregl.NavigationControl();
map.addControl(control, 'bottom-right');

function defineColor(access) {
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

function defineAccessDescription(access) {
    accessValues = {
        'yes': 'ogólnodostępny',
        'no': 'prywatny',
        'private': 'prywatny',
        'permissive': 'o ograniczonym dostępie',
        'default': ''
    };

    accessClass = accessValues[access] || accessValues['default'];
    return accessClass;
}

function defineOpeningHours(openingHours) {
    let openingHoursIcon = `
    <span class="icon">
        <svg class="mr-1" style="width:24px;height:24px" viewBox="0 0 24 24">
            <path fill="currentColor" d="M15,13H16.5V15.82L18.94,17.23L18.19,18.53L15,16.69V13M19,8H5V19H9.67C9.24,18.09 9,17.07 9,16A7,7 0 0,1 16,9C17.07,9 18.09,9.24 19,9.67V8M5,21C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H6V1H8V3H16V1H18V3H19A2,2 0 0,1 21,5V11.1C22.24,12.36 23,14.09 23,16A7,7 0 0,1 16,23C14.09,23 12.36,22.24 11.1,21H5M16,11.15A4.85,4.85 0 0,0 11.15,16C11.15,18.68 13.32,20.85 16,20.85A4.85,4.85 0 0,0 20.85,16C20.85,13.32 18.68,11.15 16,11.15Z" />
        </svg>
    </span>`;

    if (openingHours) {
        if (openingHours.includes('24/7')) {
            return '<span class="icon-text">' + openingHoursIcon + '<span class="has-text-weight-medium">Dostępny całodobowo</span></span>';
        } else {
            return '<span class="icon-text">' + openingHoursIcon + ' ' + openingHours + '</span></span>';
        }
    } else {
        return '<span class="icon-text">' + openingHoursIcon + '<sup>dostępność: uzupełnij</sup></span></span>';
    }
}

function defineIndoor(indoor) {
    let indoorIcon = `
    <span class="icon"><svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path fill="currentColor" d="M5,3V21H11V17.5H13V21H19V3H5M7,5H9V7H7V5M11,5H13V7H11V5M15,5H17V7H15V5M7,9H9V11H7V9M11,9H13V11H11V9M15,9H17V11H15V9M7,13H9V15H7V13M11,13H13V15H11V13M15,13H17V15H15V13M7,17H9V19H7V17M15,17H17V19H15V17Z" />
    </svg></span>`;

    if (indoor == 'yes') {
        return '<span class="icon-text">' + indoorIcon + ' Wewnątrz budynku<span>';
    } else if (indoor == 'no') {
        return '<span class="icon-text">' + indoorIcon + ' Na zewnątrz</span>';
    } else {
        return '<span class="icon-text">' + indoorIcon + ` <sup>W budynku/zew.? - uzupełnij</sup></span>`;
    }
}

function showSidebar(properties) {
    // SIDEBAR - UI
    let sidebar = document.getElementsByClassName('sidebar')[0];
    if (sidebar) {
        sidebar.classList.remove('is-invisible');
        createSidebar(properties);
    } else {
        console.log('sidebar not found');
    }

}

function hideSidebar() {
    let sidebar = document.getElementsByClassName('sidebar')[0];
    if (sidebar) {
        sidebar.classList.add('is-invisible');
    } else {
        console.log('sidebar not found');
    }
}

function getOsmEditLink(id) {
    return `https://www.openstreetmap.org/edit?editor=id&node=${id}`;
}

function createSidebar(properties) {
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
    sidebarCaption.innerHTML = `defibrylator AED ${defineAccessDescription(properties.access)}`;
    sidebarContent.innerHTML = ` 
        <p class="has-text-weight-light">Dokładna lokalizacja: <span class="add-new has-text-weight-medium">${properties['defibrillator:location:pl'] || properties['defibrillator:location'] || `<sup>brak informacji - <a href="${getOsmEditLink(properties.osm_id)}">uzupełnij</a></sup>`}</span></p>
        <p class="has-text-weight-light">Opis: <span class="add-new has-text-weight-medium">${properties['description:pl'] || properties.description || `<sup>brak informacji - <a href="${getOsmEditLink(properties.osm_id)}">uzupełnij</a></sup>`}</span></p>
        <p class="has-text-weight-light">Numer kontaktowy: <span class="add-new has-text-weight-medium">${properties.phone || `<sup>brak informacji - <a href="${getOsmEditLink(properties.osm_id)}">uzupełnij</a></sup>`}</span></p>
    `;
    
    if (properties.note || properties['note:pl'])
    {
        sidebarContent.innerHTML += `<p class="has-text-weight-light">Uwagi: <span class="add-new has-text-weight-medium">${properties['note:pl'] || properties.note || 'brak uwag'}</span></p>`;
    }

    sidebarLink.setAttribute("href", getOsmEditLink(properties.osm_id));
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
        map.on('click', 'unclustered', function (e) {
            if (e.features[0].properties !== undefined) {
                showSidebar(e.features[0].properties);
            }
        });
    });
});
