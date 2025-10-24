import { View, Text, StyleSheet } from 'react-native';
import { YoloPoseView } from 'yolo-pose';
import { useState } from 'react';

export default function TestPose() {
  const [keypoints, setKeypoints] = useState<any[]>([]);

  return (
    <View style={styles.container}>
      <YoloPoseView
        style={styles.camera}
        onResult={(result) => {
          console.log('Pose detected:', result.nativeEvent.keypoints);
          setKeypoints(result.nativeEvent.keypoints);
        }}
      >
        <View style={styles.overlay}>
          <Text style={styles.text}>
            Detected: {keypoints.length} keypoints
          </Text>
        </View>
      </YoloPoseView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
