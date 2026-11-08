/* МнемоМатика — пост-обработка данных: раздел формулы, формы из треугольников, список «что можно искать» */
(function () {
  const FM = window.FM, tsec = Object.fromEntries(FM.topics.map((t) => [t.id, t.sec]));
  FM.formulas.forEach((f) => {
    f.sec = tsec[f.topic];
    if (f.tri && !f.forms) {
      const { top, l, r } = f.tri;
      f.forms = {};
      f.forms[top] = top + ' = ' + l + '·' + r;
      f.forms[l] = l + ' = {' + top + '|' + r + '}';
      f.forms[r] = r + ' = {' + top + '|' + l + '}';
    }
    if (f.f && !f.forms) f.forms = {};
    if (!f.ask && f.forms) {
      const consts = new Set((f.vars || []).filter((v) => v[3]).map((v) => v[0]));
      f.ask = Object.keys(f.forms).filter((k) => !consts.has(k));
    }
  });
})();
