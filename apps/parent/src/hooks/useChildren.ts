import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import api from '../services/axios.client';
import { setChildren } from '../store/childSlice';

export function useRefreshChildren() {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { const r = await api.get('/children'); dispatch(setChildren(r.data)); } catch { /* keep what we have */ }
    setRefreshing(false);
  }, [dispatch]);
  return { refresh, refreshing };
}
