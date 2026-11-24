import React from 'react';
import { ScrollView, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { selectChild } from '../store/childSlice';
import Chip from './Chip';

export default function ChildPicker() {
  const dispatch = useDispatch();
  const { children, selectedChildId } = useSelector((s: RootState) => s.children);
  if (children.length < 2) return null;
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {children.map(ch => <Chip key={ch.id} label={ch.full_name.split(' ')[0]} selected={ch.id === selectedChildId} onPress={() => dispatch(selectChild(ch.id))} />)}
      </ScrollView>
    </View>
  );
}
