/* Descriptor-driven record forms shared by Portfolio and Registers. Validation lives in lib/schema.js; this file only renders
   fields, reads them with the right types, and shows the store's errors next to the fields. */
(function () {
  'use strict';
  var A = window.ATLAS, L = A.lib, U = A.ui, E = L.schema.ENUMS;

  function projectOptions(includeArchived) {
    return U.ws.store().list('projects', { includeArchived: !!includeArchived }).map(function (p) { return [p.id, p.name]; });
  }

  /* t: text | area | enum | num | int | date | lines | project | ref; en = enum name; section = group heading */
  var FORMS = {
    project: [
      { section: 'The initiative' },
      { k: 'name', l: 'Name', t: 'text', req: true, max: 120 },
      { k: 'problem', l: 'Problem statement', t: 'area', wide: true },
      { k: 'businessUnit', l: 'Business unit', t: 'text' }, { k: 'sponsor', l: 'Sponsor', t: 'text' },
      { k: 'businessOwner', l: 'Business owner', t: 'text' }, { k: 'technicalOwner', l: 'Technical owner', t: 'text' },
      { k: 'targetUsers', l: 'Target users and affected workflow', t: 'text', wide: true },
      { section: 'Value' },
      { k: 'kpi', l: 'Business KPI', t: 'text' }, { k: 'baseline', l: 'Baseline', t: 'text', help: 'Where the KPI is today, with the source of the number.' }, { k: 'target', l: 'Target', t: 'text' },
      { k: 'benefits', l: 'Expected benefits', t: 'area', wide: true },
      { section: 'AI pattern and data' },
      { k: 'pattern', l: 'Proposed AI pattern', t: 'enum', en: 'pattern' }, { k: 'humanOversight', l: 'Human oversight', t: 'enum', en: 'oversight' },
      { k: 'dataSources', l: 'Data sources', t: 'area', wide: true }, { k: 'dataOwner', l: 'Data owner', t: 'text' },
      { k: 'dataReadiness', l: 'Data readiness', t: 'enum', en: 'dataReadiness' }, { k: 'dataSensitivity', l: 'Data sensitivity', t: 'enum', en: 'dataSensitivity' },
      { k: 'volume', l: 'Expected volume and concurrency', t: 'text' }, { k: 'latencyNeed', l: 'Latency need', t: 'text' },
      { k: 'riskLevel', l: 'Overall risk level', t: 'enum', en: 'riskLevel' },
      { section: 'Estimates (your own numbers, not read from billing)' },
      { k: 'currency', l: 'Currency label', t: 'text', max: 8, help: 'e.g. USD or INR. Amounts are never converted.' },
      { k: 'buildCost', l: 'Estimated build cost', t: 'num' }, { k: 'runCostMonthly', l: 'Estimated run cost per month', t: 'num' },
      { k: 'forecastBenefitMonthly', l: 'Forecast benefit per month', t: 'num' }, { k: 'realizedBenefitMonthly', l: 'Realised benefit per month', t: 'num', help: 'Fill in after launch to compare with the forecast.' },
      { k: 'constraints', l: 'Constraints and dependencies', t: 'area', wide: true }, { k: 'assumptions', l: 'Assumptions and alternatives considered', t: 'area', wide: true },
      { section: 'Status' },
      { k: 'stage', l: 'Lifecycle stage', t: 'enum', en: 'stage', req: true, createOnly: true, help: 'After creation, use the lifecycle controls on the initiative page so the history is kept.' },
      { k: 'status', l: 'Recorded status', t: 'enum', en: 'projectStatus', req: true }, { k: 'priority', l: 'Priority', t: 'enum', en: 'priority' }
    ],
    risk: [
      { k: 'title', l: 'Risk title', t: 'text', req: true, max: 160, wide: true },
      { k: 'category', l: 'Category', t: 'enum', en: 'riskCategory' }, { k: 'projectId', l: 'Initiative', t: 'project' },
      { k: 'description', l: 'Description', t: 'area', wide: true },
      { k: 'probability', l: 'Probability (1 rare – 5 almost certain)', t: 'int', req: true, min: 1, max: 5 }, { k: 'impact', l: 'Impact (1 minor – 5 severe)', t: 'int', req: true, min: 1, max: 5 },
      { k: 'status', l: 'Status', t: 'enum', en: 'riskStatus', req: true }, { k: 'owner', l: 'Owner', t: 'text' },
      { k: 'mitigation', l: 'Mitigation', t: 'area', wide: true }, { k: 'dueDate', l: 'Mitigation due date', t: 'date' }, { k: 'reviewDate', l: 'Next review date', t: 'date' },
      { k: 'residualRisk', l: 'Residual risk after mitigation', t: 'text' }, { k: 'evidence', l: 'Evidence or links to evidence', t: 'area', wide: true }
    ],
    decision: [
      { k: 'title', l: 'Decision', t: 'text', req: true, max: 160, wide: true },
      { k: 'projectId', l: 'Initiative', t: 'project' }, { k: 'status', l: 'Status', t: 'enum', en: 'decisionStatus', req: true },
      { k: 'context', l: 'Context', t: 'area', wide: true },
      { k: 'options', l: 'Options considered (one per line)', t: 'lines', wide: true },
      { k: 'selectedOption', l: 'Selected option', t: 'text' }, { k: 'approver', l: 'Approver', t: 'text' },
      { k: 'rationale', l: 'Rationale', t: 'area', wide: true }, { k: 'consequences', l: 'Consequences and trade-offs accepted', t: 'area', wide: true },
      { k: 'decisionDate', l: 'Decision date', t: 'date' }, { k: 'reviewDate', l: 'Review date', t: 'date' }
    ],
    action: [
      { k: 'title', l: 'Action', t: 'text', req: true, max: 160, wide: true },
      { k: 'description', l: 'Details', t: 'area', wide: true },
      { k: 'owner', l: 'Owner', t: 'text' }, { k: 'dueDate', l: 'Due date', t: 'date' },
      { k: 'priority', l: 'Priority', t: 'enum', en: 'priority' }, { k: 'status', l: 'Status', t: 'enum', en: 'actionStatus', req: true },
      { k: 'ref', l: 'Related record', t: 'ref', help: 'Optional link to an initiative or risk.' }
    ]
  };
  var COLL = { project: 'projects', risk: 'risks', decision: 'decisions', action: 'actions' };
  var DEFAULTS = { project: { stage: 'Idea', status: 'Healthy', priority: 'Medium', currency: '' }, risk: { probability: 3, impact: 3, status: 'Open' }, decision: { status: 'Proposed' }, action: { status: 'Open', priority: 'Medium' } };

  function refOptions() {
    var st = U.ws.store(), o = [];
    st.list('projects').forEach(function (p) { o.push(['project:' + p.id, 'Initiative: ' + p.name]); });
    st.list('risks').forEach(function (r) { o.push(['risk:' + r.id, 'Risk: ' + r.title]); });
    return o;
  }

  function formHtml(entity, rec, o) {
    o = o || {}; rec = rec || {};
    var prefix = 'f-' + entity + '-', h = '<form class="wf" novalidate data-entity="' + entity + '" data-id="' + U.esc(rec.id || '') + '"><div class="wsummary" role="alert" hidden></div><div class="wgrid">';
    FORMS[entity].forEach(function (f) {
      if (f.section) { h += '</div><h3 class="wsectionh">' + U.esc(f.section) + '</h3><div class="wgrid">'; return; }
      if (f.createOnly && rec.id) return;
      var id = prefix + f.k, v = rec[f.k], c;
      if (f.t === 'text') c = U.input(id, f.k, 'text', v || '', { req: f.req, maxlength: f.max, help: f.help });
      else if (f.t === 'area') c = U.textarea(id, f.k, v, 3);
      else if (f.t === 'enum') c = U.select(id, f.k, E[f.en], v || '', { req: f.req });
      else if (f.t === 'num') c = U.input(id, f.k, 'number', v === null || v === undefined ? '' : v, { min: 0, step: 'any', help: f.help });
      else if (f.t === 'int') c = U.input(id, f.k, 'number', v === undefined ? '' : v, { req: f.req, min: f.min, max: f.max, step: 1, help: f.help });
      else if (f.t === 'date') c = U.input(id, f.k, 'date', v || '', { help: f.help });
      else if (f.t === 'lines') c = U.textarea(id, f.k, (v || []).join('\n'), 4);
      else if (f.t === 'project') c = U.select(id, f.k, projectOptions(), v || (o.defaults && o.defaults[f.k]) || '', { blankLabel: 'No initiative' });
      else if (f.t === 'ref') c = U.select(id, f.k, refOptions(), rec.sourceType && rec.sourceId ? rec.sourceType + ':' + rec.sourceId : ((o.defaults && o.defaults.ref) || ''), { blankLabel: 'None' });
      h += U.field(id, f.l, c, { req: f.req, wide: f.wide || f.t === 'area' || f.t === 'lines', help: f.t === 'text' || f.t === 'int' || f.t === 'num' || f.t === 'date' ? f.help : null });
    });
    h += '</div><div class="btns"><button class="btn primary" type="submit">' + (rec.id ? 'Save changes' : (o.createLabel || 'Create')) + '</button><a class="btn" href="' + U.esc(o.cancelHref || '#/') + '">Cancel</a></div></form>';
    return h;
  }

  /* Read a form into a record patch with correct types. Empty optional values become '' (text) or null (numbers, dates, links). */
  function readForm(entity, form) {
    var out = {};
    FORMS[entity].forEach(function (f) {
      if (f.section) return;
      var el = form.elements[f.k]; if (!el) return;
      var v = el.value;
      if (f.t === 'text' || f.t === 'area') out[f.k] = v.trim();
      else if (f.t === 'enum') { if (v !== '' || f.req) out[f.k] = v; else out[f.k] = ''; }
      else if (f.t === 'num') out[f.k] = v === '' ? null : Number(v);
      else if (f.t === 'int') out[f.k] = v === '' ? undefined : Number(v);
      else if (f.t === 'date') out[f.k] = v === '' ? null : v;
      else if (f.t === 'lines') out[f.k] = v.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
      else if (f.t === 'project') out[f.k] = v === '' ? null : v;
      else if (f.t === 'ref') {
        if (v === '') { out.sourceType = 'manual'; out.sourceId = null; } else { var i = v.indexOf(':'); out.sourceType = v.slice(0, i); out.sourceId = v.slice(i + 1); }
      }
    });
    return out;
  }

  /* Wire a form: on submit validate through the store, show errors, then call done(record). */
  function bind(form, o) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var entity = form.getAttribute('data-entity'), id = form.getAttribute('data-id'), st = U.ws.store(), fields = readForm(entity, form);
      var res = id ? st.update(COLL[entity], id, fields) : st.add(COLL[entity], Object.assign({}, DEFAULTS[entity], o && o.extra || {}, fields));
      if (!res.ok) { U.showErrors(form, res.errors); return; }
      U.showErrors(form, []);
      U.announce((id ? 'Saved ' : 'Created ') + entity);
      if (o && o.done) o.done(res.record, !id);
    });
  }

  A.ui.forms = { FORMS: FORMS, COLL: COLL, DEFAULTS: DEFAULTS, formHtml: formHtml, readForm: readForm, bind: bind };
})();
