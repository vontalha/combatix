import { useTabBarStore } from "@/store/tabBarStore";
import { useEffect } from "react";
import { useSharedValue } from "react-native-reanimated";

export function useAutoHideTabBar() {
	const setVisible = useTabBarStore((state) => state.setVisible);
	const lastScrollY = useSharedValue(0);

	const scrollHandler = (event: any) => {
		"worklet";
		const currentScrollY = event.nativeEvent.contentOffset.y;
		const diff = currentScrollY - lastScrollY.value;

		if (diff > 5 && currentScrollY > 50) {
			setVisible(false);
		} else if (diff < -5) {
			setVisible(true);
		}

		lastScrollY.value = currentScrollY;
	};

	useEffect(() => {
		setVisible(true);
	}, []);

	return { scrollHandler };
}
