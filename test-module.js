import { NativeModules } from 'react-native';

console.log('All Native Modules:', Object.keys(NativeModules));
console.log('YoloPose exists?', 'YoloPose' in NativeModules);
