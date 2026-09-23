function getPairProductName(pair) {
  return pair.blinkit?.name || pair.zepto?.name || '';
}

export function countWinsByPlatform(matchedPairs) {
  return matchedPairs.reduce(
    (winCounts, pair) => {
      if (pair.cheaper_platform === 'blinkit') winCounts.blinkit += 1;
      else if (pair.cheaper_platform === 'zepto') winCounts.zepto += 1;
      else winCounts.ties += 1;
      return winCounts;
    },
    { blinkit: 0, zepto: 0, ties: 0 }
  );
}

export function findBiggestSaving(matchedPairs) {
  if (matchedPairs.length === 0) return null;
  return matchedPairs.reduce((biggestSoFar, pair) =>
    (pair.price_diff || 0) > (biggestSoFar.price_diff || 0) ? pair : biggestSoFar
  );
}

export function sortMatchedPairs(matchedPairs, sortKey) {
  const pairsCopy = [...matchedPairs];
  if (sortKey === 'name') {
    return pairsCopy.sort((a, b) => getPairProductName(a).localeCompare(getPairProductName(b)));
  }
  return pairsCopy.sort((a, b) => (b.price_diff || 0) - (a.price_diff || 0));
}
