import { View } from 'react-native';
export function useHeaderAnimation({ autoHideHeader, headerHeight, headerShown, hideToolbarWhenScrolled, }) {
    return {
        Root: View,
        style: {
            marginTop: (autoHideHeader || hideToolbarWhenScrolled) && !headerShown ? -headerHeight : 0,
        },
    };
}
