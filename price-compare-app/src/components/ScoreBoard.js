import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, platformAccent, platformInkOnAccent, platformLabel, radius, spacing } from '../theme';

function PlatformWinCount({ platformKey, winCount }) {
  const textColor = platformInkOnAccent(platformKey);
  return (
    <View style={[styles.card, { backgroundColor: platformAccent(platformKey) }]}>
      <Text style={[styles.label, { color: textColor }]}>{platformLabel(platformKey).toUpperCase()}</Text>
      <Text style={[styles.number, { color: textColor }]}>{winCount}</Text>
      <Text style={[styles.sub, { color: textColor }]}>cheaper on</Text>
    </View>
  );
}

export default function ScoreBoard({ winCounts }) {
  return (
    <View style={styles.row}>
      <PlatformWinCount platformKey="blinkit" winCount={winCounts.blinkit} />

      <View style={styles.vsWrap}>
        <Text style={styles.vs}>vs</Text>
        {winCounts.ties > 0 && <Text style={styles.ties}>{winCounts.ties} tied</Text>}
      </View>

      <PlatformWinCount platformKey="zepto" winCount={winCounts.zepto} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  number: {
    fontFamily: fonts.monoBold,
    fontSize: 40,
    lineHeight: 44,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 2,
    opacity: 0.75,
  },
  vsWrap: {
    width: 44,
    alignItems: 'center',
  },
  vs: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.inkFaint,
  },
  ties: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.inkFaint,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
