import React from 'react';
import MapView, { Circle, Marker } from 'react-native-maps';

export interface Place { id: string; name: string; latitude: number; longitude: number; radius_metres?: number }
export default function ChildMap({ latitude, longitude, label, places = [] }: { latitude: number; longitude: number; label: string; places?: Place[] }) {
  return (
    <MapView style={{ height: 240, borderRadius: 18 }} region={{ latitude, longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 }} accessibilityLabel={label}>
      <Marker coordinate={{ latitude, longitude }} title={label} />
      {places.map(p => <Circle key={p.id} center={{ latitude: Number(p.latitude), longitude: Number(p.longitude) }} radius={Number(p.radius_metres) || 150} strokeColor="#212E86" fillColor="rgba(33,46,134,0.12)" />)}
    </MapView>
  );
}
