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
//
  /* ================= CONFIG ================= */

  const TARGET_DATE = '03/03/2025';
  const TARGET_HOUR = '12:00';
  const TARGET_MATRICULA = '7925-MYN';
  const DELAY = 500;

  /* ================= UTILIDADES ================= */

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
    if (!el) return false;
    if (el.value === value) return false;

    el.value = value;
    dispatchAngularEvents(el);
    return true;
  }

  function clickContinuar() {
    const btn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Continuar');
    if (btn) btn.click();
  }

  function isStepExpanded(el) {
    const step = el.closest('.mat-horizontal-stepper-content');
    return step && step.ariaExpanded === 'true';
  }

  /* ================= LÓGICA PRINCIPAL ================= */

  function processSteps() {
    let changed = false;

    // Paso matrícula
    const matricula = document.getElementById('desc_MATRICULA');
    if (matricula && isStepExpanded(matricula)) {
      changed = setValueIfNeeded(matricula, TARGET_MATRICULA);
      if (changed) {
        setTimeout(clickContinuar, DELAY);
      }
      return;
    }

    // Paso fecha / hora
    const date = document.getElementById('F_CONTRATO_DATE');
    const hour = document.getElementById('F_CONTRATO_HOUR');

    if (date && hour && isStepExpanded(date) && isStepExpanded(hour)) {
      changed = setValueIfNeeded(date, TARGET_DATE) || changed;
      changed = setValueIfNeeded(hour, TARGET_HOUR) || changed;

      if (changed) {
        setTimeout(clickContinuar, DELAY);
      }
    }
  }

  /* ================= OBSERVER ================= */

  const observer = new MutationObserver(processSteps);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-expanded']
  });

})();
