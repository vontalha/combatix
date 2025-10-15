import { LayoutDashboard } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Analytics() {
	return (
		<View style={styles.container}>
			<Text style={styles.text}>Before Icon</Text>
			<LayoutDashboard size={100} color="red" strokeWidth={3} />
			<Text style={styles.text}>After Icon</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#171717",
		justifyContent: "center",
		alignItems: "center",
		gap: 20,
	},
	text: {
		color: "white",
		fontSize: 20,
	},
});
