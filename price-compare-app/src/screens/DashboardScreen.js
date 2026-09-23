import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme';
import { SearchStatus, useComparisonSearch } from '../hooks/useComparisonSearch';
import { countWinsByPlatform, findBiggestSaving, sortMatchedPairs } from '../utils/comparisonSelectors';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import { SORT_OPTIONS } from '../constants';

import SearchBar from '../components/SearchBar';
import IdleState from '../components/IdleState';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import NoMatchesFound from '../components/NoMatchesFound';
import PlatformErrorBanner from '../components/PlatformErrorBanner';
import BestDealBanner from '../components/BestDealBanner';
import ScoreBoard from '../components/ScoreBoard';
import SortSelector from '../components/SortSelector';
import ComparisonCard from '../components/ComparisonCard';
import CollapsibleSection from '../components/CollapsibleSection';
import PlatformOnlyRow from '../components/PlatformOnlyRow';

export default function DashboardScreen() {
  const { query, setQuery, status, comparisonResult, errorMessage, search } = useComparisonSearch();
  const [sortKey, setSortKey] = useState(SORT_OPTIONS[0].key);

  const matchedPairs = comparisonResult?.matched ?? [];
  const blinkitOnlyProducts = comparisonResult?.blinkit_only ?? [];
  const zeptoOnlyProducts = comparisonResult?.zepto_only ?? [];

  const winCounts = useMemo(() => countWinsByPlatform(matchedPairs), [matchedPairs]);
  const biggestSavingPair = useMemo(() => findBiggestSaving(matchedPairs), [matchedPairs]);
  const sortedPairs = useMemo(() => sortMatchedPairs(matchedPairs, sortKey), [matchedPairs, sortKey]);

  return (
    <View style={styles.container}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onSubmit={() => search()}
        loading={status === SearchStatus.LOADING}
      />

      {status === SearchStatus.IDLE && <IdleState onExampleSelected={search} />}
      {status === SearchStatus.LOADING && <LoadingState query={query} />}
      {status === SearchStatus.ERROR && <ErrorState message={errorMessage} onRetry={() => search()} />}

      {status === SearchStatus.SUCCESS && (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={sortedPairs}
          keyExtractor={(_, index) => `pair-${index}`}
          renderItem={({ item }) => <ComparisonCard pair={item} />}
          ListHeaderComponent={
            <View>
              <View style={styles.resultsHeader}>
                <Text style={styles.queryTitle}>{comparisonResult.query}</Text>
                <Text style={styles.meta}>
                  {comparisonResult.counts.blinkit_total} vs {comparisonResult.counts.zepto_total} listings,{' '}
                  {formatRelativeTime(comparisonResult.fetched_at)}
                </Text>
              </View>

              <PlatformErrorBanner platformErrors={comparisonResult.errors} />
              <BestDealBanner pair={biggestSavingPair} />
              <ScoreBoard winCounts={winCounts} />

              {matchedPairs.length > 0 && <SortSelector selectedSortKey={sortKey} onSortKeyChange={setSortKey} />}
            </View>
          }
          ListFooterComponent={
            <View>
              <CollapsibleSection
                title="Only on Blinkit"
                accent={colors.blinkit}
                items={blinkitOnlyProducts}
                renderItem={(item, index) => <PlatformOnlyRow key={`blinkit-only-${index}`} item={item} />}
              />
              <CollapsibleSection
                title="Only on Zepto"
                accent={colors.zepto}
                items={zeptoOnlyProducts}
                renderItem={(item, index) => <PlatformOnlyRow key={`zepto-only-${index}`} item={item} />}
              />
              <View style={{ height: spacing.xl }} />
            </View>
          }
          ListEmptyComponent={<NoMatchesFound />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  resultsHeader: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  queryTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 24,
    color: colors.ink,
    textTransform: 'capitalize',
  },
  meta: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
});
