import * as React from 'react';

import { YoloPoseViewProps } from './YoloPose.types';

export default function YoloPoseView(props: YoloPoseViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
