import { NativeModule, requireNativeModule } from 'expo';

import { YoloPoseModuleEvents } from './YoloPose.types';

declare class YoloPoseModule extends NativeModule<YoloPoseModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<YoloPoseModule>('YoloPose');
