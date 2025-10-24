import { requireNativeViewManager } from "expo-modules-core";
import * as React from "react";
import { ViewProps } from "react-native";

export type OnResultEvent = {
  poses: Array<{
    bbox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    confidence: number;
    keypoints: Array<{
      x: number;
      y: number;
      confidence: number;
    }>;
  }>;
};

export type YoloPoseViewProps = {
  onResult?: (event: { nativeEvent: OnResultEvent }) => void;
} & ViewProps;

const NativeView: React.ComponentType<YoloPoseViewProps> =
  requireNativeViewManager("YoloPose");

export default function YoloPoseView(props: YoloPoseViewProps) {
  return <NativeView {...props} />;
}
