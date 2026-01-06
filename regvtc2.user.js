// ==UserScript==
// @name         Auto contrato 2
// @namespace    https://github.com/FranManre/vm-x9Q3-regvtc-helper
// @version      0.0.1
// @description  Autocompleta matrícula, fecha, hora y dirección en REGVTC
// @match        https://sede.transportes.gob.es/regvtc/gestion/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/FranManre/vm-x9Q3-regvtc-helper/main/regvtc2.user.js
// @downloadURL  https://raw.githubusercontent.com/FranManre/vm-x9Q3-regvtc-helper/main/regvtc2.user.js
// ==/UserScript==

(function () {
  'use strict';

  /* ================= CONFIG ================= */

  const date = '03/03/2025';
  const hour = '12:00';
  const matricula = '7925-MYN';
  const delay = 500;

  const domiInicioOptions = [
    "PLAZA BAYONA 1, 45223",
    "CALLE LOPE DE VEGA 25, 45223",
    "CALLE AMAPOLAS 5, 45224",
    "CALLE CAMELIAS 12, 45224",
    "CALLE ALMENDRO 9, 45224",
    "CALLE LEPANTO 9, 45224",
    "CALLE MADROÑO 7, 45224",
    "CALLE MIRAFLORES 7, 45224",
    "CALLE BARATARIA 7, 45224",
    "CAMINO DE LOS PONTONES 7, 45224"
  ];

  /* ================= ESTADO ================= */

  let isProcessing = false;
  let municipioSelectorOpened = false;
  let municipioSelected = false;

  /* ================= UTILIDADES ================= */

  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const sleep = (delay) => new Promise(resolve => setTimeout(resolve, delay));

  const clickContinuar = () =>
    [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Continuar')
      ?.click();

  const eventTypes = ['input', 'keyup', 'change'];

  function dispatchAngularEvents(el) {
    eventTypes.forEach(type => {
      const ev = document.createEvent('HTMLEvents');
      ev.initEvent(type, true, true);
      el.dispatchEvent(ev);
    });
  }

  function setValueIfNeeded(el, value) {
    if (!el || el.value === value) return false;
    el.value = value;
    dispatchAngularEvents(el);
    return true;
  }

  function getActiveStepIndex() {
    const steps = [...document.querySelectorAll('.mat-horizontal-stepper-content')];
    if (!steps.length) return -1;
    return steps.indexOf(steps.find(step => step.ariaExpanded === 'true'));
  }

  /* ================= AUTOCOMPLETE DOMI_INICIO ================= */

  function initAddressAutocomplete(input) {
    input._vmAutocompleteAttached = true;

    const container = input.closest('.mat-form-field');
    if (!container) return;

    container.style.position = 'relative';

    const box = document.createElement('div');
    box.className = 'vm-autocomplete-box';

    Object.assign(box.style, {
      position: 'absolute',
      left: '0',
      right: '0',
      top: '100%',
      background: '#fff',
      border: '1px solid #ccc',
      borderRadius: '4px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      maxHeight: '300px',
      overflowY: 'auto',
      zIndex: '1000',
      display: 'none',
      fontSize: '16px'
    });

    domiInicioOptions.forEach(text => {
      const item = document.createElement('div');
      item.textContent = text;

      Object.assign(item.style, {
        padding: '12px',
        cursor: 'pointer'
      });

      const select = (e) => {
        e.preventDefault();
        input.value = text;
        dispatchAngularEvents(input);
        box.style.display = 'none';
      };

      item.addEventListener('mousedown', select);
      item.addEventListener('click', select);

      item.addEventListener('mouseenter', () => item.style.background = '#eee');
      item.addEventListener('mouseleave', () => item.style.background = '#fff');

      box.appendChild(item);
    });

    container.appendChild(box);

    input.addEventListener('focus', () => box.style.display = 'block');
    input.addEventListener('click', () => box.style.display = 'block');

    document.addEventListener('click', e => {
      if (!container.contains(e.target)) {
        box.style.display = 'none';
      }
    });
  }

  /* ================= LÓGICA PRINCIPAL ================= */

  async function processStepsSafe() {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const stepIndex = getActiveStepIndex();
      if (stepIndex === -1) return;

      // STEP 0: MATRÍCULA
      if (stepIndex === 0) {
        const matriculaInput = document.getElementById('desc_MATRICULA');
        if (setValueIfNeeded(matriculaInput, matricula)) {
          await sleep(delay);
          clickContinuar();
        }
        return;
      }

      // STEP 1: FECHA / HORA
      if (stepIndex === 1) {
        const dateInput = document.getElementById('F_CONTRATO_DATE');
        const hourInput = document.getElementById('F_CONTRATO_HOUR');

        let changed = false;

        changed = setValueIfNeeded(dateInput, date) || changed;
        if (changed) await sleep(delay);

        changed = setValueIfNeeded(hourInput, hour) || changed;
        if (changed) {
          await sleep(delay);
          clickContinuar();
        }
        return;
      }

      // STEP 2: DOMICILIO
      if (stepIndex === 2) {
        const addressInput = document.getElementById('DOMI_INICIO');
        if (addressInput && !addressInput._vmAutocompleteAttached) {
          initAddressAutocomplete(addressInput);
          municipioSelectorOpened = false;
          municipioSelected = false;
        }

        const muniInput = document.getElementById('desc_CG_MUNI_INICIO');
        if (muniInput && muniInput.value !== 'SESEÑA' && !municipioSelectorOpened) {
          municipioSelectorOpened = true;
          muniInput.click();
          return;
        }

        const termInput = document.getElementById('term');
        if (termInput && !municipioSelected) {
          termInput.value = 'SESEÑA (TOLEDO)';
          dispatchAngularEvents(termInput);
          await sleep(delay);
          document.querySelector('mat-list-item')?.click();
          municipioSelected = true;
          await sleep(delay);
        }
        
        if (addressInput && addressInput.value === '') {
          addressInput.value = domiInicioOptions[randomInt(0, 9)];
          await sleep(delay);
          dispatchAngularEvents(addressInput);
        }
      }
    } finally {
      isProcessing = false;
    }
  }

  /* ================= OBSERVER ================= */

  const observer = new MutationObserver(processStepsSafe);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-expanded']
  });

})();