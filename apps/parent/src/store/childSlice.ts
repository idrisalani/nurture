import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Child {
  id: string; full_name: string; avatar_emoji?: string | null; date_of_birth?: string | null;
  today_mins_used?: number; weekday_limit_mins?: number;
  last_lat?: number | null; last_lng?: number | null; last_seen?: string | null;
}
interface ChildState { children: Child[]; selectedChildId: string | null; loaded: boolean; }
const childSlice = createSlice({
  name: 'children',
  initialState: { children: [], selectedChildId: null, loaded: false } as ChildState,
  reducers: {
    setChildren: (state, a: PayloadAction<Child[]>) => {
      state.children = a.payload; state.loaded = true;
      if (!a.payload.find(c => c.id === state.selectedChildId)) state.selectedChildId = a.payload[0]?.id ?? null;
    },
    selectChild: (state, a: PayloadAction<string>) => { state.selectedChildId = a.payload; },
    patchChild: (state, a: PayloadAction<Partial<Child> & { id: string }>) => {
      const i = state.children.findIndex(c => c.id === a.payload.id);
      if (i >= 0) state.children[i] = { ...state.children[i], ...a.payload };
    },
  },
});
export const { setChildren, selectChild, patchChild } = childSlice.actions;
export default childSlice.reducer;
