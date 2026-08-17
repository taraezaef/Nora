import Toast from 'react-native-root-toast';
export function showToast(msg) {
    Toast.show(msg, {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
        shadow: true,
        animation: true,
        hideOnPress: true,
        delay: 0,
    });
}
