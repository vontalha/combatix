import { useAutoHideTabBar } from "@/hooks/useAutoHideTabBar";
import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";

export default function DashboardScreen() {
	const { scrollHandler } = useAutoHideTabBar();

	return (
		<Animated.ScrollView
			onScroll={scrollHandler}
			scrollEventThrottle={16}
			style={styles.container}
			contentContainerStyle={styles.content}
		>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.title}>COMBATIX</Text>
				<Text style={styles.subtitle}>Your Combat Training Hub</Text>
			</View>

			{/* Stats Grid */}
			<View style={styles.statsGrid}>
				<View style={styles.statCard}>
					<Text style={styles.statValue}>24</Text>
					<Text style={styles.statLabel}>Sessions</Text>
				</View>
				<View style={styles.statCard}>
					<Text style={styles.statValue}>1,247</Text>
					<Text style={styles.statLabel}>Punches</Text>
				</View>
				<View style={styles.statCard}>
					<Text style={styles.statValue}>87%</Text>
					<Text style={styles.statLabel}>Quality</Text>
				</View>
				<View style={styles.statCard}>
					<Text style={styles.statValue}>12</Text>
					<Text style={styles.statLabel}>Streak</Text>
				</View>
			</View>

			{/* Recent Sessions */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>RECENT SESSIONS</Text>

				{[1, 2, 3, 4, 5, 6].map((item) => (
					<View key={item} style={styles.sessionCard}>
						<View style={styles.sessionHeader}>
							<Text style={styles.sessionType}>
								Shadow Boxing
							</Text>
							<Text style={styles.sessionTime}>
								{item} hours ago
							</Text>
						</View>
						<View style={styles.sessionStats}>
							<View>
								<Text style={styles.sessionValue}>156</Text>
								<Text style={styles.sessionLabel}>Punches</Text>
							</View>
							<View>
								<Text style={styles.sessionValue}>92</Text>
								<Text style={styles.sessionLabel}>Quality</Text>
							</View>
							<View>
								<Text style={styles.sessionValue}>18</Text>
								<Text style={styles.sessionLabel}>Minutes</Text>
							</View>
						</View>
					</View>
				))}
			</View>

			{/* Extra Padding für Tab Bar */}
			<View style={{ height: 100 }} />
		</Animated.ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#171717",
	},
	content: {
		padding: 20,
	},
	header: {
		marginBottom: 30,
		marginTop: 20,
	},
	title: {
		fontFamily: "BebasNeue-Regular",
		fontSize: 48,
		letterSpacing: 2,
		color: "#DA0037",
	},
	subtitle: {
		fontFamily: "Inter_400Regular",
		fontSize: 14,
		color: "#888",
	},
	statsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 15,
		marginBottom: 30,
	},
	statCard: {
		flex: 1,
		minWidth: "45%",
		backgroundColor: "#2A2A2A",
		padding: 20,
		borderRadius: 15,
		alignItems: "center",
	},
	statValue: {
		fontFamily: "BebasNeue_400Regular",
		fontSize: 36,
		color: "#DA0037",
		letterSpacing: 1,
	},
	statLabel: {
		fontFamily: "Inter_500Medium",
		fontSize: 12,
		color: "#888",
		textTransform: "uppercase",
		marginTop: 5,
	},
	section: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontFamily: "BebasNeue-Regular",
		fontSize: 24,
		color: "#EDEDED",
		letterSpacing: 1,
		marginBottom: 15,
	},
	sessionCard: {
		backgroundColor: "#2A2A2A",
		padding: 20,
		borderRadius: 15,
		marginBottom: 15,
	},
	sessionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 15,
	},
	sessionType: {
		fontFamily: "Inter_700Bold",
		fontSize: 16,
		color: "#EDEDED",
	},
	sessionTime: {
		fontFamily: "Inter_400Regular",
		fontSize: 12,
		color: "#888",
	},
	sessionStats: {
		flexDirection: "row",
		justifyContent: "space-around",
	},
	sessionValue: {
		fontFamily: "BebasNeue_400Regular",
		fontSize: 28,
		color: "#DA0037",
		textAlign: "center",
	},
	sessionLabel: {
		fontFamily: "Inter_500Medium",
		fontSize: 11,
		color: "#666",
		textAlign: "center",
	},
});
