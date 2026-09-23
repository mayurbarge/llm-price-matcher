import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, platformAccent, platformInkOnAccent, platformLabel, radius, spacing } from '../theme';

const PLATFORM_KEYS = ['blinkit', 'zepto'];

function PriceBlock({ platformKey, product, isWinner }) {
  const price = product?.price;
  return (
    <View
      style={[
        styles.priceBlock,
        isWinner
          ? { backgroundColor: platformAccent(platformKey) }
          : { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 },
      ]}
    >
      <Text style={[styles.priceLabel, { color: isWinner ? platformInkOnAccent(platformKey) : colors.inkMuted }]}>
        {platformLabel(platformKey)}
      </Text>
      <Text style={[styles.priceValue, { color: isWinner ? platformInkOnAccent(platformKey) : colors.ink }]}>
        {price != null ? `₹${Number(price).toFixed(0)}` : '—'}
      </Text>
    </View>
  );
}

export default function ComparisonCard({ pair }) {
  const { blinkit, zepto, cheaper_platform: cheaperPlatform, price_diff: priceDifference } = pair;
  const productName = blinkit?.name || zepto?.name || 'Unnamed product';
  const packSize = blinkit?.quantity || zepto?.quantity;
  const isTie = cheaperPlatform === 'tie';

  const winningAccentColor = cheaperPlatform && !isTie ? platformAccent(cheaperPlatform) : colors.border;

  return (
    <View style={[styles.card, { borderLeftColor: winningAccentColor }]}>
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={2}>
          {productName}
        </Text>
        {packSize ? <Text style={styles.quantity}>{packSize}</Text> : null}
      </View>

      <View style={styles.pricesRow}>
        {PLATFORM_KEYS.map((platformKey) => (
          <PriceBlock
            key={platformKey}
            platformKey={platformKey}
            product={platformKey === 'blinkit' ? blinkit : zepto}
            isWinner={cheaperPlatform === platformKey}
          />
        ))}
      </View>

      {!isTie && cheaperPlatform && priceDifference > 0 ? (
        <View style={styles.saveTag}>
          <Text style={styles.saveText}>
            {platformLabel(cheaperPlatform)} saves ₹{Number(priceDifference).toFixed(0)}
          </Text>
        </View>
      ) : (
        <Text style={styles.tieText}>Same price on both</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  headerRow: {
    marginBottom: spacing.sm,
  },
  name: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.ink,
  },
  quantity: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  pricesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priceBlock: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  priceLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    marginBottom: 2,
  },
  priceValue: {
    fontFamily: fonts.mono,
    fontSize: 18,
  },
  saveTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.winSoft,
    borderRadius: radius.sm,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
  },
  saveText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.win,
  },
  tieText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.inkFaint,
    marginTop: spacing.sm,
  },
});
