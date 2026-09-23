import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme';
import { SORT_OPTIONS } from '../constants';

export default function SortSelector({ selectedSortKey, onSortKeyChange }) {
  return (
    <View style={styles.row}>
      {SORT_OPTIONS.map((sortOption) => {
        const isSelected = sortOption.key === selectedSortKey;
        return (
          <Pressable
            key={sortOption.key}
            onPress={() => onSortKeyChange(sortOption.key)}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{sortOption.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.inkMuted,
  },
  chipTextSelected: {
    color: colors.surface,
  },
});
