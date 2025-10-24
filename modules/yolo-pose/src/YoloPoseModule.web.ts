import { registerWebModule, NativeModule } from 'expo';

import { YoloPoseModuleEvents } from './YoloPose.types';

class YoloPoseModule extends NativeModule<YoloPoseModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(YoloPoseModule, 'YoloPoseModule');
