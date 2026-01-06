// ==UserScript==
// @name         Auto contrato 2 (fecha, hora, matrícula)
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

  const date = '03/03/2025';
  const hour = '12:00';
  const matricula = '7925-MYN';
  const delay = 500;

  const domiInicioOptions = [
    'PLAZA BAYONA 1, 45223',
    'CALLE LOPE DE VEGA 25, 45223',
    'CALLE AMAPOLAS 18, 45224',
    'CALLE CAMELIAS 12, 45224',
    'CALLE ALMENDRO 9, 45224',
    'CALLE LEPANTO 9, 45224',
    'CALLE MADROÑO 7, 45224',
    'CALLE MIRAFLORES 7, 45224',
    'CALLE BARATARIA 7, 45224',
    'CAMINO DE LOS PONTONES 7, 45224'
  ];

  const sleep = (delay) => new Promise(resolve => setTimeout(resolve, delay));
  const clickContinuar = () =>
    [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Continuar')
      ?.click();

  const eventTypes = ['input', 'keyup', 'change'];
  function dispatchAngularEvents(el) {
    let ev;
    eventTypes.forEach(type => {
      ev = document.createEvent('HTMLEvents');
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

  function initDomiInicioAutocomplete(domiInicioInput) {
    const container = domiInicioInput.closest('.mat-form-field');
    if (!container) return;

    container.style.position = 'relative';

    const autocompleteBox = document.createElement('div');
    autocompleteBox.className = 'vm-autocomplete-box';

    Object.assign(autocompleteBox.style, {
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
      display: 'none',
      fontSize: '16px'
    });

    domiInicioOptions.forEach(text => {
      const optionItem = document.createElement('div');
      optionItem.textContent = text;

      Object.assign(optionItem.style, {
        padding: '12px',
        cursor: 'pointer'
      });

      const selectOption = (e) => {
        e.preventDefault();
        domiInicioInput.value = text;
        dispatchAngularEvents(domiInicioInput);
        autocompleteBox.style.display = 'none';
      };

      optionItem.addEventListener('mousedown', selectOption);
      optionItem.addEventListener('touchstart', selectOption);

      optionItem.addEventListener('mouseenter', () => optionItem.style.background = '#eee');
      optionItem.addEventListener('mouseleave', () => optionItem.style.background = '#fff');

      autocompleteBox.appendChild(optionItem);
    });

    container.appendChild(autocompleteBox);

    domiInicioInput.addEventListener('focus', () => autocompleteBox.style.display = 'block');
    domiInicioInput.addEventListener('click', () => autocompleteBox.style.display = 'block');

    document.addEventListener('click', e => {
      if (!container.contains(e.target)) {
        autocompleteBox.style.display = 'none';
      }
    });

    domiInicioInput.dataset.autocompleteAttached = 'true';
  }

  /* ================= LÓGICA PRINCIPAL ================= */

  async function processSteps() {
    let changed = false;
    const stepIndex = getActiveStepIndex();
    if (stepIndex === -1) return;

    // Paso 0 → Matrícula
    if (stepIndex === 0) {
      const matriculaInput = document.getElementById('desc_MATRICULA');
      changed = setValueIfNeeded(matriculaInput, matricula);

      if (changed) {
        await sleep(delay);
        clickContinuar();
      }
      return;
    }

    // Paso 1 → Fecha / Hora
    if (stepIndex === 1) {
      const dateInput = document.getElementById('F_CONTRATO_DATE');
      const hourInput = document.getElementById('F_CONTRATO_HOUR');

      changed = setValueIfNeeded(dateInput, date) || changed;
      if (changed) await sleep(delay);

      changed = setValueIfNeeded(hourInput, hour) || changed;
      if (changed) {
        await sleep(delay);
        hourInput.focus();
        await sleep(delay);
        clickContinuar();
      }
      return;
    }

    // Paso 2 → Dirección inicio
    if (stepIndex === 2) {
      const domiInicioInput = document.getElementById('DOMI_INICIO');
      if (
        domiInicioInput &&
        !domiInicioInput.dataset.autocompleteAttached
      ) {
        initDomiInicioAutocomplete(domiInicioInput);
      }
    }
  }

  const observer = new MutationObserver(processSteps);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-expanded']
  });

})();