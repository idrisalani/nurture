import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
export function useSelectedChild() {
  return useSelector((s: RootState) => s.children.children.find(c => c.id === s.children.selectedChildId) || null);
}
