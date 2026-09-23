import { useCallback, useState } from 'react';
import { fetchComparison } from '../api';

export const SearchStatus = {
  IDLE: 'idle',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
};

export function useComparisonSearch() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(SearchStatus.IDLE);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const search = useCallback(
    async (searchTermOverride) => {
      const searchTerm = (searchTermOverride ?? query).trim();
      if (!searchTerm) return;

      setQuery(searchTerm);
      setStatus(SearchStatus.LOADING);
      setErrorMessage('');

      try {
        const result = await fetchComparison(searchTerm);
        setComparisonResult(result);
        setStatus(SearchStatus.SUCCESS);
      } catch (error) {
        setErrorMessage(error.message || 'Something went wrong');
        setStatus(SearchStatus.ERROR);
      }
    },
    [query]
  );

  return { query, setQuery, status, comparisonResult, errorMessage, search };
}
