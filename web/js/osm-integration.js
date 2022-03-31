// osm integration stuff
// to be filled during deploy
var auth = osmAuth({
    oauth_consumer_key: '<< oauth_consumer_key >>',
    oauth_secret: '<< oauth_secret >>',
    url: "<< url >>",
    landing: 'land.html',
});
// global variables
var openChangesetId = null;
var marker = null;
const markerColour = "#e81224";

// --------------------------------------------------------------------------------------
function getOpenChangesetId() {
    return new Promise((resolve, reject) => {
        if (openChangesetId !== null) {
            resolve(openChangesetId);
        } else {
            var root = document.implementation.createDocument(null, "osm");
            var changeset = document.createElementNS(null, "changeset");
            var comment = document.createElementNS(null, "tag");
            comment.setAttribute("k", "comment");
            comment.setAttribute("v", "Defibrillator added via https://aed.openstreetmap.org.pl #aed");
            var created_by = document.createElementNS(null, "tag");
            created_by.setAttribute("k", "created_by");
            created_by.setAttribute("v", "https://aed.openstreetmap.org.pl");
            var locale = document.createElementNS(null, "tag");
            locale.setAttribute("k", "locale");
            locale.setAttribute("v", "pl");
            var hashtags = document.createElementNS(null, "tag");
            hashtags.setAttribute("k", "hashtags");
            hashtags.setAttribute("v", "#aed");
            changeset.appendChild(comment);
            changeset.appendChild(created_by);
            changeset.appendChild(locale);
            changeset.appendChild(hashtags);
            root.documentElement.appendChild(changeset);
            let serializer = new XMLSerializer();
            let data = serializer.serializeToString(root);

            auth.xhr({
                method: 'PUT',
                path: '/api/0.6/changeset/create',
                content: data,
                options: {
                    header: {
                        "Content-Type": "text/xml"
                    }
                },
            }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    openChangesetId = res;
                    console.log('Api returned changeset id: ' + res);
                    resolve(res);
                }
            });
        }
    });
}

function getNodeUrl(nodeId) {
    return `${auth.options().url}/node/${nodeId}`;
}

function renderMarkerPopup() {
    return "Przesuń marker w docelowe miejsce"
}

function renderModalMessage(newNodeUrl) {
    return `
    <p class="pb-2">AED dodany z powodzeniem.</p>
    <p class="pb-4">Dostępny jest w bazie OpenStreetMap pod adresem: <a target="_blank" rel="noopener" href="${newNodeUrl}">${newNodeUrl}</a></p>
    <p class="pb-2">Obiekt powinien być widoczny na mapie w ciągu maksymalnie <strong>60</strong> minut.</p>`;
}

function renderModalErrorMessage(message) {
    return `<p class="pb-2">Wystąpił błąd: ${message}</p>`;
}

function renderModalNeedLoginMessage() {
    return `<p class="pb-3">Żeby dodawać obiekty musisz się zalogować kontem OpenStreetMap.</p>
    ${renderLoginButton()}
    `;
}

function renderModalNeedMoreZoomMessage() {
    let zoomInfo = "";
    if (map) zoomInfo = `, obecnie: ${map.getZoom().toFixed(2)}`;
    return `<p class="pb-2">Żeby dodawać obiekty musisz bardziej przybliżyć mapę, aby podana lokalizacja była możliwie dokładna. (zoom >= 15${zoomInfo})</p>`;
}

function showNeedMoreZoomModal() {
    let modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = renderModalNeedMoreZoomMessage();
    openModal();
}

function showNeedLoginModal() {
    let modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = renderModalNeedLoginMessage();
    openModal();
}

function showSuccessModal(newNodeId) {
    let modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = renderModalMessage(getNodeUrl(newNodeId));
    openModal();
}

function showFailureModal(message) {
    let modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = renderModalErrorMessage(message);
    openModal();
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
        // hide sidebar
        sidebar.classList.add('is-invisible');
        // remove marker
        if (marker !== null) {
            marker.remove();
            marker = null;
        }
        // restore buttons
        let mobileButton1 = document.getElementById('addNode-mobile-1');
        let mobileButton2 = document.getElementById('addNode-mobile-2');
        let mobileButton3 = document.getElementById('addNode-mobile-3');
        mobileButton1.classList.remove('is-hidden');
        mobileButton2.classList.add('is-hidden');
        mobileButton3.classList.add('is-hidden');
    } else {
        console.log('sidebar not found.');
    }
}

function addDefibrillatorToOSM(changesetId, data) {
    return new Promise((resolve, reject) => {
        console.log('sending request to create node in changeset: ' + changesetId);

        var root = document.implementation.createDocument(null, "osm");
        var node = document.createElementNS(null, "node");
        node.setAttribute("changeset", changesetId);
        node.setAttribute("lat", data.lat);
        node.setAttribute("lon", data.lng);
        var emergency = document.createElementNS(null, "tag");
        emergency.setAttribute("k", "emergency");
        emergency.setAttribute("v", "defibrillator");
        node.appendChild(emergency);
        Object.entries(data.tags).map(arr => {
            var tag = document.createElementNS(null, "tag");
            tag.setAttribute("k", arr[0]);
            tag.setAttribute("v", arr[1]);
            return tag;
        }).forEach(el => {
            node.appendChild(el);
        });
        root.documentElement.appendChild(node);
        let serializer = new XMLSerializer();
        let xml = serializer.serializeToString(root);

        console.log('payload: ' + xml);
        auth.xhr({
            method: 'PUT',
            path: '/api/0.6/node/create',
            content: xml,
            options: {
                header: {
                    "Content-Type": "text/xml"
                }
            },
        }, (err, res) => {
            if (err) reject(err);
            else {
                resolve(res);
                console.log(`API returned node id: ${res}`);
            }
        });
    });
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
            return addDefibrillatorToOSM(changesetId, data);
        })
        .then(newNodeId => {
            stopSaveButtonAnimation();
            showSuccessModal(newNodeId);
        })
        .catch(err => {
            stopSaveButtonAnimation();
            console.log(err);
            showFailureModal(`${err} <br> status: ${err.status} ${err.statusText} <br> ${err.response}`);
        });
}

function addMarkerAndOpenSidebar() {
    // add marker
    const mapCenter = map.getCenter();
    const initialCoordinates = [mapCenter.lng, mapCenter.lat];
    if (marker !== null) marker.remove();
    marker = new maplibregl.Marker({
            draggable: true,
            color: markerColour,
        })
        .setLngLat(initialCoordinates);
    //add popup
    marker.setPopup(new maplibregl.Popup().setHTML(renderMarkerPopup()))
    marker.addTo(map);
    marker.togglePopup();
    // show sidebar
    let properties = {
        action: "addNode",
        data: {},
    };
    showSidebar(properties);
};

document.getElementById('addNode').onclick = addMarkerAndOpenSidebar;

function mobileButton1onClick() {
    // add marker
    const mapCenter = map.getCenter();
    const initialCoordinates = [mapCenter.lng, mapCenter.lat];
    if (marker !== null) marker.remove();
    marker = new maplibregl.Marker({
            draggable: true,
            color: markerColour,
        })
        .setLngLat(initialCoordinates);
    //add popup
    marker.setPopup(new maplibregl.Popup().setHTML(renderMarkerPopup()));
    marker.addTo(map);
    marker.togglePopup();
    // swap buttons
    let mobileButton1 = document.getElementById('addNode-mobile-1');
    let mobileButton2 = document.getElementById('addNode-mobile-2');
    let mobileButton3 = document.getElementById('addNode-mobile-3');
    mobileButton1.classList.add('is-hidden');
    mobileButton2.classList.remove('is-hidden');
    mobileButton3.classList.remove('is-hidden');
}
document.getElementById('addNode-mobile-1').onclick = mobileButton1onClick;

document.getElementById('addNode-mobile-2').onclick = function () {
    // show sidebar
    let properties = {
        action: "addNode",
        data: {},
    };
    showSidebar(properties);
    // hide buttons
    let mobileButton2 = document.getElementById('addNode-mobile-2');
    let mobileButton3 = document.getElementById('addNode-mobile-3');
    mobileButton2.classList.add('is-hidden');
    mobileButton3.classList.add('is-hidden');
};

document.getElementById('addNode-mobile-3').onclick = function () {
    // remove marker if exists
    if (marker !== null) marker.remove();
    // restore buttons
    let mobileButton1 = document.getElementById('addNode-mobile-1');
    let mobileButton2 = document.getElementById('addNode-mobile-2');
    let mobileButton3 = document.getElementById('addNode-mobile-3');
    mobileButton1.classList.remove('is-hidden');
    mobileButton2.classList.add('is-hidden');
    mobileButton3.classList.add('is-hidden');
};

function updateNavbarLoggedUserState() {
    let navbar = document.getElementById('navbar-logged');

    if (!auth.authenticated()) {
        navbar.classList.add('is-hidden');
    } else {
        navbar.classList.remove('is-hidden');
    }
}

function logoutAction() {
    auth.logout();
    update();
}

document.getElementById('logout').onclick = logoutAction;

function authenticateAction() {
    if (!auth.bringPopupWindowToFront()) {
        auth.authenticate(function () {
            update();
            closeModal();
        });
    }
}

function renderLoginButton() {
    return '<button class="button is-white is-outlined" onclick="authenticateAction()">Zaloguj kontem OSM</button>';
}

function renderUserLoggedIn(username) {
    return `<svg class="icon mr-1" style="width:24px;height:24px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
            </svg> ${username}`;
}

function renderErrorLoggingIn() {
    return '<p>Problem podczas logowania. Spróbuj wyczyścić cache (ctrl+f5).</p>';
}

function updateAddNodeButtonState() {
    let addNodeButton = document.getElementById('addNode');
    let mobileButton1 = document.getElementById('addNode-mobile-1');
    addNodeButton.onclick = addMarkerAndOpenSidebar;
    mobileButton1.onclick = mobileButton1onClick;
    if (!auth.authenticated()) {
        addNodeButton.onclick = showNeedLoginModal;
        mobileButton1.onclick = showNeedLoginModal;
    }
    if (map.getZoom() < 15) {
        addNodeButton.onclick = showNeedMoreZoomModal;
        mobileButton1.onclick = showNeedMoreZoomModal;
    }
}

map.on('zoomend', updateAddNodeButtonState);

function update() {
    if (auth.authenticated()) {
        auth.xhr({
            method: 'GET',
            path: '/api/0.6/user/details'
        }, (err, res) => {
            if (err) {
                updateAddNodeButtonState();
                showFailureModal(`${err} <br> status: ${err.status} ${err.statusText} <br> ${err.response}`);
            } else {
                const u = res.getElementsByTagName('user')[0];
                const user_name = u.getAttribute('display_name');
                const user_with_id = `${user_name}`;
                document.getElementById('span-login').innerHTML = '';
                document.getElementById('span-login').classList.add('is-hidden');
                document.getElementById('navbar-username').innerHTML = renderUserLoggedIn(user_with_id);
                updateAddNodeButtonState();
                updateNavbarLoggedUserState();
            }
        });
    } else {
        document.getElementById('span-login').innerHTML = renderLoginButton();
        updateAddNodeButtonState();
        updateNavbarLoggedUserState();
    }
}

update();
