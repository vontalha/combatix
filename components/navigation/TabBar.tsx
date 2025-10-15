import { useTabBarStore } from "@/store/tabBarStore";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { StyleSheet } from "react-native";
import Animated, {
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";
import TabBarButton from "./TabBarButton";

export function MyTabBar({
	state,
	descriptors,
	navigation,
}: BottomTabBarProps) {
	const isVisible = useTabBarStore((state) => state.isVisible);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{
					translateY: withTiming(isVisible ? 0 : 150, {
						duration: 300,
					}),
				},
			],
		};
	});

	return (
		<Animated.View style={[styles.tabbar, animatedStyle]}>
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
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	tabbar: {
		position: "absolute",
		flexDirection: "row",
		bottom: 30,
		alignItems: "center",
		justifyContent: "space-between",
		marginHorizontal: 40,
		backgroundColor: "#DA0037",
		padding: 11,
		borderRadius: 28,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowRadius: 10,
		shadowOpacity: 0.1,
	},
});
