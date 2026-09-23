import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';

export default function CollapsibleSection({ title, accent, items, renderItem }) {
  const [open, setOpen] = useState(false);

  if (!items || items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.header} onPress={() => setOpen((o) => !o)}>
        <View style={styles.headerLeft}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text style={styles.title}>
            {title} ({items.length})
          </Text>
        </View>
        <Text style={styles.chevron}>{open ? '−' : '+'}</Text>
      </Pressable>

      {open && <View style={styles.body}>{items.map(renderItem)}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  title: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.ink,
  },
  chevron: {
    fontFamily: fonts.sansMedium,
    fontSize: 18,
    color: colors.inkMuted,
  },
  body: {
    paddingTop: spacing.sm,
  },
});
