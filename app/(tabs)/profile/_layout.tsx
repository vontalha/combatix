import { Stack } from 'expo-router';
export default function ProfileStack() {
  return (
    <Stack screenOptions={{ headerShown: false, title: 'Profile' }}>
      <Stack.Screen name="index"/>
    </Stack>
  );
}
