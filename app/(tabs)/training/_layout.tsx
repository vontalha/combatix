import { Stack } from 'expo-router';
export default function TrainingStack() {
  return (
    <Stack screenOptions={{ headerShown: true, title: 'Training' }}>
      <Stack.Screen name="index" options={{ title: 'Overview' }} />
    </Stack>
  );
}
