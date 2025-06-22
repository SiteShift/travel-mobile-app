import React from 'react';
import EntryEditorScreen from '../src/screens/EntryEditorScreen';

export default function EntryEditorRoute() {
  // Pass mock tripId for now - in real app would come from route params
  return <EntryEditorScreen tripId="mock-trip-id" />;
} 