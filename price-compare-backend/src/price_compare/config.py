"""Per-platform crawl configuration.

Each platform gets its own PlatformConfig instead of sharing one generic
dict, because the two platforms genuinely need different setup: Blinkit is
hyperlocal and returns unusable results without a delivery location fixed
via cookies before the page loads; Zepto returns usable results with no
location setup at all.
"""

import os
from dataclasses import dataclass, field
from typing import Optional


@dataclass(frozen=True)
class PlatformConfig:
    """Everything scraper.py needs to know about one platform's search page."""

    key: str
    label: str
    search_url_template: str
    origin: str
    location_cookies: dict[str, str] = field(default_factory=dict)
    requires_scroll_to_load_more_results: bool = True
    page_load_timeout_ms: int = 60_000
    # Pause between scroll steps while loading more results -- needs to be
    # long enough for a slower platform's next batch to actually arrive.
    scroll_delay_seconds: float = 1.0
    # CSS selector for the on-page search box, only set for a platform
    # whose search results don't load from the URL's query parameter alone
    # (confirmed necessary for Zepto -- landing on the URL shows a generic
    # default listing, not query results, until something actually types
    # into the search box). None means "the URL parameter is enough".
    search_input_selector: Optional[str] = None

    def build_search_url(self, query: str) -> str:
        return self.search_url_template.format(query=query.replace(" ", "+"))

    def build_browser_cookies(self) -> list[dict[str, str]]:
        """crawl4ai/Playwright expect cookies as a list of {"name","value","url"} dicts."""
        return [
            {"name": cookie_name, "value": cookie_value, "url": self.origin}
            for cookie_name, cookie_value in self.location_cookies.items()
        ]


# Blinkit's delivery location was captured from a real browser session set
# to Magarpatta, Hadapsar, Pune. To crawl for a different city: open
# Blinkit, set your location there, then copy the matching gr_1_* cookies
# from DevTools -> Application -> Cookies, and replace the values below.
BLINKIT_DELIVERY_LOCATION = {
    "latitude": "18.515805699999998",
    "longitude": "73.9271644",
    "locality": "Pune",
    "landmark": "Magarpatta%2C%20Hadapsar%2C%20Pune%2C%20Maharashtra%2C%20India",
}

BLINKIT_CONFIG = PlatformConfig(
    key="blinkit",
    label="Blinkit",
    search_url_template="https://blinkit.com/s/?q={query}",
    origin="https://blinkit.com",
    location_cookies={
        "gr_1_lat": BLINKIT_DELIVERY_LOCATION["latitude"],
        "gr_1_lon": BLINKIT_DELIVERY_LOCATION["longitude"],
        "gr_1_locality": BLINKIT_DELIVERY_LOCATION["locality"],
        "gr_1_landmark": BLINKIT_DELIVERY_LOCATION["landmark"],
    },
    # Blinkit renders noticeably slower than Zepto, so it gets more room
    # on both the overall ceiling and the pause between scroll steps.
    page_load_timeout_ms=90_000,
    scroll_delay_seconds=1.8,
)

# Zepto returns usable results with no location cookies at all -- but,
# unlike Blinkit, landing directly on the URL with ?query=... shows a
# generic default listing rather than real search results, so the query
# has to be typed into the on-page search box (see search_input_selector
# and scraper.py). This selector is a best-effort guess (type="search" or
# a placeholder mentioning "search" are common, standard patterns) rather
# than something verified against Zepto's real markup -- if it doesn't
# find the right input, the fix is to inspect the box in DevTools and
# swap in its real selector here.
ZEPTO_CONFIG = PlatformConfig(
    key="zepto",
    label="Zepto",
    search_url_template="https://www.zepto.com/search?query={query}",
    origin="https://www.zepto.com",
    search_input_selector='input[type="search"], input[placeholder*="search" i], input[aria-label*="search" i]',
)

SUPPORTED_PLATFORMS: tuple[PlatformConfig, ...] = (BLINKIT_CONFIG, ZEPTO_CONFIG)

# Any litellm-style provider string works here. Pick one:
#   "openai/gpt-4o-mini"                  -> needs OPENAI_API_KEY, a few cents per run
#   "gemini/gemini-2.0-flash-lite"        -> needs GEMINI_API_KEY, free tier (30 rpm / 1500 rpd as of writing)
#   "groq/llama-3.3-70b-versatile"        -> needs GROQ_API_KEY, free tier, very fast
#   "ollama/qwen2.5"                      -> free, runs on your machine, needs Ollama installed
EXTRACTION_LLM_PROVIDER = os.environ.get("PRICE_COMPARE_LLM_PROVIDER", "gemini/gemini-3.5-flash-lite")
GEMINI_API_KEY=""
EXTRACTION_LLM_API_KEY=GEMINI_API_KEY