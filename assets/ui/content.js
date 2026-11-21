/* Content status: an honest notice on the reference pages and a page explaining what is and is not verified.
   The reference content predates the V2 plan and carries no per-claim source or verification date. */
(function () {
  'use strict';
  var A = window.ATLAS, U = A.ui, esc = U.esc;

  var VOLATILE = 'volatile', GUIDE = 'guide';
  var NOTE = {
    volatile: 'Model names, context windows, prices, quotas and feature availability change often. No verification date is recorded for the figures on this page. Confirm them in the AWS documentation, console and pricing pages before you rely on them.',
    guide: 'This is guidance written for learning. Thresholds, percentages, dollar amounts and example values are illustrative starting points to adapt, not standards or measurements, and none have a recorded source or verification date.'
  };
  /* kind (first hash segment) -> class */
  var KINDS = { models: VOLATILE, finops: VOLATILE, selector: VOLATILE, s: VOLATILE, c: VOLATILE, services: VOLATILE,
    delivery: GUIDE, eval: GUIDE, ops: GUIDE, gov: GUIDE, leadership: GUIDE, toolkit: GUIDE, labs: GUIDE, 'arch-review': GUIDE, a: GUIDE, d: GUIDE, p: GUIDE, glossary: GUIDE };

  A.contentNotice = function (kind) {
    var cls = KINDS[kind]; if (!cls) return '';
    return '<div class="wbanner ' + (cls === VOLATILE ? 'warn' : 'info') + '" role="note"><b>' + (cls === VOLATILE ? 'Figures not verified.' : 'Illustrative guidance.') + '</b> ' + esc(NOTE[cls]) + ' <a href="#/about/content">Content status</a></div>';
  };

  function page() {
    var rows = [
      ['Services catalogue and service pages', 'services, s, c', VOLATILE, 'Each service links to its AWS documentation. Cost notes and limits are descriptive and unverified.'],
      ['Model registry', 'models', VOLATILE, 'Specs and prices are hand-entered and may be out of date.'],
      ['Service selector, FinOps', 'selector, finops', VOLATILE, 'Dollar figures are examples. Use the Cost and ROI calculators with your own prices.'],
      ['Architectures, decisions, playbooks, glossary', 'a, d, p, glossary', GUIDE, 'Patterns and trade-offs. Not a substitute for the AWS Well-Architected guidance or your own review.'],
      ['Delivery, evaluation, operations, security, leadership, toolkit, labs, architecture review', 'delivery, eval, ops, gov, leadership, toolkit, labs, arch-review', GUIDE, 'Frameworks, checklists and templates with example thresholds.'],
      ['Static example Command Centre', 'command/sample', 'Illustrative', 'Hand-written example figures. Your dashboard (Command Centre) uses only records you enter.'],
      ['My workspace pages and calculators', 'command, portfolio, registers, calc, workspace', 'User data', 'Show only what you type. Calculators use no built-in prices.']
    ];
    var h = '<div class="wide"><div class="eyebrow">About</div><h1>Content status</h1>' +
      '<p class="lede">What you can and cannot rely on in this atlas.</p>' +
      '<section class="wsec"><h2>The short version</h2><ul>' +
      '<li>The reference pages are an independent educational project, not AWS documentation and not endorsed by AWS.</li>' +
      '<li>The project has <b>not recorded</b> a source or a verification date for individual claims, numbers or prices. Earlier versions showed an "AWS Verified 2026" badge on architectures; it was removed because nothing recorded supports it.</li>' +
      '<li>Anything that can change (prices, quotas, model specs, region and feature availability) must be checked against the official AWS pages before you design or budget around it.</li>' +
      '<li>Figures with a dollar sign or a percentage in guidance pages are examples. They are not benchmarks, measurements or recommendations.</li></ul></section>' +
      '<section class="wsec"><h2>By area</h2><div class="tablewrap"><table class="wtable"><thead><tr><th scope="col">Area</th><th scope="col">Routes</th><th scope="col">Status</th><th scope="col">Note</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><th scope="row">' + esc(r[0]) + '</th><td><code>' + esc(r[1]) + '</code></td><td>' + (r[2] === VOLATILE ? '<span class="wbadge warn"><span aria-hidden="true">▲</span> Figures unverified</span>' : r[2] === GUIDE ? '<span class="wbadge muted"><span aria-hidden="true">•</span> Illustrative guidance</span>' : '<span class="wbadge ok"><span aria-hidden="true">✓</span> ' + esc(r[2]) + '</span>') + '</td><td>' + esc(r[3]) + '</td></tr>'; }).join('') + '</tbody></table></div></section>' +
      '<section class="wsec"><h2>Official sources to check</h2><ul>' +
      '<li><a href="https://docs.aws.amazon.com/" target="_blank" rel="noopener noreferrer">AWS documentation ↗</a></li>' +
      '<li><a href="https://aws.amazon.com/bedrock/pricing/" target="_blank" rel="noopener noreferrer">Amazon Bedrock pricing ↗</a></li>' +
      '<li><a href="https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html" target="_blank" rel="noopener noreferrer">AWS service quotas ↗</a></li>' +
      '<li><a href="https://aws.amazon.com/architecture/" target="_blank" rel="noopener noreferrer">AWS Architecture Center ↗</a></li></ul></section>' +
      '<p class="fine">How this will improve: add a source URL and a last-verified date to each claim that can go stale, and show them next to it. See <code>docs/implementation/status.md</code> in the repository.</p></div>';
    return { html: h, title: 'Content status — AWS AI Atlas' };
  }
  A.routes.about = { render: function (parts) { return parts[0] === 'content' || !parts[0] ? page() : U.notFound('That page'); } };
})();
