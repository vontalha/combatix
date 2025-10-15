import { Stack } from 'expo-router';
export default function AnalyticsStack() {
  return (
    <Stack screenOptions={{ headerShown: false, title: 'Profile' }}>
      <Stack.Screen name="index"/>
    </Stack>
  );
}
