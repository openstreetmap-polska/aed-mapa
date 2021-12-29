const sidebarDivId = 'sidebar-div';
const sidebarHeaderId = 'sidebar-header';
const sidebarCaptionId = 'sidebar-caption';
const sidebarContentDivId = 'sidebar-content-div';
const sidebarFooterButtonLeftId = 'sidebar-footer-button-left';
const sidebarButtonCloseIds = ['sidebar-button-close-touch', 'sidebar-button-close-desktop'];
const formPhoneFieldId = 'form-phone';
const formAccessFieldId = 'form-access';
const formLocationFieldId = 'form-location';
const formLocationEnFieldId = 'form-location-en';
//const formIndoorFieldId = 'form-indoor';
const formEmergencyPhoneFieldId = 'form-emergency-phone';

let sidebarHeader = document.getElementById(sidebarHeaderId);
let sidebarCaption = document.getElementById(sidebarCaptionId);
let sidebarContent = document.getElementById(sidebarContentDivId);
let sidebarLink = document.getElementById(sidebarFooterButtonLeftId);

const accessToColourMapping = {
    'yes': 'has-background-green',
    'no': 'has-background-grey',
    'private': 'has-background-grey',
    'permissive': 'has-background-link-dark',
    'default': 'has-background-grey',
};

const accessToDescriptionMapping = {
    'yes': 'ogólnodostępny',
    'no': 'prywatny',
    'private': 'prywatny',
    'permissive': 'o ograniczonym dostępie',
    'default': '',
};

const indoorMapping = {
    'yes': 'tak',
    'no': 'nie',
    'default': '',
};

// --------------------------------------------------------------------------------------
function defineColor(access) {
    return accessToColourMapping[access] || accessToColourMapping['default'];
}

function defineAccessDescription(access) {
    return accessToDescriptionMapping[access] || accessToDescriptionMapping['default'];
}

function defineIndoor(indoor) {
    return indoorMapping[indoor] || indoorMapping['default'];
}

function getOsmEditLink(id) {
    return `https://www.openstreetmap.org/edit?editor=id&node=${id}`;
}

function parseOpeningHours(openingHours) {

    if (openingHours) {
        if (openingHours.includes('24/7')) {
            return 'całodobowo';
        } else {
            let hoursPrettified;

            try {
                let hours = openingHours.toString();
                let oh = new opening_hours(hours, undefined, 2);
                isOpen = oh.getState();
                hoursPrettified = oh.prettifyValue({
                    conf: {
                        locale: 'pl'
                    },
                });

            } catch (error) {
                console.log('Error when parsing opening hours');
                return undefined;
            }

            return hoursPrettified;
        }
    } else {
        return undefined;
    }
}

function isCurrentlyOpen(openingHours) {
    if (openingHours) {
        if (openingHours.includes('24/7')) {
            return true;
        } else {
            let hours = openingHours.toString();
            let oh = new opening_hours(hours, undefined, 2);
            isOpen = oh.getState();
            return isOpen;
        }
    }
}

function renderCurrentlyOpenStatus(openingHours) {
    if (isCurrentlyOpen(openingHours)) {
        return '<sup><span class="tag is-success is-light">Dostępny</span></sup>';
    } else {
        return '<sup><span class="tag is-danger is-light">Niedostępny</span></sup>';
    }
}

function renderIfIndoor(indoor) {
    let beginning = '<p class="has-text-weight-light">Wewnątrz budynku?: <span class="add-new has-text-weight-medium">';
    let middle = defineIndoor(indoor) || '<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji</span>';
    let end = '</span></p>';
    return beginning + middle + end;
}

function renderLocation(properties) {
    let beginning = '<p class="has-text-weight-light">Dokładna lokalizacja: <span class="add-new has-text-weight-medium">';
    let middle = properties['defibrillator:location:pl'] || properties['defibrillator:location'] || '<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji</span>';
    let end = '</span></p>';
    return beginning + middle + end;
}

function renderDescription(properties) {
    let beginning = '<p class="has-text-weight-light">Opis: <span class="add-new has-text-weight-medium">';
    let middle = properties['description:pl'] || properties.description || '<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji</span>';
    let end = '</span></p>';
    return beginning + middle + end;
}

function renderContactNumber(phone) {
    let beginning = '<p class="has-text-weight-light">Numer kontaktowy: <span class="add-new has-text-weight-medium">';
    let middle = phone || '<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji</span>';
    let end = '</span></p>';
    return beginning + middle + end;
}

function renderAccessibleTime(openingHours) {
    if (openingHours) {
        let beginning = '<p class="has-text-weight-light">Dostępny w godzinach: <span class="add-new has-text-weight-medium">';
        let middle = parseOpeningHours(openingHours) || '<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji </span>';
        let end = (renderCurrentlyOpenStatus(openingHours) || '') + '</span></p>';
        return beginning + middle + end;
    } else {
        return '';
    }
}

function renderNotes(properties) {
    if (properties.note || properties['note:pl']) {
        let beginning = '<p class="has-text-weight-light">Uwagi: <span class="add-new has-text-weight-medium">';
        let middle = properties['note:pl'] || properties.note || 'brak uwag';
        let end = '</span></p>';
        return beginning + middle + end;
    } else {
        return ''
    }
}

function renderSidebarContent(properties) {
    let content = '';
    content += renderIfIndoor(properties.indoor);
    content += renderLocation(properties);
    content += renderAccessibleTime(properties.opening_hours);
    content += renderDescription(properties);
    content += renderContactNumber(properties.phone);
    content += renderNotes(properties);
    return content
}

function renderSidebarForm() {
    let content = `
    <form>
    <div class="field">
      <label class="label has-text-weight-semibold">Rodzaj dostępu</label>
      <div class="control">
        <div class="select is-success">
          <select id="${formAccessFieldId}" tag="access">
            <option val="">Wybierz z listy</option>
            <option val="yes">Publicznie dostępny</option>
            <option val="private">Dostępny za zgodą właściciela</option>
            <option val="customers">Dostępny tylko w godzinach pracy</option>
          </select>
        </div>
      </div>
    </div>

    <div class="field">
      <label class="label has-text-weight-semibold">Opis lokalizacji defibrylatora</label>
      <div class="control">
        <textarea id="${formLocationFieldId}" tag="defibrillator:location" class="textarea is-success" placeholder="Na przykład: Na ścianie przy wejściu"></textarea>
      </div>
    </div>

    <div class="field">
      <label class="label has-text-weight-semibold">Telefon kontaktowy operatora</label>
      <div class="control">
        <input id="${formPhoneFieldId}" tag="phone" class="input is-success" type="text" placeholder="+48 123 456 789"
          pattern="^[+][0-9]{2}[ ]?((?:[0-9]{9})|(?:[0-9]{3} [0-9]{3} [0-9]{3})|(?:[0-9]{2} [0-9]{3} [0-9]{2} [0-9]{2}))$">
      </div>
      <p class="help has-text-weight-light">Pole opcjonalne</p>
    </div>

    <div class="field">
      <label class="label has-text-weight-semibold">Numer ratunkowy danego obszaru</label>
      <div class="control">
        <input id="${formEmergencyPhoneFieldId}" tag="emergency:phone" class="input is-success" type="text" placeholder="+48 123 456 789"
          pattern="^[+][0-9]{2}[ ]?((?:[0-9]{9})|(?:[0-9]{3} [0-9]{3} [0-9]{3})|(?:[0-9]{2} [0-9]{3} [0-9]{2} [0-9]{2}))$">
      </div>
      <p class="help has-text-weight-light">Pole opcjonalne. Wypełnij tylko, jeżeli jest inny niż 112/999.</p>
    </div>

    <div class="field">
      <label class="label has-text-weight-semibold">Opis lokalizacji defibrylatora po angielsku</label>
      <div class="control">
        <textarea id="${formLocationEnFieldId}" tag="defibrillator:location:en" class="textarea is-success" placeholder="For example: On the wall near entrance"></textarea>
      </div>
      <p class="help has-text-weight-light">Pole opcjonalne</p>
    </div>

    <form>
    `;
    return content;
}

function renderEditButton(osm_id) {
    return `<a href="${getOsmEditLink(osm_id)}" target="_blank" rel="noopener"
      class="has-background-success-light card-footer-item has-text-centered is-size-7 has-text-weight-semibold"
      >Dodaj brakujące informacje w OSM</a>`;
}

function renderSaveButton() {
    return `<button id="sidebar-save-button" class="button is-success is-fullwidth" onclick="saveNode(prepareNodeData())">Dodaj AED</button>`;
}

// --------------------------------------------------------------
function prepareNodeData() {
    let data = {};
    // get coordinates
    let markerPosition = marker.getLngLat();
    data.lng = markerPosition.lng;
    data.lat = markerPosition.lat;
    // get additional tags
    data.tags = {};
    let formPhoneField = document.getElementById(formPhoneFieldId);
    let formLocationField = document.getElementById(formLocationFieldId);
    let formEmergencyPhoneField = document.getElementById(formEmergencyPhoneFieldId);
    let formLocationEnField = document.getElementById(formLocationEnFieldId);
    let formAccessField = document.getElementById(formAccessFieldId);
//    let formIndoorField = document.getElementById(formIndoorFieldId);
//    if (formIndoorField.value) data.tags[formIndoorField.getAttribute('tag')] = formIndoorField.getAttribute('val');
    if (formPhoneField.value) data.tags[formPhoneField.getAttribute('tag')] = formPhoneField.value;
    if (formLocationField.value) data.tags[formLocationField.getAttribute('tag')] = formLocationField.value;
    if (formEmergencyPhoneField.value) data.tags[formEmergencyPhoneField.getAttribute('tag')] = formEmergencyPhoneField.value;
    if (formLocationEnField.value) data.tags[formLocationEnField.getAttribute('tag')] = formLocationEnField.value;
    if (formAccessField.selectedOptions[0].getAttribute('val'))
        data.tags[formAccessField.getAttribute('tag')] = formAccessField.selectedOptions[0].getAttribute('val');

    return data
}

function removeMarkerIfExists() {
    if (marker !== null) {
        marker.remove();
        marker = null;
    }
}

function showSidebar(properties) {
    let sidebar = document.getElementById(sidebarDivId);
    if (sidebar) {
        sidebar.classList.remove('is-invisible');
        if (properties.action === "showDetails") {
            prepareSidebarShowingObjectInfo(properties.data);
            removeMarkerIfExists();
        } else if (properties.action === "addNode") {
            prepareSidebarAddingNode(properties.data);
        } else
            console.log(`Unknown action: ${properties.action}.`);
    } else
        console.log('Sidebar not found.');
}

function hideSidebar() {
    let sidebar = document.getElementById(sidebarDivId);
    if (sidebar) {
        sidebar.classList.add('is-invisible');
        removeMarkerIfExists();
    } else {
        console.log('Sidebar not found.');
    }
}

function prepareSidebarShowingObjectInfo(properties) {
    sidebarHeader.classList = [];
    sidebarHeader.classList.add(defineColor(properties.access));
    sidebarCaption.innerHTML = `defibrylator AED ${defineAccessDescription(properties.access)}`;

    sidebarContent.innerHTML = renderSidebarContent(properties);

    sidebarLink.innerHTML = renderEditButton(properties.osm_id);
}

function prepareSidebarAddingNode(properties) {
    sidebarHeader.classList = [];
    sidebarHeader.classList.add(defineColor('default'));
    sidebarCaption.innerHTML = 'Dodaj defibrylator';

    sidebarContent.innerHTML = renderSidebarForm();

    sidebarLink.innerHTML = renderSaveButton();
}

// --------------------------------------------------------------------------------------
// Bulma controls
document.addEventListener('DOMContentLoaded', () => {

    // Get all "navbar-burger" elements
    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

    // Check if there are any navbar burgers
    if ($navbarBurgers.length > 0) {

        // Add a click event on each of them
        $navbarBurgers.forEach(el => {
            el.addEventListener('click', () => {

                // Get the target from the "data-target" attribute
                const target = el.dataset.target;
                const $target = document.getElementById(target);

                // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
                el.classList.toggle('is-active');
                $target.classList.toggle('is-active');

            });
        });
    }
});
// button listeners
sidebarButtonCloseIds.forEach(id => {
    document.getElementById(id).addEventListener('click', hideSidebar);
});