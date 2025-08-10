import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import TripBookScreen from '../../src/screens/TripBookScreen';

export default function TripDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  return <TripBookScreen tripId={id} />;
} 