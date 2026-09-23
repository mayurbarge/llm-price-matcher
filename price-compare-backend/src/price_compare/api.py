"""FastAPI server exposing the Blinkit/Zepto comparison as a JSON API.

Run with:
    uvicorn price_compare.api:app --reload --port 8000
"""

import logging
import time

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware

from .cache import TTLCache
from .comparison import run_comparison
from .logging_config import configure_logging

configure_logging()
logger = logging.getLogger(__name__)

app = FastAPI(title="Price Compare API", version="0.1.0")

# Wide open on purpose: this is a local dev tool meant to be called from an
# Expo app on your own network, not a public service. Tighten this if it
# ever runs anywhere other than your own machine.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_every_request(request: Request, call_next):
    """Transport-level logging: every request this server receives, and how
    it was answered. Business-level detail (what the crawl actually did)
    is logged separately in comparison.py/scraper.py — this layer only
    cares about the HTTP contract.
    """
    started_at = time.perf_counter()
    logger.info("%s %s | query_params=%s", request.method, request.url.path, dict(request.query_params))

    response = await call_next(request)

    elapsed_ms = (time.perf_counter() - started_at) * 1000
    logger.info("%s %s -> %d (%.0fms)", request.method, request.url.path, response.status_code, elapsed_ms)
    return response


_comparison_cache = TTLCache(ttl_seconds=600)


def _build_cache_key(search_query: str, max_items: int) -> str:
    return f"{search_query.strip().lower()}|{max_items}"


@app.get("/api/health")
def health_check() -> dict:
    return {"status": "ok"}


@app.get("/api/compare")
async def compare_prices(
    query: str = Query(..., min_length=1, description="Product search term, e.g. 'dove soap'"),
    max_items: int = Query(20, ge=1, le=50),
) -> dict:
    cache_key = _build_cache_key(query, max_items)
    cached_result = _comparison_cache.get(cache_key)
    if cached_result is not None:
        return cached_result

    try:
        comparison_result = await run_comparison(search_query=query, max_items=max_items)
    except Exception as exc:
        logger.exception("Unhandled error while comparing | query=%r max_items=%d", query, max_items)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    _comparison_cache.set(cache_key, comparison_result)
    return comparison_result
