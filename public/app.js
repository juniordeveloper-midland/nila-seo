/* =========================================================
   AIViz - Frontend Application
========================================================= */

const nav = [
  ...document.querySelectorAll('.nav')
];

const pages = [
  ...document.querySelectorAll('.page')
];

const toast =
  document.getElementById('toast');


/* =========================================================
   GLOBAL DATA
========================================================= */

let analysisData = {
  website: '',

  aiVisibility: 0,
  brandMentions: 0,
  promptsTracked: 25,
  opportunityScore: 0,

  engines: [
    {
      name: 'Google AI Overviews',
      visibility: 0
    },
    {
      name: 'ChatGPT',
      visibility: 0
    },
    {
      name: 'Perplexity',
      visibility: 0
    },
    {
      name: 'Claude',
      visibility: 0
    }
  ],

  prompts: [],

  competitors: [],

  opportunities: [],

  report: {
    keyFinding: '',
    nextActions: ''
  }
};


/* =========================================================
   NAVIGATION
========================================================= */

function go(id) {
  pages.forEach((page) => {
    page.classList.toggle(
      'active',
      page.id === id
    );
  });

  nav.forEach((item) => {
    item.classList.toggle(
      'active',
      item.dataset.target === id
    );
  });

  document
    .getElementById('sidebar')
    ?.classList.remove('open');

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


nav.forEach((item) => {
  item.addEventListener('click', () => {
    go(item.dataset.target);
  });
});


document
  .querySelectorAll('[data-target]')
  .forEach((item) => {
    item.addEventListener('click', () => {
      go(item.dataset.target);
    });
  });


document
  .getElementById('hamb')
  ?.addEventListener('click', () => {
    document
      .getElementById('sidebar')
      ?.classList.toggle('open');
  });


/* =========================================================
   TOAST
========================================================= */

function notify(message) {
  if (!toast) {
    return;
  }

  toast.textContent = message;

  toast.classList.add('show');

  clearTimeout(window.aivizToastTimer);

  window.aivizToastTimer =
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
}


/* =========================================================
   SAFE HTML
========================================================= */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


/* =========================================================
   NUMBER HELPERS
========================================================= */

function safeNumber(
  value,
  fallback = 0
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}


function clamp(
  value,
  min,
  max
) {
  const number =
    safeNumber(value, min);

  return Math.max(
    min,
    Math.min(max, Math.round(number))
  );
}


/* =========================================================
   WEBSITE
========================================================= */

function getWebsiteUrl() {
  const input =
    document.getElementById('url');

  return (
    input?.value?.trim() ||
    analysisData.website ||
    ''
  );
}


function getBrandName() {
  const website =
    getWebsiteUrl();

  try {
    const parsed =
      new URL(
        website.startsWith('http')
          ? website
          : `https://${website}`
      );

    return parsed.hostname
      .replace(/^www\./i, '');
  } catch {
    return 'Your brand';
  }
}


/* =========================================================
   NORMALIZE FRONTEND DATA
========================================================= */

function normalizeFrontendData(data) {
  const engines =
    Array.isArray(data?.engines)
      ? data.engines
      : [];

  const prompts =
    Array.isArray(data?.prompts)
      ? data.prompts
      : [];

  const competitors =
    Array.isArray(data?.competitors)
      ? data.competitors
      : [];

  const opportunities =
    Array.isArray(data?.opportunities)
      ? data.opportunities
      : [];

  return {
    website:
      getWebsiteUrl(),

    aiVisibility: clamp(
      data?.aiVisibility,
      0,
      100
    ),

    brandMentions: clamp(
      data?.brandMentions,
      0,
      500
    ),

    promptsTracked: 25,

    opportunityScore: clamp(
      data?.opportunityScore,
      0,
      100
    ),

    engines: [
      {
        name:
          'Google AI Overviews',
        visibility: clamp(
          engines.find(
            (e) =>
              e?.name ===
              'Google AI Overviews'
          )?.visibility,
          0,
          100
        )
      },

      {
        name: 'ChatGPT',
        visibility: clamp(
          engines.find(
            (e) =>
              e?.name ===
              'ChatGPT'
          )?.visibility,
          0,
          100
        )
      },

      {
        name: 'Perplexity',
        visibility: clamp(
          engines.find(
            (e) =>
              e?.name ===
              'Perplexity'
          )?.visibility,
          0,
          100
        )
      },

      {
        name: 'Claude',
        visibility: clamp(
          engines.find(
            (e) =>
              e?.name ===
              'Claude'
          )?.visibility,
          0,
          100
        )
      }
    ],

    prompts:
      prompts
        .slice(0, 25)
        .map((item) => ({
          prompt: String(
            item?.prompt || ''
          ),

          topic: String(
            item?.topic ||
            'Category'
          ),

          visibility: clamp(
            item?.visibility,
            0,
            100
          ),

          status:
            String(
              item?.status || ''
            ).toLowerCase() ===
            'gap'
              ? 'Gap'
              : 'Visible'
        })),

    competitors:
      competitors
        .slice(0, 4)
        .map((item) => ({
          name: String(
            item?.name ||
            'Competitor'
          ),

          visibility: clamp(
            item?.visibility,
            0,
            100
          ),

          mentions: clamp(
            item?.mentions,
            0,
            500
          )
        })),

    opportunities:
      opportunities
        .slice(0, 4)
        .map((item) => ({
          priority:
            String(
              item?.priority ||
              'MEDIUM'
            ).toUpperCase(),

          title: String(
            item?.title ||
            'Improve content coverage'
          ),

          description: String(
            item?.description ||
            'Improve website content for better AI answerability.'
          ),

          impact: clamp(
            item?.impact,
            0,
            100
          )
        })),

    report: {
      keyFinding: String(
        data?.report?.keyFinding ||
        'Website analysis completed.'
      ),

      nextActions: String(
        data?.report?.nextActions ||
        'Review the website content and improve important content opportunities.'
      )
    }
  };
}


/* =========================================================
   OVERVIEW STATS
========================================================= */

function renderOverview() {

  /* -------------------------------------------------------
     MAIN STAT CARDS
  ------------------------------------------------------- */

  const stats =
    document.querySelectorAll(
      '.stats .card strong'
    );

  if (stats[0]) {
    stats[0].textContent =
      `${analysisData.aiVisibility}%`;
  }

  if (stats[1]) {
    stats[1].textContent =
      analysisData.brandMentions;
  }

  if (stats[2]) {
    stats[2].textContent =
      analysisData.promptsTracked;
  }

  if (stats[3]) {
    stats[3].textContent =
      analysisData.opportunityScore;
  }


  /* -------------------------------------------------------
     ENGINE VISIBILITY
  ------------------------------------------------------- */

  const engineValues =
    document.querySelectorAll(
      '.engines > div > strong'
    );

  analysisData.engines
    .forEach(
      (engine, index) => {

        if (!engineValues[index]) {
          return;
        }

        engineValues[index]
          .textContent =
          `${engine.visibility}%`;
      }
    );


  /* -------------------------------------------------------
     UPDATE ENGINE BARS IF AVAILABLE
  ------------------------------------------------------- */

  const engineBars =
    document.querySelectorAll(
      '.engines .bar i'
    );

  analysisData.engines
    .forEach(
      (engine, index) => {

        if (!engineBars[index]) {
          return;
        }

        engineBars[index].style.width =
          `${engine.visibility}%`;
      }
    );
}


/* =========================================================
   PROMPTS
========================================================= */

function renderPrompts() {

  const table =
    document.getElementById(
      'promptTable'
    );

  if (!table) {
    return;
  }


  const searchInput =
    document.getElementById(
      'search'
    );

  const topicInput =
    document.getElementById(
      'topic'
    );


  const search =
    searchInput?.value
      ?.trim()
      .toLowerCase() || '';


  const topic =
    topicInput?.value ||
    'All topics';


  const prompts =
    Array.isArray(
      analysisData.prompts
    )
      ? analysisData.prompts
      : [];


  const filtered =
    prompts.filter(
      (item) => {

        const promptText =
          String(
            item?.prompt || ''
          ).toLowerCase();

        const itemTopic =
          String(
            item?.topic || ''
          );

        const matchesSearch =
          !search ||
          promptText.includes(
            search
          );

        const matchesTopic =
          topic ===
            'All topics' ||
          itemTopic === topic;

        return (
          matchesSearch &&
          matchesTopic
        );
      }
    );


  /* -------------------------------------------------------
     EMPTY STATE
  ------------------------------------------------------- */

  if (!filtered.length) {

    table.innerHTML = `
      <div class="tr th">
        <span>Prompt</span>
        <span>Topic</span>
        <span>Visibility</span>
        <span>Status</span>
      </div>

      <div style="
        padding:30px;
        text-align:center;
        color:#7d8090;
      ">
        ${
          prompts.length
            ? 'No prompts match your search.'
            : 'Run Analyze to generate website-specific prompts.'
        }
      </div>
    `;

    return;
  }


  /* -------------------------------------------------------
     TABLE
  ------------------------------------------------------- */

  table.innerHTML = `
    <div class="tr th">
      <span>Prompt</span>
      <span>Topic</span>
      <span>Visibility</span>
      <span>Status</span>
    </div>

    ${filtered
      .map((item) => {

        const visibility =
          clamp(
            item.visibility,
            0,
            100
          );

        const status =
          item.status ===
          'Gap'
            ? 'Gap'
            : 'Visible';

        return `
          <div class="tr">

            <span>
              ${escapeHtml(
                item.prompt
              )}
            </span>

            <span>
              ${escapeHtml(
                item.topic
              )}
            </span>

            <b>
              ${visibility}%
            </b>

            <span class="${
              status === 'Gap'
                ? 'gap'
                : 'good'
            }">
              ${status}
            </span>

          </div>
        `;
      })
      .join('')}
  `;
}


/* =========================================================
   COMPETITORS
========================================================= */

function renderCompetitors() {

  /*
   * Try multiple selectors so this works with
   * the existing HTML without changing it.
   */

  const grid =
    document.querySelector(
      '.competitorGrid'
    ) ||
    document.querySelector(
      '.competitors-grid'
    ) ||
    document.querySelector(
      '.competitorsGrid'
    );

  if (!grid) {
    return;
  }


  const competitors =
    Array.isArray(
      analysisData.competitors
    )
      ? analysisData.competitors
      : [];


  /* -------------------------------------------------------
     YOUR BRAND
  ------------------------------------------------------- */

  const yourCard = `
    <article class="comp featured">

      <span>
        Your brand
      </span>

      <b>
        ${analysisData.aiVisibility}%
      </b>

      <small>
        ${analysisData.brandMentions}
        mentions
      </small>

      <div class="bar">
        <i
          style="
            width:${analysisData.aiVisibility}%
          "
        ></i>
      </div>

    </article>
  `;


  /* -------------------------------------------------------
     COMPETITOR CARDS
  ------------------------------------------------------- */

  const competitorCards =
    competitors
      .slice(0, 3)
      .map(
        (item) => {

          const visibility =
            clamp(
              item.visibility,
              0,
              100
            );

          const mentions =
            clamp(
              item.mentions,
              0,
              500
            );

          return `
            <article class="comp">

              <span>
                ${escapeHtml(
                  item.name
                )}
              </span>

              <b>
                ${visibility}%
              </b>

              <small>
                ${mentions}
                mentions
              </small>

              <div class="bar">
                <i
                  style="
                    width:${visibility}%
                  "
                ></i>
              </div>

            </article>
          `;
        }
      )
      .join('');


  /*
   * If Gemini returns fewer competitors,
   * don't bring back old demo data.
   */

  grid.innerHTML =
    yourCard +
    competitorCards;
}


/* =========================================================
   OPPORTUNITIES
========================================================= */

function renderOpportunities() {

  const grid =
    document.querySelector(
      '.oppgrid'
    ) ||
    document.querySelector(
      '.opportunities-grid'
    );

  if (!grid) {
    return;
  }


  const opportunities =
    Array.isArray(
      analysisData.opportunities
    )
      ? analysisData.opportunities
      : [];


  if (!opportunities.length) {

    grid.innerHTML = `
      <div style="
        padding:30px;
        text-align:center;
        color:#7d8090;
      ">
        Run Analyze to generate
        website-specific opportunities.
      </div>
    `;

    return;
  }


  grid.innerHTML =
    opportunities
      .slice(0, 4)
      .map(
        (item) => {

          const priority =
            String(
              item.priority ||
              'MEDIUM'
            ).toUpperCase();

          const impact =
            clamp(
              item.impact,
              0,
              100
            );


          return `
            <article>

              <span
                class="priority ${getPriorityClass(
                  priority
                )}"
              >
                ${escapeHtml(
                  priority
                )}
              </span>

              <h3>
                ${escapeHtml(
                  item.title
                )}
              </h3>

              <p>
                ${escapeHtml(
                  item.description
                )}
              </p>

              <div>
                <span>
                  Estimated impact
                </span>

                <b>
                  +${impact}%
                  visibility
                </b>
              </div>

              <button
                class="secondary"
                data-target="prompts"
              >
                View prompts
              </button>

            </article>
          `;
        }
      )
      .join('');


  grid
    .querySelectorAll(
      '[data-target]'
    )
    .forEach(
      (button) => {

        button.addEventListener(
          'click',
          () => {
            go(
              button.dataset.target
            );
          }
        );

      }
    );
}


/* =========================================================
   PRIORITY CLASS
========================================================= */

function getPriorityClass(
  priority
) {

  const value =
    String(
      priority || ''
    ).toLowerCase();


  if (value === 'high') {
    return 'red';
  }


  if (value === 'medium') {
    return 'yellow';
  }


  return '';
}


/* =========================================================
   REPORT
========================================================= */

function renderReport() {

  /* -------------------------------------------------------
     SCORE
  ------------------------------------------------------- */

  const score =
    document.querySelector(
      '.reportscore strong'
    );

  if (score) {
    score.textContent =
      `${analysisData.aiVisibility}%`;
  }


  /* -------------------------------------------------------
     REPORT URL
  ------------------------------------------------------- */

  const reportUrl =
    document.getElementById(
      'reportUrl'
    );

  if (reportUrl) {
    reportUrl.textContent =
      getWebsiteUrl();
  }


  /* -------------------------------------------------------
     KEY FINDING
  ------------------------------------------------------- */

  const finding =
    document.querySelector(
      '.reporttext div:nth-child(1) p'
    );

  if (finding) {
    finding.textContent =
      analysisData.report
        ?.keyFinding || '';
  }


  /* -------------------------------------------------------
     NEXT ACTIONS
  ------------------------------------------------------- */

  const actions =
    document.querySelector(
      '.reporttext div:nth-child(2) p'
    );

  if (actions) {
    actions.textContent =
      analysisData.report
        ?.nextActions || '';
  }
}


/* =========================================================
   UPDATE REPORT / WEBSITE TEXT
========================================================= */

function updateWebsiteLabels() {

  const website =
    getWebsiteUrl();

  if (!website) {
    return;
  }


  document
    .querySelectorAll(
      '[data-website]'
    )
    .forEach(
      (element) => {
        element.textContent =
          website;
      }
    );
}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

  renderOverview();

  renderPrompts();

  renderCompetitors();

  renderOpportunities();

  renderReport();

  updateWebsiteLabels();
}


/* =========================================================
   SEARCH
========================================================= */

document
  .getElementById('search')
  ?.addEventListener(
    'input',
    () => {
      renderPrompts();
    }
  );


document
  .getElementById('topic')
  ?.addEventListener(
    'change',
    () => {
      renderPrompts();
    }
  );


/* =========================================================
   ANALYZE WEBSITE
========================================================= */

document
  .getElementById('analyze')
  ?.addEventListener(
    'click',
    async () => {

      const input =
        document.getElementById(
          'url'
        );

      const button =
        document.getElementById(
          'analyze'
        );

      const updated =
        document.getElementById(
          'updated'
        );


      const url =
        input?.value?.trim() || '';


      /* -----------------------------------------------------
         VALIDATE
      ----------------------------------------------------- */

      if (!url) {

        notify(
          'Please enter a website URL.'
        );

        input?.focus();

        return;
      }


      /* -----------------------------------------------------
         LOADING
      ----------------------------------------------------- */

      const originalButtonText =
        button?.textContent ||
        'Analyze';


      if (button) {

        button.disabled =
          true;

        button.textContent =
          'Analyzing...';
      }


      if (updated) {

        updated.textContent =
          'Analyzing…';
      }


      notify(
        'Analyzing website with Gemini...'
      );


      try {

        /* ---------------------------------------------------
           API REQUEST
        --------------------------------------------------- */

        const response =
          await fetch(
            '/api/analyze',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({
                  url
                })
            }
          );


        /* ---------------------------------------------------
           PARSE RESPONSE
        --------------------------------------------------- */

        let data;

        try {

          data =
            await response.json();

        } catch (jsonError) {

          throw new Error(
            'Server returned an invalid response.'
          );
        }


        /* ---------------------------------------------------
           API ERROR
        --------------------------------------------------- */

        if (!response.ok) {

          throw new Error(
            data?.error ||
            `Analysis failed (${response.status})`
          );
        }


        /* ---------------------------------------------------
           DEBUG
        --------------------------------------------------- */

        console.log(
          '================================'
        );

        console.log(
          'Gemini API Response:'
        );

        console.log(
          data
        );

        console.log(
          '================================'
        );


        /* ---------------------------------------------------
           SAVE COMPLETE RESPONSE
        --------------------------------------------------- */

        analysisData =
          normalizeFrontendData(
            data
          );


        /* ---------------------------------------------------
           RENDER EVERY PAGE
        --------------------------------------------------- */

        renderAll();


        /* ---------------------------------------------------
           UPDATED LABEL
        --------------------------------------------------- */

        if (updated) {

          updated.textContent =
            'Updated just now';
        }


        /* ---------------------------------------------------
           SUCCESS
        --------------------------------------------------- */

        notify(
          'Gemini analysis completed successfully.'
        );


      } catch (error) {

        console.error(
          'Analysis error:',
          error
        );


        if (updated) {

          updated.textContent =
            'Analysis failed';
        }


        notify(
          error?.message ||
          'Analysis failed.'
        );


      } finally {

        if (button) {

          button.disabled =
            false;

          button.textContent =
            originalButtonText;
        }

      }

    }
  );


/* =========================================================
   DEMO SCAN
========================================================= */

document
  .getElementById('scan')
  ?.addEventListener(
    'click',
    () => {

      notify(
        'Demo scan complete: 25 prompts checked.'
      );

    }
  );


/* =========================================================
   DOWNLOAD REPORT
========================================================= */

document
  .getElementById('download')
  ?.addEventListener(
    'click',
    () => {

      const url =
        getWebsiteUrl();


      const engines =
        analysisData.engines || [];


      const prompts =
        analysisData.prompts || [];


      const competitors =
        analysisData.competitors || [];


      const opportunities =
        analysisData.opportunities || [];


      const report =
        analysisData.report || {};


      /* -----------------------------------------------------
         REPORT TEXT
      ----------------------------------------------------- */

      let reportText = `
AIViz AI Visibility Report
===========================

Website:
${url}

AI Visibility:
${analysisData.aiVisibility}%

Brand Mentions:
${analysisData.brandMentions}

Prompts Tracked:
${analysisData.promptsTracked}

Opportunity Score:
${analysisData.opportunityScore}


AI ENGINE VISIBILITY
====================

Google AI Overviews:
${engines[0]?.visibility || 0}%

ChatGPT:
${engines[1]?.visibility || 0}%

Perplexity:
${engines[2]?.visibility || 0}%

Claude:
${engines[3]?.visibility || 0}%


PROMPTS
=======

`;


      prompts.forEach(
        (item, index) => {

          reportText +=
            `${index + 1}. ${item.prompt}
Topic: ${item.topic}
Visibility: ${item.visibility}%
Status: ${item.status}

`;
        }
      );


      reportText += `
COMPETITORS
===========

`;


      competitors.forEach(
        (item) => {

          reportText +=
            `${item.name}
Visibility: ${item.visibility}%
Mentions: ${item.mentions}

`;
        }
      );


      reportText += `
OPPORTUNITIES
=============

`;


      opportunities.forEach(
        (item, index) => {

          reportText +=
            `${index + 1}. ${item.title}
Priority: ${item.priority}
Impact: +${item.impact}% visibility
Description: ${item.description}

`;
        }
      );


      reportText += `
REPORT
======

Key Finding:
${report.keyFinding || ''}

Next Actions:
${report.nextActions || ''}


This report contains AI-generated estimates
based on supplied website content.
`;


      /* -----------------------------------------------------
         DOWNLOAD
      ----------------------------------------------------- */

      const blob =
        new Blob(
          [reportText.trim()],
          {
            type:
              'text/plain;charset=utf-8'
          }
        );


      const downloadUrl =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          'a'
        );


      link.href =
        downloadUrl;


      link.download =
        'aiviz-visibility-report.txt';


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      URL.revokeObjectURL(
        downloadUrl
      );


      notify(
        'Report downloaded.'
      );

    }
  );


/* =========================================================
   INITIAL LOAD
========================================================= */

renderAll();