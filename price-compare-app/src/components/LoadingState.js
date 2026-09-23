import { ActivityIndicator } from 'react-native';
import { colors } from '../theme';
import StatusMessage from './StatusMessage';

export default function LoadingState({ query }) {
  return (
    <StatusMessage
      indicator={<ActivityIndicator color={colors.ink} />}
      body={`Checking Blinkit and Zepto for "${query}" — this can take up to a minute.`}
    />
  );
}
