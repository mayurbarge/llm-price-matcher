import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme';

export default function StatusMessage({ indicator, title, body, children }) {
  return (
    <View style={styles.container}>
      {indicator}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl * 2,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
