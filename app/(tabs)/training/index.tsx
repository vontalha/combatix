import { useAutoHideTabBar } from "@/hooks/useAutoHideTabBar";
import React, { useState } from "react";
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { YoloPoseView } from 'yolo-pose';
import { Canvas, Circle, Line, Rect, Group } from '@shopify/react-native-skia';
import { SKELETON_CONNECTIONS, type Pose } from '@/constants/pose';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Training() {
	useAutoHideTabBar();
	const [poses, setPoses] = useState<Pose[]>([]);

	return (
		<View style={styles.container}>
			{/* Camera View */}
			<YoloPoseView
				style={styles.camera}
				onResult={(result) => {
					setPoses(result.nativeEvent.poses);
				}}
			/>
			
			{/* Skeleton Overlay Canvas */}
			<Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
				{poses.map((pose, poseIndex) => (
					<Group key={poseIndex}>
						{/* Bounding Box */}
						<Rect
							x={pose.bbox.x}
							y={pose.bbox.y}
							width={pose.bbox.width}
							height={pose.bbox.height}
							color="rgba(218, 0, 55, 0.6)"
							style="stroke"
							strokeWidth={3}
						/>
						
						{/* Skeleton Lines */}
						{SKELETON_CONNECTIONS.map(([startIdx, endIdx], lineIndex) => {
							const start = pose.keypoints[startIdx];
							const end = pose.keypoints[endIdx];
							
							// Only draw if both keypoints are confident
							if (start && end && start.confidence > 0.5 && end.confidence > 0.5) {
								return (
									<Line
										key={`${poseIndex}-line-${lineIndex}`}
										p1={{ x: start.x, y: start.y }}
										p2={{ x: end.x, y: end.y }}
										color="rgba(0, 255, 100, 0.9)"
										strokeWidth={4}
									/>
								);
							}
							return null;
						})}
						
						{/* Keypoint Dots */}
						{pose.keypoints.map((kp, kpIndex) => {
							if (kp && kp.confidence > 0.5) {
								return (
									<Circle
										key={`${poseIndex}-kp-${kpIndex}`}
										cx={kp.x}
										cy={kp.y}
										r={8}
										color="rgba(255, 50, 50, 0.95)"
									/>
								);
							}
							return null;
						})}
					</Group>
				))}
			</Canvas>
			
			{/* Info Overlay */}
			<View style={styles.overlay}>
				<View style={styles.infoBox}>
					<Text style={styles.title}>POSE DETECTION</Text>
					<Text style={styles.count}>
						👤 {poses.length} {poses.length === 1 ? 'Person' : 'People'}
					</Text>
					{poses.length > 0 && (
						<View style={styles.details}>
							<Text style={styles.detailText}>
								Avg Confidence: {(poses.reduce((sum, p) => sum + p.confidence, 0) / poses.length * 100).toFixed(1)}%
							</Text>
							<Text style={styles.detailText}>
								Keypoints: {poses[0].keypoints.filter(kp => kp.confidence > 0.5).length}/17
							</Text>
						</View>
					)}
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#000",
	},
	camera: {
		flex: 1,
	},
	overlay: {
		position: 'absolute',
		top: 60,
		left: 20,
		right: 20,
	},
	infoBox: {
		backgroundColor: 'rgba(0, 0, 0, 0.75)',
		padding: 20,
		borderRadius: 15,
		borderLeftWidth: 4,
		borderLeftColor: '#DA0037',
	},
	title: {
		fontFamily: "BebasNeue-Regular",
		fontSize: 24,
		color: "#DA0037",
		letterSpacing: 2,
		marginBottom: 10,
	},
	count: {
		fontFamily: "Inter-Bold",
		fontSize: 32,
		color: "#FFF",
		marginBottom: 10,
	},
	details: {
		marginTop: 10,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255, 255, 255, 0.2)',
	},
	detailText: {
		fontFamily: "Inter-Regular",
		fontSize: 14,
		color: "#EDEDED",
		marginBottom: 5,
	},
});
