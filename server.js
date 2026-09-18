require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL =
  process.env.GEMINI_MODEL || 'gemini-3.8-flash';

app.use(express.json({ limit: '1mb' }));

const publicDir = path.join(__dirname, 'public');
const staticDir = fs.existsSync(path.join(publicDir, 'index.html'))
  ? publicDir
  : __dirname;

function sendStatic(file, type) {
  return (req, res) => {
    res.type(type);
    res.sendFile(path.join(staticDir, file));
  };
}

app.get('/styles.css', sendStatic('styles.css', 'css'));
app.get('/app.js', sendStatic('app.js', 'js'));
app.get(['/', '/index.html'], sendStatic('index.html', 'html'));


/* =========================================================
   CLEAN WEBSITE HTML
========================================================= */

function cleanHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30000);
}


/* =========================================================
   PARSE GEMINI JSON
========================================================= */

function parseGeminiJson(text) {
  let cleaned = String(text || '').trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (
      start === -1 ||
      end === -1 ||
      end <= start
    ) {
      throw new Error(
        'Gemini returned invalid JSON.'
      );
    }

    return JSON.parse(
      cleaned.slice(start, end + 1)
    );
  }
}


/* =========================================================
   NUMBER HELPER
========================================================= */

function clamp(value, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.max(
    min,
    Math.min(max, Math.round(number))
  );
}


/* =========================================================
   NORMALIZE GEMINI RESULT
========================================================= */

function normalizeResult(result) {

  const engines =
    Array.isArray(result?.engines)
      ? result.engines
      : [];

  const prompts =
    Array.isArray(result?.prompts)
      ? result.prompts
      : [];

  const competitors =
    Array.isArray(result?.competitors)
      ? result.competitors
      : [];

  const opportunities =
    Array.isArray(result?.opportunities)
      ? result.opportunities
      : [];


  function engineValue(name) {
    const engine =
      engines.find(
        item =>
          String(item?.name || '')
            .trim()
            .toLowerCase() ===
          name.toLowerCase()
      );

    return clamp(
      engine?.visibility,
      0,
      100
    );
  }


  return {

    aiVisibility: clamp(
      result?.aiVisibility,
      0,
      100
    ),

    brandMentions: clamp(
      result?.brandMentions,
      0,
      500
    ),

    promptsTracked: 25,

    opportunityScore: clamp(
      result?.opportunityScore,
      0,
      100
    ),


    /* -----------------------------------------------------
       ENGINES
    ----------------------------------------------------- */

    engines: [
      {
        name: 'Google AI Overviews',
        visibility:
          engineValue(
            'Google AI Overviews'
          )
      },

      {
        name: 'ChatGPT',
        visibility:
          engineValue(
            'ChatGPT'
          )
      },

      {
        name: 'Perplexity',
        visibility:
          engineValue(
            'Perplexity'
          )
      },

      {
        name: 'Claude',
        visibility:
          engineValue(
            'Claude'
          )
      }
    ],


    /* -----------------------------------------------------
       PROMPTS
    ----------------------------------------------------- */

    prompts:
      prompts
        .slice(0, 25)
        .map(item => ({
          prompt:
            String(
              item?.prompt || ''
            ),

          topic:
            String(
              item?.topic ||
              'Category'
            ),

          visibility:
            clamp(
              item?.visibility,
              0,
              100
            ),

          status:
            String(
              item?.status || ''
            ).toLowerCase() === 'gap'
              ? 'Gap'
              : 'Visible'
        })),


    /* -----------------------------------------------------
       COMPETITORS
    ----------------------------------------------------- */

    competitors:
      competitors
        .slice(0, 4)
        .map(item => ({
          name:
            String(
              item?.name ||
              'Competitor'
            ),

          visibility:
            clamp(
              item?.visibility,
              0,
              100
            ),

          mentions:
            clamp(
              item?.mentions,
              0,
              500
            )
        })),


    /* -----------------------------------------------------
       OPPORTUNITIES
    ----------------------------------------------------- */

    opportunities:
      opportunities
        .slice(0, 4)
        .map(item => ({
          priority:
            String(
              item?.priority ||
              'MEDIUM'
            ).toUpperCase(),

          title:
            String(
              item?.title ||
              'Improve content coverage'
            ),

          description:
            String(
              item?.description ||
              'Improve website content for better AI visibility.'
            ),

          impact:
            clamp(
              item?.impact,
              0,
              100
            )
        })),


    /* -----------------------------------------------------
       REPORT
    ----------------------------------------------------- */

    report: {

      keyFinding:
        String(
          result?.report?.keyFinding ||
          'Website analysis completed.'
        ),

      nextActions:
        String(
          result?.report?.nextActions ||
          'Review content opportunities and improve website content.'
        )
    }
  };
}


/* =========================================================
   SLEEP
========================================================= */

function sleep(ms) {
  return new Promise(
    resolve => setTimeout(resolve, ms)
  );
}


/* =========================================================
   GEMINI CALL
========================================================= */

async function callGemini(
  model,
  prompt
) {

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(model)}:generateContent`;


  console.log(
    `Trying Gemini model: ${model}`
  );


  const controller =
    new AbortController();


  const timeout =
    setTimeout(() => {
      controller.abort();
    }, 60000);


  try {

    const response =
      await fetch(
        endpoint,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            'x-goog-api-key':
              GEMINI_API_KEY
          },

          body: JSON.stringify({

            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],

            generationConfig: {
              responseMimeType:
                'application/json'
            }

          }),

          signal:
            controller.signal
        }
      );


    const data =
      await response.json();


    return {
      response,
      data
    };

  } finally {

    clearTimeout(timeout);

  }
}


/* =========================================================
   GEMINI MODELS
========================================================= */

function getModels() {

  return [
    GEMINI_MODEL,
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash'
  ].filter(
    (model, index, array) =>
      model &&
      array.indexOf(model) === index
  );
}


/* =========================================================
   ANALYZE API
========================================================= */

app.post(
  '/api/analyze',
  async (req, res) => {

    try {

      console.log(
        '\n======================================'
      );

      console.log(
        'New website analysis request'
      );


      /* -----------------------------------------------------
         API KEY CHECK
      ----------------------------------------------------- */

      if (!GEMINI_API_KEY) {

        return res.status(500).json({
          error:
            'GEMINI_API_KEY is missing in .env'
        });

      }


      /* -----------------------------------------------------
         URL
      ----------------------------------------------------- */

      let url =
        String(
          req.body?.url || ''
        ).trim();


      if (!url) {

        return res.status(400).json({
          error:
            'Website URL is required.'
        });

      }


      if (
        !/^https?:\/\//i.test(url)
      ) {
        url =
          'https://' + url;
      }


      try {

        new URL(url);

      } catch {

        return res.status(400).json({
          error:
            'Invalid website URL.'
        });

      }


      console.log(
        `Website: ${url}`
      );


      /* -----------------------------------------------------
         FETCH WEBSITE
      ----------------------------------------------------- */

      const controller =
        new AbortController();


      const timeout =
        setTimeout(() => {
          controller.abort();
        }, 30000);


      let pageResponse;


      try {

        pageResponse =
          await fetch(
            url,
            {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (compatible; AIViz/1.0)',

                Accept:
                  'text/html,application/xhtml+xml'
              },

              redirect: 'follow',

              signal:
                controller.signal
            }
          );

      } catch (error) {

        if (
          error.name ===
          'AbortError'
        ) {

          return res.status(408).json({
            error:
              'Website request timed out.'
          });

        }


        return res.status(400).json({
          error:
            `Unable to fetch website: ${error.message}`
        });

      } finally {

        clearTimeout(timeout);

      }


      if (
        !pageResponse.ok
      ) {

        return res.status(400).json({
          error:
            `Website returned HTTP ${pageResponse.status}.`
        });

      }


      /* -----------------------------------------------------
         WEBSITE CONTENT
      ----------------------------------------------------- */

      const html =
        await pageResponse.text();


      const pageText =
        cleanHtml(html);


      if (!pageText) {

        return res.status(400).json({
          error:
            'Could not extract readable website content.'
        });

      }


      console.log(
        `Website content: ${pageText.length} characters`
      );


      /* =====================================================
         GEMINI PROMPT
      ===================================================== */

      const prompt = `
You are an AI visibility analysis engine.

Analyze this website using ONLY the supplied website content.

Website:
${url}

Website content:
${pageText}

Return ONLY valid JSON.

Do NOT claim that you actually queried Google, ChatGPT,
Perplexity, Claude, search engines, backlinks or external
SEO tools.

All metrics are AI-generated estimates based on the
website content.

Return EXACTLY this structure:

{
  "aiVisibility": 0,
  "brandMentions": 0,
  "promptsTracked": 25,
  "opportunityScore": 0,

  "engines": [
    {
      "name": "Google AI Overviews",
      "visibility": 0
    },
    {
      "name": "ChatGPT",
      "visibility": 0
    },
    {
      "name": "Perplexity",
      "visibility": 0
    },
    {
      "name": "Claude",
      "visibility": 0
    }
  ],

  "prompts": [],

  "competitors": [],

  "opportunities": [],

  "report": {
    "keyFinding": "",
    "nextActions": ""
  }
}

RULES:

1. aiVisibility = integer 0-100.

2. brandMentions = integer 0-500.
   This is an estimated metric.

3. promptsTracked MUST be exactly 25.

4. opportunityScore = integer 0-100.

5. Return exactly 4 engines.

6. Generate EXACTLY 25 website-specific prompts.

7. Prompts MUST relate to the actual website.
   Do not use AIViz demo prompts.

8. Each prompt must contain:
   prompt
   topic
   visibility
   status

9. status must be either:
   Visible
   Gap

10. Generate up to 4 relevant competitors.

11. Competitor data is estimated, not actual external data.

12. Each competitor must contain:
   name
   visibility
   mentions

13. Generate EXACTLY 4 opportunities.

14. Each opportunity must contain:
   priority
   title
   description
   impact

15. priority must be:
   HIGH
   MEDIUM
   LOW

16. Generate website-specific report:
   keyFinding
   nextActions

17. Do not use old AIViz demo data.

18. Do not return markdown.

19. Do not use code fences.

20. Return JSON only.
`;


      /* =====================================================
         TRY GEMINI MODELS
      ===================================================== */

      const models =
        getModels();


      let lastError =
        null;


      for (
        const model of models
      ) {

        for (
          let attempt = 1;
          attempt <= 2;
          attempt++
        ) {

          try {

            console.log(
              `Gemini ${model} - attempt ${attempt}/2`
            );


            const {
              response,
              data
            } =
              await callGemini(
                model,
                prompt
              );


            /* -------------------------------------------------
               SUCCESS
            ------------------------------------------------- */

            if (
              response.ok
            ) {

              const text =
                data
                  ?.candidates?.[0]
                  ?.content?.parts
                  ?.map(
                    part =>
                      part.text || ''
                  )
                  .join('') || '';


              if (!text) {

                throw new Error(
                  'Gemini returned empty response.'
                );

              }


              const result =
                parseGeminiJson(
                  text
                );


              const finalResult =
                normalizeResult(
                  result
                );


              console.log(
                'Gemini analysis SUCCESS'
              );


              console.log(
                JSON.stringify(
                  finalResult,
                  null,
                  2
                )
              );


              return res.json(
                finalResult
              );

            }


            /* -------------------------------------------------
               ERROR
            ------------------------------------------------- */

            const message =
              data?.error?.message ||
              `Gemini HTTP ${response.status}`;


            console.error(
              `Gemini ${model} failed:`,
              response.status,
              message
            );


            lastError = {
              status:
                response.status,

              message
            };


            /* 404 = model unavailable */

            if (
              response.status ===
              404
            ) {
              break;
            }


            /* API key / permission */

            if (
              response.status === 400 ||
              response.status === 401 ||
              response.status === 403
            ) {

              return res.status(500).json({
                error:
                  `Gemini API error: ${message}`
              });

            }


            /* Temporary errors */

            if (
              [
                429,
                500,
                502,
                503,
                504
              ].includes(
                response.status
              )
            ) {

              if (
                attempt < 2
              ) {

                await sleep(
                  3000
                );

                continue;

              }

              break;

            }


            break;

          } catch (error) {

            console.error(
              `Gemini ${model} error:`,
              error.message
            );


            lastError = {
              status: 503,
              message:
                error.message
            };


            if (
              attempt < 2
            ) {

              await sleep(
                3000
              );

              continue;

            }

            break;

          }

        }

      }


      /* =====================================================
         ALL MODELS FAILED
      ===================================================== */

      console.error(
        'All Gemini models failed.',
        lastError
      );


      return res.status(503).json({
        error:
          'Gemini is temporarily unavailable. Please try again in a few minutes.'
      });


    } catch (error) {

      console.error(
        'Server error:',
        error
      );


      return res.status(500).json({
        error:
          error.message ||
          'Unable to analyze website.'
      });

    }

  }
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  '/api/health',
  (req, res) => {

    res.json({
      status: 'ok',

      geminiConfigured:
        Boolean(
          GEMINI_API_KEY
        ),

      model:
        GEMINI_MODEL
    });

  }
);


/* =========================================================
   FRONTEND FALLBACK
========================================================= */

app.get(/^(?!\/api).*/, (req, res) => {
  if (path.extname(req.path)) {
    return res.status(404).end();
  }

  res.type('html');
  res.sendFile(path.join(staticDir, 'index.html'));
});


/* =========================================================
   START SERVER
========================================================= */

if (require.main === module) {
  app.listen(
    PORT,
    () => {

      console.log('');
      console.log(
        '======================================'
      );

      console.log(
        `AIViz running at http://localhost:${PORT}`
      );

      console.log(
        `Primary Gemini model: ${GEMINI_MODEL}`
      );

      console.log(
        '======================================'
      );

      console.log('');

    }
  );
}

module.exports = app;