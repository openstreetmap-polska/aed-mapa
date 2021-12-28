// osm integration stuff
var auth = osmAuth({
    oauth_consumer_key: 'SVN3D2Q8ciaIbHCdHbhuiG7mEwvOGbnSDcy1ZgnV',
    oauth_secret: 'alqjD88o2qtdN9ZwtOfanqqu5Rbp2lhIxbGFukTD',
    url: "https://master.apis.dev.openstreetmap.org",
    landing: 'land.html',

});
var openChangesetId = null;
var marker = null;

function getOpenChangesetId() {
    return new Promise((resolve, reject) => {
        if (openChangesetId !== null) {
            resolve(openChangesetId);
        } else {
            let data = '<osm><changeset>' +
                '<tag k="comment" v="Defibrillator added via https://aed.openstreetmap.org.pl #aed"/>' +
                '<tag k="created_by" v="https://aed.openstreetmap.org.pl"/>' +
                '<tag k="locale" v="pl"/>' +
                '<tag k="hashtags" v="#aed"/>' +
                '</changeset></osm>';
            auth.xhr({
                method: 'PUT',
                path: '/api/0.6/changeset/create',
                content: data,
                options: {header: {"Content-Type": "text/xml"}},
            }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    openChangesetId = res;
                    console.log('api returned changeset id: ' + res);
                    resolve(res);
                }
            })
        }
    })
}

function done(err, res) {
    if (err) {
        document.getElementById('user').innerHTML = 'error! try clearing your browser cache';
        document.getElementById('user').style.display = 'block';
        return;
    }
    var u = res.getElementsByTagName('user')[0];
    var changesets = res.getElementsByTagName('changesets')[0];
    var o = {
        display_name: u.getAttribute('display_name'),
        id: u.getAttribute('id'),
        count: changesets.getAttribute('count')
    };
    for (var k in o) {
        document.getElementById(k).innerHTML = o[k];
    }
    document.getElementById('user').style.display = 'block';
}

document.getElementById('authenticate').onclick = function() {
    if (!auth.bringPopupWindowToFront()) {
        auth.authenticate(function() {
            update();
        });
    }
};

function showDetails() {
    auth.xhr({
        method: 'GET',
        path: '/api/0.6/user/details'
    }, done);
}

function getNodeUrl(nodeId) {
    return `${auth.options().url}/node/${nodeId}`
}

function renderModalMessage(newNodeUrl) {
    return `<p>Dodano element: <a target="_blank" rel="noopener" href="${newNodeUrl}">${newNodeUrl}</a></p>`
}

function renderModalErrorMessage(message) {
    return `<p>Wystąpił błąd: ${message}</p>`
}

function showSuccessModal(newNodeId) {
    let modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = renderModalMessage(getNodeUrl(newNodeId));
    openModal()
}

function showFailureModal(message) {
    let modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = renderModalErrorMessage(message);
    openModal()
}

function openModal() {
    let modal = document.getElementById('modal-div');
    modal.classList.add('is-clipped');
    modal.classList.add('is-active');
}

function closeModal() {
    // close modal
    let modal = document.getElementById('modal-div');
    modal.classList.remove('is-clipped');
    modal.classList.remove('is-active');
    // remove marker and close sidebar too
    let sidebar = document.getElementById('sidebar-div');
    if (sidebar) {
        sidebar.classList.add('is-invisible');
        if (marker !== null) {
            marker.remove();
            marker = null;
        }
    } else {
        console.log('Sidebar not found.');
    }
}

function addDefibrillatorToOSM(changesetId, data) {
    return new Promise((resolve, reject) => {
        console.log('sending request to create node in changeset: ' + changesetId);
        var xml = `<osm><node changeset="${changesetId}" lat="${data.lat}" lon="${data.lng}">`;
        xml += `<tag k="emergency" v="defibrillator"/>`;
        xml += Object.entries(data.tags).map(arr => `<tag k="${arr[0]}" v="${arr[1]}"/>`).join('');
        xml += `</node></osm>`;
        console.log('payload: ' + xml);
        auth.xhr({
            method: 'PUT',
            path: '/api/0.6/node/create',
            content: xml,
            options: {header: {"Content-Type": "text/xml"}},
        }, (err, res) => {
            if (err) reject(err);
            else {resolve(res); console.log(`response: ${res}`)}
        });
    })
}

function startSaveButtonAnimation() {
    let saveButton = document.getElementById('sidebar-save-button');
    saveButton.classList.add('is-loading');
    saveButton.disabled = true;
}

function stopSaveButtonAnimation() {
    let saveButton = document.getElementById('sidebar-save-button');
    saveButton.classList.remove('is-loading');
    saveButton.disabled = false;
}

function saveNode(data) {
    startSaveButtonAnimation();
    getOpenChangesetId()
    .then(changesetId => {
        return addDefibrillatorToOSM(changesetId, data)
    })
    .then(newNodeId => {
        stopSaveButtonAnimation();
        showSuccessModal(newNodeId);
    })
    .catch(err => {
        stopSaveButtonAnimation();
        console.log(err);
        showFailureModal(err);
    });
}

document.getElementById('addNode').onclick = function() {
    // add marker
    const mapCenter = map.getCenter();
    const initialCoordinates = [mapCenter.lng, mapCenter.lat];
    if (marker !== null) marker.remove();
    marker = new maplibregl.Marker({
        draggable: true
    })
    .setLngLat(initialCoordinates);
    marker.addTo(map);
    // show sidebar
    let properties = {
        action: "addNode",
        data: {},
    };
    showSidebar(properties);
};

function hideDetails() {
    document.getElementById('user').style.display = 'none';
}

document.getElementById('logout').onclick = function() {
    auth.logout();
    update();
};

function update() {
    if (auth.authenticated()) {
        document.getElementById('authenticate').className = 'done';
        document.getElementById('logout').className = '';
        showDetails();
    } else {
        document.getElementById('authenticate').className = '';
        document.getElementById('logout').className = 'done';
        hideDetails();
    }
}

update();
