import { StyleSheet, Text, View } from 'react-native';
import { fonts, platformLabel, radius, spacing } from '../theme';

export default function PlatformErrorBanner({ platformErrors }) {
  if (!platformErrors) return null;

  const messages = Object.entries(platformErrors)
    .filter(([, message]) => Boolean(message))
    .map(([platformKey, message]) => `${platformLabel(platformKey)}: ${message}`);

  if (messages.length === 0) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{messages.join(' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FDECEC',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#F3B9B9',
    padding: spacing.sm,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs,
  },
  text: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: '#8A2C2C',
  },
});
