import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme';
import { EXAMPLE_SEARCH_QUERIES } from '../constants';
import StatusMessage from './StatusMessage';

export default function IdleState({ onExampleSelected }) {
  return (
    <StatusMessage
      title="Compare Blinkit vs Zepto prices"
      body="Search for a product to see a live price comparison."
    >
      <View style={styles.exampleRow}>
        {EXAMPLE_SEARCH_QUERIES.map((exampleQuery) => (
          <Pressable key={exampleQuery} style={styles.exampleChip} onPress={() => onExampleSelected(exampleQuery)}>
            <Text style={styles.exampleChipText}>{exampleQuery}</Text>
          </Pressable>
        ))}
      </View>
    </StatusMessage>
  );
}

const styles = StyleSheet.create({
  exampleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  exampleChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  exampleChipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.ink,
  },
});
