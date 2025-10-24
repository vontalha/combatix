import { useAutoHideTabBar } from "@/hooks/useAutoHideTabBar";
import React, { useState } from "react";
import { StyleSheet, Text, View } from 'react-native';
import { YoloPoseView } from 'yolo-pose';
console.log('YoloPoseView:', YoloPoseView); 

export default function Training() {
	const { scrollHandler } = useAutoHideTabBar();
	const [keypoints, setKeypoints] = useState<any[]>([]);

	return (
		<View style={styles.container}>
			{/* YOLO Camera View - Zeigt Camera + Detection */}
			<YoloPoseView
  style={styles.camera}
  onResult={(result) => {
    console.log('🎯 Detected', result.nativeEvent.poses.length, 'people');
    result.nativeEvent.poses.forEach((pose, i) => {
      console.log(`Person ${i}:`, pose.confidence);
      console.log(`  Keypoints:`, pose.keypoints.length);
    });
  }}
>
				<View style={styles.overlay}>
					<Text style={styles.title}>TRAINING</Text>
					<Text style={styles.statusText}>
						Detected: {keypoints.length} keypoints
					</Text>
					{keypoints.length > 0 && (
						<View style={styles.keypointsContainer}>
							<Text style={styles.keypointText}>
								First keypoint: x={keypoints[0].x.toFixed(2)}, y={keypoints[0].y.toFixed(2)}
							</Text>
						</View>
					)}
				</View>
			</YoloPoseView>

			{/* Rest unten drunter wenn du willst */}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#171717",
	},
	camera: {
		flex: 1,
	},
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
		padding: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: {
		fontFamily: "BebasNeue-Regular",
		fontSize: 36,
		color: "#DA0037",
		letterSpacing: 2,
		marginBottom: 20,
	},
	statusText: {
		fontFamily: "Inter-Bold",
		fontSize: 18,
		color: "#FFF",
		marginBottom: 10,
	},
	keypointsContainer: {
		backgroundColor: 'rgba(218, 0, 55, 0.8)',
		padding: 15,
		borderRadius: 10,
	},
	keypointText: {
		fontFamily: "Inter-Regular",
		fontSize: 14,
		color: "#FFF",
	},
});