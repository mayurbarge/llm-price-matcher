import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme';
import ComparisonCard from './ComparisonCard';

export default function BestDealBanner({ pair }) {
  if (!pair) return null;

  const { cheaper_platform: cheaperPlatform, price_diff: priceDifference } = pair;
  if (!cheaperPlatform || cheaperPlatform === 'tie' || !priceDifference) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Biggest saving</Text>
      <ComparisonCard pair={pair} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 0.4,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
});
