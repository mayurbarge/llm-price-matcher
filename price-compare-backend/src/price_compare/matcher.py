# """Matches equivalent products between two platforms' result lists.

# Pure functions, no network calls — this is the part that was unit-tested
# against hand-written fake data before being wired to the live scraper.

# Matching is structural, not a single fuzzy score over the whole product
# title: brand has to match first (two products from different brands are
# never the same product, no matter how similar the rest of the wording is),
# then simple_name is fuzzy-matched on its own, then pack size acts as a
# penalty. simple_name is already canonicalized at extraction time (see
# models.py) -- the LLM is asked to use standard grocery terminology instead
# of copying each retailer's exact wording, so "besan" and "gram flour"
# tend to converge before matching ever runs, rather than needing a
# synonym dictionary here to bridge them after the fact.
# """

# import logging
# import re
# from typing import Optional

# from rapidfuzz import fuzz

# logger = logging.getLogger(__name__)

# BRAND_MATCH_THRESHOLD = 80
# VARIANT_MATCH_THRESHOLD = 68
# SIZE_MISMATCH_PENALTY = 25


# def normalize(text: str) -> str:
#     text = (text or "").lower()
#     text = re.sub(r"[^a-z0-9\s]", " ", text)
#     return re.sub(r"\s+", " ", text).strip()


# def extract_size_in_grams_or_ml(text: Optional[str]) -> Optional[float]:
#     """Rough pack-size normalizer so '3 x 100 g' and '300 g' can be compared."""
#     if not text:
#         return None
#     text = text.lower()
#     m = re.search(r"(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(g|gm|gram|ml)", text)
#     if m:
#         return float(m.group(1)) * float(m.group(2))
#     m = re.search(r"(\d+(?:\.\d+)?)\s*(kg|l|litre|liter)\b", text)
#     if m:
#         return float(m.group(1)) * 1000
#     m = re.search(r"(\d+(?:\.\d+)?)\s*(g|gm|gram|ml)\b", text)
#     if m:
#         return float(m.group(1))
#     return None


# def _brands_are_compatible(candidate_a: dict, candidate_b: dict) -> bool:
#     """True if the two products' brands don't rule out a match.

#     Missing brand data on either side can't be used to rule anything out,
#     so it falls through as compatible rather than rejecting the pair --
#     the variant-description comparison below still has to clear its own
#     threshold regardless.
#     """
#     brand_a = normalize(candidate_a.get("brand", ""))
#     brand_b = normalize(candidate_b.get("brand", ""))
#     if not brand_a or not brand_b:
#         return True
#     return fuzz.ratio(brand_a, brand_b) >= BRAND_MATCH_THRESHOLD


# def _comparable_name(product: dict) -> str:
#     """The text actually compared for similarity.

#     Prefers the LLM's canonicalized simple_name; falls back to the full
#     name if extraction ever leaves it blank, so a single missing field
#     degrades matching rather than breaking it.
#     """
#     return product.get("simple_name") or product.get("name", "")


# def match_products(
#     blinkit_items: list[dict], zepto_items: list[dict], variant_match_threshold: float = VARIANT_MATCH_THRESHOLD
# ) -> tuple[list, list, list]:
#     used_zepto: set[int] = set()
#     matched, blinkit_only = [], []

#     for b in blinkit_items:
#         b_name = normalize(_comparable_name(b))
#         b_size = extract_size_in_grams_or_ml(b.get("quantity") or b.get("name", ""))
#         best_idx, best_score = None, 0.0

#         for i, z in enumerate(zepto_items):
#             if i in used_zepto:
#                 continue
#             if not _brands_are_compatible(b, z):
#                 continue

#             z_name = normalize(_comparable_name(z))
#             score = fuzz.token_set_ratio(b_name, z_name)

#             z_size = extract_size_in_grams_or_ml(z.get("quantity") or z.get("name", ""))
#             if b_size and z_size and abs(b_size - z_size) > 0.01 * max(b_size, z_size):
#                 score -= SIZE_MISMATCH_PENALTY  # penalize likely-different pack sizes

#             if score > best_score:
#                 best_score, best_idx = score, i

#         if best_idx is not None and best_score >= variant_match_threshold:
#             used_zepto.add(best_idx)
#             z = zepto_items[best_idx]
#             b_price, z_price = b.get("price"), z.get("price")
#             cheaper = None
#             price_diff = 0
#             if isinstance(b_price, (int, float)) and isinstance(z_price, (int, float)):
#                 if b_price < z_price:
#                     cheaper = "blinkit"
#                 elif z_price < b_price:
#                     cheaper = "zepto"
#                 else:
#                     cheaper = "tie"
#                 price_diff = round(abs(b_price - z_price), 2)
#             logger.debug(
#                 "matched %r <-> %r | score=%.1f cheaper=%s diff=%s",
#                 b.get("name"), z.get("name"), best_score, cheaper, price_diff,
#             )
#             matched.append(
#                 {
#                     "blinkit": b,
#                     "zepto": z,
#                     "match_confidence": round(best_score, 1),
#                     "cheaper_platform": cheaper,
#                     "price_diff": price_diff,
#                 }
#             )
#         else:
#             logger.debug("no match for %r (best_score=%.1f, below threshold %.1f)", b.get("name"), best_score, variant_match_threshold)
#             blinkit_only.append(b)

#     zepto_only = [z for i, z in enumerate(zepto_items) if i not in used_zepto]
#     logger.info(
#         "matching finished | blinkit_in=%d zepto_in=%d matched=%d blinkit_only=%d zepto_only=%d",
#         len(blinkit_items), len(zepto_items), len(matched), len(blinkit_only), len(zepto_only),
#     )
#     return matched, blinkit_only, zepto_only


"""Matches equivalent products between two platforms' result lists.

Pure functions, no network calls — this is the part that was unit-tested
against hand-written fake data before being wired to the live scraper.

Matching combines three signals into one weighted score, rather than
gating on name similarity with price/size bolted on as an afterthought:

- name similarity (from the LLM's canonicalized simple_name)
- size similarity — the same product's pack size should barely vary
  between platforms (~5% tolerance)
- price similarity — the same product typically differs by roughly
  2-10% between platforms, not by a lot

Price and size are weighted higher than name on purpose: product naming
varies a lot across retailers even after canonicalization, while two
independently-listed products that happen to share almost the same pack
size AND a plausible same-product price gap are unlikely to be a
coincidence. Brand still has to be compatible first, as a hard gate --
weighting size/price higher doesn't mean ignoring brand entirely.
"""

import logging
import re
from typing import Optional

from rapidfuzz import fuzz

logger = logging.getLogger(__name__)

BRAND_MATCH_THRESHOLD = 80
MATCH_THRESHOLD = 70.0

NAME_WEIGHT = 1.0
SIZE_WEIGHT = 2.0
PRICE_WEIGHT = 2.0

# Same product, same size: expect roughly this much price gap between
# platforms, not more.
EXPECTED_PRICE_VARIATION = 0.10
# Same product: expect pack size to match this closely.
EXPECTED_SIZE_VARIATION = 0.05


def normalize(text: str) -> str:
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def extract_size_in_grams_or_ml(text: Optional[str]) -> Optional[float]:
    """Rough pack-size normalizer so '3 x 100 g' and '300 g' can be compared."""
    if not text:
        return None
    text = text.lower()
    m = re.search(r"(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(g|gm|gram|ml)", text)
    if m:
        return float(m.group(1)) * float(m.group(2))
    m = re.search(r"(\d+(?:\.\d+)?)\s*(kg|l|litre|liter)\b", text)
    if m:
        return float(m.group(1)) * 1000
    m = re.search(r"(\d+(?:\.\d+)?)\s*(g|gm|gram|ml)\b", text)
    if m:
        return float(m.group(1))
    return None


def _brands_are_compatible(candidate_a: dict, candidate_b: dict) -> bool:
    """True if the two products' brands don't rule out a match.

    Missing brand data on either side can't be used to rule anything out.
    """
    brand_a = normalize(candidate_a.get("brand", ""))
    brand_b = normalize(candidate_b.get("brand", ""))
    if not brand_a or not brand_b:
        return True
    return fuzz.ratio(brand_a, brand_b) >= BRAND_MATCH_THRESHOLD


def _comparable_name(product: dict) -> str:
    """Prefers the LLM's canonicalized simple_name; falls back to the full
    name if extraction ever leaves it blank."""
    return product.get("simple_name") or product.get("name", "")


def _name_similarity_score(candidate_a: dict, candidate_b: dict) -> float:
    name_a = normalize(_comparable_name(candidate_a))
    name_b = normalize(_comparable_name(candidate_b))
    return fuzz.token_set_ratio(name_a, name_b)


def _size_similarity_score(candidate_a: dict, candidate_b: dict) -> Optional[float]:
    """100 for pack sizes within EXPECTED_SIZE_VARIATION of each other,
    decreasing toward 0 as the gap grows well beyond that. None if either
    pack size is unknown, so it's left out of the weighted average rather
    than guessed at.
    """
    size_a = extract_size_in_grams_or_ml(candidate_a.get("quantity") or candidate_a.get("name", ""))
    size_b = extract_size_in_grams_or_ml(candidate_b.get("quantity") or candidate_b.get("name", ""))
    if not size_a or not size_b:
        return None

    percent_difference = abs(size_a - size_b) / max(size_a, size_b)
    if percent_difference <= EXPECTED_SIZE_VARIATION:
        return 100.0
    # Reaches 0 once the gap hits 50% -- e.g. 100 g vs 200 g is clearly a different pack.
    return max(0.0, 100.0 * (1 - (percent_difference - EXPECTED_SIZE_VARIATION) / 0.45))


def _price_similarity_score(candidate_a: dict, candidate_b: dict) -> Optional[float]:
    """100 when the price gap sits inside the ~2-10% two platforms
    typically differ by for the same product, decreasing toward 0 as the
    gap grows well beyond that -- a large price gap is one of the
    strongest signals two candidates aren't actually the same product.
    None if either price is unknown.
    """
    price_a, price_b = candidate_a.get("price"), candidate_b.get("price")
    if not isinstance(price_a, (int, float)) or not isinstance(price_b, (int, float)):
        return None
    if not price_a or not price_b:
        return None

    percent_difference = abs(price_a - price_b) / max(price_a, price_b)
    if percent_difference <= EXPECTED_PRICE_VARIATION:
        return 100.0
    # Reaches 0 once the gap hits 60%.
    return max(0.0, 100.0 * (1 - (percent_difference - EXPECTED_PRICE_VARIATION) / 0.50))


def _overall_match_score(candidate_a: dict, candidate_b: dict) -> float:
    """Weighted blend of name/size/price similarity -- size and price
    count for more than name (see module docstring). A signal with no
    data (unknown size or price) is left out of the average entirely
    rather than defaulting it to a guessed score.
    """
    weighted_signals = [(_name_similarity_score(candidate_a, candidate_b), NAME_WEIGHT)]

    size_score = _size_similarity_score(candidate_a, candidate_b)
    if size_score is not None:
        weighted_signals.append((size_score, SIZE_WEIGHT))

    price_score = _price_similarity_score(candidate_a, candidate_b)
    if price_score is not None:
        weighted_signals.append((price_score, PRICE_WEIGHT))

    total_weight = sum(weight for _, weight in weighted_signals)
    return sum(score * weight for score, weight in weighted_signals) / total_weight


def match_products(
    blinkit_items: list[dict], zepto_items: list[dict], match_threshold: float = MATCH_THRESHOLD
) -> tuple[list, list, list]:
    used_zepto: set[int] = set()
    matched, blinkit_only = [], []

    for b in blinkit_items:
        best_idx, best_score = None, 0.0

        for i, z in enumerate(zepto_items):
            if i in used_zepto:
                continue
            if not _brands_are_compatible(b, z):
                continue

            score = _overall_match_score(b, z)
            if score > best_score:
                best_score, best_idx = score, i

        if best_idx is not None and best_score >= match_threshold:
            used_zepto.add(best_idx)
            z = zepto_items[best_idx]
            b_price, z_price = b.get("price"), z.get("price")
            cheaper = None
            price_diff = 0
            if isinstance(b_price, (int, float)) and isinstance(z_price, (int, float)):
                if b_price < z_price:
                    cheaper = "blinkit"
                elif z_price < b_price:
                    cheaper = "zepto"
                else:
                    cheaper = "tie"
                price_diff = round(abs(b_price - z_price), 2)
            logger.debug(
                "matched %r <-> %r | score=%.1f cheaper=%s diff=%s",
                b.get("name"), z.get("name"), best_score, cheaper, price_diff,
            )
            matched.append(
                {
                    "blinkit": b,
                    "zepto": z,
                    "match_confidence": round(best_score, 1),
                    "cheaper_platform": cheaper,
                    "price_diff": price_diff,
                }
            )
        else:
            logger.debug("no match for %r (best_score=%.1f, below threshold %.1f)", b.get("name"), best_score, match_threshold)
            blinkit_only.append(b)

    zepto_only = [z for i, z in enumerate(zepto_items) if i not in used_zepto]
    logger.info(
        "matching finished | blinkit_in=%d zepto_in=%d matched=%d blinkit_only=%d zepto_only=%d",
        len(blinkit_items), len(zepto_items), len(matched), len(blinkit_only), len(zepto_only),
    )
    return matched, blinkit_only, zepto_only