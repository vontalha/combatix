import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { StyleSheet, View } from "react-native";
import TabBarButton from "./TabBarButton";

export function MyTabBar({
	state,
	descriptors,
	navigation,
}: BottomTabBarProps) {


	return (
		<View style={styles.tabbar}>
			{state.routes.map((route, index) => {
				const { options } = descriptors[route.key];
				const label =
					options.tabBarLabel !== undefined
						? options.tabBarLabel
						: options.title !== undefined
						? options.title
						: route.name;

				const isFocused = state.index === index;

				const onPress = () => {
					const event = navigation.emit({
						type: "tabPress",
						target: route.key,
						canPreventDefault: true,
					});

					if (!isFocused && !event.defaultPrevented) {
						navigation.navigate(route.name, route.params);
					}
				};

				const onLongPress = () => {
					navigation.emit({
						type: "tabLongPress",
						target: route.key,
					});
				};

				return (
					<TabBarButton
						key={route.name}
						onPress={onPress}
						onLongPress={onLongPress}
						isFocused={isFocused}
						routeName={route.name}
                        color={isFocused ? "#DA0037" : "#EDEDED"}
                        label={label}
					/>
					// <PlatformPressable
					// 	key={route.name}
					// 	onPress={onPress}
					// 	onLongPress={onLongPress}
					// 	style={styles.tabBarItem}
					// >
					// 	{iconPicker[route.name]({
					// 		color: isFocused ? "#DA0037" : "#EDEDED",
					// 	})}
					// 	<Text
					// 		style={{
					// 			color: isFocused ? "red" : colors.text,
					// 			fontSize: 13,
					// 		}}
					// 	>
					// 		{label}
					// 	</Text>
					// </PlatformPressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	tabbar: {
		position: "absolute",
		flexDirection: "row",
		bottom: 40,
		alignItems: "center",
		justifyContent: "space-between",
		marginHorizontal: 28,
		backgroundColor: "white",
		padding: 13,
		borderRadius: 28,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowRadius: 10,
		shadowOpacity: 0.1,
	},
});
