import BoxingGlovesIcon from "@/assets/images/boxing-glove.svg";
import { ChartNoAxesColumn, LayoutDashboard, User } from "lucide-react-native";
import React from "react";

export const iconPicker = {
	index: (props: any) => (
		<LayoutDashboard size={26} color={props.color} strokeWidth={2} />
	),
	training: (props: any) => (
		<BoxingGlovesIcon
			height={26}
			width={26}
			color={props.color}
			strokeWidth={4}
		/>
	),
	analytics: (props: any) => (
		<ChartNoAxesColumn size={26} color={props.color} strokeWidth={2} />
	),
	profile: (props: any) => (
		<User size={26} color={props.color} strokeWidth={2} />
	),
};
