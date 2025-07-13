import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import TripDetailMinimal from '../trip-detail-minimal';

export default function TripDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  return <TripDetailMinimal tripId={id} />;
} 