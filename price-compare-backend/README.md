# price-compare backend

A FastAPI server that compares Blinkit and Zepto search-result prices for a
query, using crawl4ai to do the actual crawling/extraction.

```
GET /api/compare?query=dove+soap
```
returns matched product pairs, platform-exclusive listings, and counts —
see `src/price_compare/api.py` for the exact shape.

## Tech stack

- Python 3.10+
- [crawl4ai](https://github.com/unclecode/crawl4AI) 0.9.3 — browser-based crawling + LLM-driven extraction
- FastAPI + uvicorn — the HTTP layer
- rapidfuzz — cross-platform product-name matching
- Pydantic — the `Product` schema shared by extraction and the API response

## Project layout

```
pyproject.toml
src/price_compare/
  config.py       PlatformConfig per platform (Blinkit's location cookies, Zepto's lack of them), LLM provider config
  models.py       Product schema + the extraction instruction given to the LLM
  scraper.py      crawl4ai crawl of one platform's search page, driven entirely by its PlatformConfig
  matcher.py       fuzzy name+size matching across platforms (pure functions)
  comparison.py    orchestration: crawl both platforms concurrently, match, shape the result
  cache.py         minimal in-memory TTL cache (10 min) so a repeat search doesn't re-crawl
  api.py           FastAPI app — the actual backend interface
  cli.py           thin debug CLI, mainly for --headful runs (see below)
```

### Why Blinkit and Zepto get separate config

Both platforms are represented as a `PlatformConfig` (in `config.py`), but
they're populated differently on purpose, not out of inconsistency:

- **Blinkit** is hyperlocal and returns unusable results without a delivery
  location. Rather than the earlier approach of guessing at a location
  prompt's markup and filling it in via JS, `BLINKIT_CONFIG` sets real
  cookies (`gr_1_lat`, `gr_1_lon`, `gr_1_locality`, `gr_1_landmark`) on the
  browser context before the page loads, via crawl4ai's native
  `BrowserConfig(cookies=...)`. These values were captured from a real
  Blinkit session set to Magarpatta, Hadapsar, Pune — to crawl for a
  different city, set your location on Blinkit yourself, copy the matching
  `gr_1_*` cookies from DevTools → Application → Cookies, and replace the
  values in `BLINKIT_DELIVERY_LOCATION`.
- **Zepto** returns usable results with no location step at all, so
  `ZEPTO_CONFIG` simply has no cookies — not empty placeholders, just
  nothing, because it needs nothing.

## Running it

```bash
pip install -e .
crawl4ai-setup              # one-time, downloads the browser
export OPENAI_API_KEY=sk-...  # or see "Minimizing extraction cost" below for free options

uvicorn price_compare.api:app --reload --port 8000
```

That's the whole backend — `GET http://localhost:8000/api/compare?query=dove+soap`
now runs a live crawl and returns JSON. `GET /api/health` is a trivial
liveness check. Interactive API docs are auto-served at `/docs`.

## Debugging a crawl directly (without the server)

```bash
price-compare-cli --query "dove soap" --headful
```

`--headful` shows the browser window — you'll want this the first time,
since the two most likely things to need adjusting are the delivery-location
prompt and the infinite-scroll trigger (see comments in `scraper.py`).
Writes `comparison.json`.

## What I verified vs. couldn't, and why

I built this inside a sandboxed container with an outbound-network
allowlist (pypi, npm, github, etc.) — blinkit.com and zepto.com aren't on
it. Rather than guess at what that would mean, I actually ran a full crawl
attempt from inside the sandbox and inspected the failure directly:

```
$ curl -i https://blinkit.com/s/?q=dove+soap
HTTP/1.1 403
x-deny-reason: host_not_allowed
Host not in allowlist: blinkit.com. Add this host to your network egress
settings to allow access.
```

That's my own sandbox's proxy talking, not Blinkit. crawl4ai's browser
launched fine and made a real request — it just got this response instead
of the real site, and its bot-detection heuristic (reasonably) flagged the
403 as looking like an anti-bot block. Worth knowing so you don't mistake
that specific error for a real Blinkit/Zepto defense if you see it
mentioned anywhere in this project's history — on your own machine, this
isn't a factor at all, and every module here (FastAPI app, crawl4ai calls,
matching logic) is verified against the real installed libraries and, for
`matcher.py`, actually exercised with realistic fake data. What I have no
way to verify from here is what a *real*, unrestricted request to Blinkit
or Zepto's servers actually gets back — real anti-bot detection, CAPTCHAs,
or something else entirely are all still open questions you'll only see
answered by running this yourself.

Two things that follow from not being able to reach the real sites:

- **robots.txt**: both sites disallow automated access to these exact
  pages (checked directly, separately from the sandbox issue above).
  crawl4ai doesn't enforce robots.txt, so this will still run, but that's
  the sites' stated position — treat this as a personal, low-frequency
  tool, not something to schedule or run at volume.
- **Selectors aren't hard-coded anywhere.** Extraction goes through an LLM
  reading the rendered page (see `build_extraction_instruction` in
  `models.py`) specifically because I have no way to check live CSS
  selectors from here, and they'd likely go stale quickly regardless. See
  "Minimizing extraction cost" below for how to make this free.
- **Loading more results uses crawl4ai's own built-in page-scan for
  Blinkit** (`scan_full_page` + `scroll_delay` + `max_scroll_steps` in
  `scraper.py`), but not for Zepto. **Zepto's search results don't load
  from the URL's `?query=` parameter alone** — landing directly on that
  URL shows a generic default listing, confirmed by testing. The query
  has to be typed into the on-page search box for real results to load.
  That in turn can't be combined with `scan_full_page`, because crawl4ai
  always runs `scan_full_page` *before* any `js_code`
  (`async_crawler_strategy.py`, checked directly) — if scrolling were left
  to the built-in scan, it would scroll the pre-search default listing,
  not the actual results. So for Zepto, typing the query and scrolling
  both happen in one script (`_TYPE_QUERY_THEN_SCROLL_JS_TEMPLATE`), in
  the right order, instead of using the built-in scan at all.
- **The search-box selector for Zepto (`input[role="combobox"]`) is
  confirmed from real DevTools markup**, not a guess. Worth noting since
  it also shows why a plausible first guess can still be wrong: the input
  is `type="text"`, not `type="search"` — a selector guessing at
  `type="search"` would never have matched anything on this page.
- **Page-load waiting uses `wait_until="load"`, not `"networkidle"`.**
  Networkidle looks like the right tool for "wait until really loaded",
  but many real sites — Blinkit included — keep some background connection
  alive indefinitely (analytics, polling, live order-tracking sockets), so
  the network never goes idle and the crawl just times out waiting for
  something that will never happen. `"load"` is the standard, reliable
  signal instead. Blinkit still gets more patience than Zepto where it
  actually helps — a longer `page_load_timeout_ms` and a slower
  `scroll_delay_seconds` between steps, both per-platform config in
  `config.py`.

## Minimizing extraction cost

Extraction runs through an LLM once per platform per search (see
`EXTRACTION_LLM_PROVIDER` in `config.py`), which is what costs money if you
use a paid model. A few ways to get this to zero:

- **Gemini free tier** — `gemini/gemini-2.0-flash-lite`, set
  `GEMINI_API_KEY`. As of writing, Google's free tier for this model is
  30 requests/min, 1M tokens/min, 1500 requests/day, no card required —
  comfortably enough for occasional personal searches. `gemini-1.5-flash`
  is the other free-tier option if you want a slightly older, still-capable
  model instead.
- **Groq free tier** — `groq/llama-3.3-70b-versatile`, set `GROQ_API_KEY`.
  Also free with no card, and Groq's inference is unusually fast, so
  crawls finish quicker too. Check Groq's console for their current
  free-tier model list and limits, since which models are free there
  changes periodically.
- **Ollama, fully free, runs on your machine** — `ollama/qwen2.5` (or any
  model you've pulled locally), `api_token` can be anything non-empty.
  No rate limits, no account, but needs Ollama installed and enough RAM to
  run a model at reasonable speed.

Whichever you pick, set it via environment variables rather than editing
`config.py`:

```bash
export PRICE_COMPARE_LLM_PROVIDER="gemini/gemini-2.0-flash-lite"
export PRICE_COMPARE_LLM_API_KEY="your-key-here"
```

The extraction prompt itself already caps the result count at `max_items`
(20 by default), which keeps the response side of the token budget small
regardless of provider. One more lever if cost still matters:
`input_format="html"` in `scraper.py` sends more tokens per page than
`input_format="markdown"` would. HTML was chosen because it keeps a
product's name and price spatially paired better in dense grid layouts,
which matters more for accuracy than markdown's lower token count — but if
a free tier's rate limit becomes the binding constraint rather than
accuracy, switching that one line to `"markdown"` is the next thing to try.

## Logging

Every request is traceable end to end: the incoming HTTP request, the
exact outgoing request to each platform (URL, which cookies, whether
scroll is enabled), each platform's outcome (status code, timing,
success/failure), the matcher's summary, and the final response — all
through the standard `logging` module, not scattered `print()` calls.

Default level is INFO. For full detail — raw extracted content previews,
individual match/no-match decisions, cache hits/misses — run with:

```bash
PRICE_COMPARE_LOG_LEVEL=DEBUG uvicorn price_compare.api:app --reload --port 8000
```

`logging_config.py` is the only place log level and format are
configured; every other module just does `logging.getLogger(__name__)`.

## Known simplifications (deliberate, not oversights)

- One process, in-memory cache, fresh browser per request. Fine for a
  personal tool; would need rework (persistent browser pool, shared cache)
  under real concurrent load.
- CORS is wide open (`allow_origins=["*"]`). Fine for calling from your own
  phone on your own network; tighten it before exposing this anywhere else.
- A search blocks for the full crawl duration (up to ~1 minute) rather than
  using a job-queue/polling pattern. Simpler, and fine for a single-user
  tool — the frontend's loading state assumes this.







# products to search
Britannica little hearts
cadbury dairy milk silk


zepto cheap >
brook bond red label tea