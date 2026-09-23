import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme';

export default function PlatformOnlyRow({ item }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        {item.quantity ? <Text style={styles.quantity}>{item.quantity}</Text> : null}
      </View>
      <Text style={styles.price}>₹{Number(item.price).toFixed(0)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  name: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.ink,
  },
  quantity: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.inkMuted,
  },
  price: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.ink,
    marginLeft: spacing.sm,
  },
});
