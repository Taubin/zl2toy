/* ZL2TOY station page logic. External file so it runs under a strict Content-Security-Policy.
   Station details live in the <script type="application/json" id="station-config"> block in the HTML. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return String(n).padStart(2, '0'); };

  // UTC clock first, so nothing below can stop it
  var clock = $('utc-clock');
  function tick() {
    var d = new Date();
    clock.textContent = pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + ' UTC';
  }
  if (clock) { tick(); setInterval(tick, 1000); }

  var S;
  try { S = JSON.parse($('station-config').textContent); } catch (e) { return; }

  document.title = S.callsign + ' \u2022 ' + S.name + ' \u2022 ' + S.city;
  $('callsign').textContent = S.callsign;
  $('f-call').textContent = S.callsign;
  $('op-name').textContent = S.name;
  $('op-qth').textContent = S.qth;
  $('t-grid').textContent = S.grid;
  $('t-cq').textContent = S.cq;
  $('t-itu').textContent = S.itu;
  $('t-off').textContent = S.utcOffset;
  $('qrz-btn').href = S.qrz;
  $('psk-btn').href = 'https://pskreporter.info/pskmap.html?preset&callsign=' + encodeURIComponent(S.callsign) + '&timerange=86400';

  [['s-rig', 'rig'], ['s-ant', 'antenna'], ['s-modes', 'modes'], ['s-bands', 'bands'], ['s-qsl', 'qsl'], ['s-contact', 'contact']].forEach(function (pair) {
    var dd = $(pair[0]), val = S[pair[1]];
    if (val) {
      dd.textContent = val;
      dd.hidden = false;
      if (dd.previousElementSibling) dd.previousElementSibling.hidden = false;
    }
  });

  // "ON AIR" only when status.json says so; otherwise the badge stays QRV
  fetch(S.statusUrl, { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (st) {
      if (st && st.on_air) {
        var b = $('status-badge');
        b.textContent = 'ON AIR';
        b.classList.add('live');
      }
    })
    .catch(function () {});

  // Recent spots strip; hidden if spots.json is missing or empty
  fetch(S.spotsUrl, { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (list) {
      if (!Array.isArray(list) || !list.length) return;
      var rows = $('spot-rows');
      list.slice(0, 6).forEach(function (s) {
        var t = new Date(s.t);
        var row = document.createElement('div');
        row.className = 'spot-row';
        [isNaN(t) ? '' : pad(t.getUTCHours()) + ':' + pad(t.getUTCMinutes()) + 'Z', s.call || '', s.band || '', s.snr != null ? s.snr + ' dB' : '']
          .forEach(function (txt) { var c = document.createElement('span'); c.textContent = txt; row.appendChild(c); });
        rows.appendChild(row);
      });
      $('spots').hidden = false;
    })
    .catch(function () {});
})();