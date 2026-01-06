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
  const municipio = 'SESEÑA';
  const municipioFull = 'SESEÑA (TOLEDO)';
  const delay = 500;

  const addresses = [
    'PLAZA BAYONA 1, 45223',
    'CALLE LOPE DE VEGA 25, 45223',
    'CALLE AMAPOLAS 5, 45224',
    'CALLE CAMELIAS 12, 45224',
    'CALLE ALMENDRO 9, 45224',
    'CALLE LEPANTO 9, 45224',
    'CALLE MADROÑO 7, 45224',
    'CALLE MIRAFLORES 7, 45224',
    'CALLE BARATARIA 7, 45224',
    'CAMINO DE LOS PONTONES 7, 45224'
  ];

  /* ================= UTILS ================= */

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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

  /* ================= STEPS ================= */

  function getActiveStepIndex() {
    const steps = [...document.querySelectorAll('.mat-horizontal-stepper-content')];
    return steps.indexOf(steps.find(s => s.ariaExpanded === 'true'));
  }

  function initAddressAutocomplete(input) {
    if (!input || input._vmAutocompleteAttached) return;
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
      maxHeight: '220px',
      overflowY: 'auto',
      zIndex: '1000',
      fontSize: '16px',
      display: 'none',
      touchAction: 'pan-y'
    });

    addresses.forEach(text => {
      const item = document.createElement('div');
      item.textContent = text;

      Object.assign(item.style, {
        padding: '12px',
        cursor: 'pointer'
      });

      item.addEventListener('click', () => {
        input.value = text;
        dispatchAngularEvents(input);
        box.style.display = 'none';
      });

      item.addEventListener('mouseenter', () => item.style.background = '#eee');
      item.addEventListener('mouseleave', () => item.style.background = '#fff');

      box.appendChild(item);
    });

    container.appendChild(box);

    input.addEventListener('focus', () => box.style.display = 'block');
    input.addEventListener('click', () => box.style.display = 'block');

    document.addEventListener('click', e => {
      if (!container.contains(e.target)) box.style.display = 'none';
    });
  }

  async function processSteps() {
    let changed = false;
    const stepIndex = getActiveStepIndex();
    if (stepIndex === -1) return;

    /* STEP 0 */
    if (stepIndex === 0) {
      const input = document.getElementById('desc_MATRICULA');
      changed = setValueIfNeeded(input, matricula);

      if (changed) {
        await sleep(delay);
        clickContinuar();
      }
      return;
    }

    /* STEP 1 */
    if (stepIndex === 1) {
      changed |= setValueIfNeeded(
        document.getElementById('F_CONTRATO_DATE'),
        date
      );
      if (changed) await sleep(delay);

      changed |= setValueIfNeeded(
        document.getElementById('F_CONTRATO_HOUR'),
        hour
      );
      if (changed) {
        await sleep(delay);
        clickContinuar();
      }
      return;
    }

    /* STEP 2 */
    if (stepIndex === 2) {
      const addressInput = document.getElementById('DOMI_INICIO');
      if (addressInput) initAddressAutocomplete(addressInput);

      const muniInput = document.getElementById('desc_CG_MUNI_INICIO');
      if (muniInput && muniInput.value !== municipio) {
        muniInput.click();
        await sleep(delay);
        return;
      }

      const termInput = document.getElementById('term');
      if (termInput && termInput.value !== municipioFull) {
        termInput.value = municipioFull;
        dispatchAngularEvents(termInput);
        await sleep(delay);
        document.querySelector('mat-list-item')?.click();
        await sleep(delay*5);
      }
    }
  }

  /* ================= MUTEX ASYNC ================= */

  let isProcessing = false;
  let pendingMutation = false;

  async function processStepsSafe() {
    if (isProcessing) {
      pendingMutation = true;
      return;
    }

    isProcessing = true;

    try {
      await processSteps();
    } finally {
      isProcessing = false;
      if (pendingMutation) {
        pendingMutation = false;
        processStepsSafe();
      }
    }
  }

  /* ================= OBSERVER ================= */

  const observer = new MutationObserver(() => {
    processStepsSafe();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-expanded']
  });

})();