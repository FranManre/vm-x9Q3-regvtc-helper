// ==UserScript==
// @name         Auto contrato (fecha, hora, matrícula)
// @namespace    https://github.com/FranManre/vm-x9Q3-regvtc-helper
// @version      0.0.1
// @description  Autocompleta matrícula, fecha y hora en REGVTC
// @match        https://sede.transportes.gob.es/regvtc/gestion/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/FranManre/vm-x9Q3-regvtc-helper/main/regvtc.user.js
// @downloadURL  https://raw.githubusercontent.com/FranManre/vm-x9Q3-regvtc-helper/main/regvtc.user.js
// ==/UserScript==

(function () {
  'use strict';

  const date = '03/03/2025';
  const hour = '12:00';
  const matricula = '7925-MYN';
  const delay = 500;

  const sleep = (delay) => new Promise(resolve => setTimeout(resolve, delay));
  const clickContinuar = () => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Continuar')?.click();

  function dispatchAngularEvents(el) {
    let ev;
    ev = document.createEvent('HTMLEvents');
    ev.initEvent('input', true, true);
    el.dispatchEvent(ev);

    ev = document.createEvent('HTMLEvents');
    ev.initEvent('keyup', true, true);
    el.dispatchEvent(ev);

    ev = document.createEvent('HTMLEvents');
    ev.initEvent('change', true, true);
    el.dispatchEvent(ev);
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

  async function processSteps() {
    let changed = false;
    const stepIndex = getActiveStepIndex();

    if (stepIndex === -1) return;

    if (stepIndex === 0) {
      const matriculaInput = document.getElementById('desc_MATRICULA');
      changed = setValueIfNeeded(matriculaInput, matricula);

      if (changed) {
        await sleep(delay);
        clickContinuar();
        await sleep(delay);
      }
      return;
    }

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
