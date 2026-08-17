import { colors } from '@/lib/colors';
import AntDesign from '@react-native-vector-icons/ant-design';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { Pressable, useColorScheme } from 'react-native';
const buttonStyle = { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' };
export const AntButton = ({ color, name, size = 24, style, ...props }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme !== 'light';
    return (<Pressable {...props} style={(state) => [buttonStyle, typeof style === 'function' ? style(state) : style]}>
      <AntDesign name={name} size={size} color={color ?? (isDark ? colors.icon : colors.iconLightStrong)}/>
    </Pressable>);
};
export const MaterialButton = ({ color, name, size = 24, style, ...props }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme !== 'light';
    return (<Pressable {...props} style={(state) => [buttonStyle, typeof style === 'function' ? style(state) : style]}>
      <MaterialIcons name={name} size={size} color={color ?? (isDark ? colors.icon : colors.iconLightStrong)}/>
    </Pressable>);
};
export const MaterialCommunityButton = ({ color, name, size = 24, style, ...props }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme !== 'light';
    return (<Pressable {...props} style={(state) => [buttonStyle, typeof style === 'function' ? style(state) : style]}>
      <MaterialCommunityIcons name={name} size={size} color={color ?? (isDark ? colors.icon : colors.iconLightStrong)}/>
    </Pressable>);
};
