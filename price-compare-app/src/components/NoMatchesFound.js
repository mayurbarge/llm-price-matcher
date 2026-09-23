import StatusMessage from './StatusMessage';

export default function NoMatchesFound() {
  return <StatusMessage title="No matching products found" body="Try a different or more general search term." />;
}
