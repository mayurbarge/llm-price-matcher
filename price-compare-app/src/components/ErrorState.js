import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';
import StatusMessage from './StatusMessage';

export default function ErrorState({ message, onRetry }) {
  return (
    <StatusMessage title="Couldn't fetch prices" body={message}>
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Try again</Text>
      </Pressable>
    </StatusMessage>
  );
}

const styles = StyleSheet.create({
  retryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.surface,
  },
});
