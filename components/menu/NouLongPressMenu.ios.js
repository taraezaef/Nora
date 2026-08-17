import { MenuView } from '@expo/ui/community/menu';
export const NouLongPressMenu = ({ children, items }) => {
    const actionableItems = items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.kind !== 'separator' && item.kind !== 'label');
    const actions = actionableItems.map(({ item, index }) => ({
        id: String(index),
        title: item.label,
        attributes: item.disabled ? { disabled: true } : undefined,
    }));
    return (<MenuView actions={actions} shouldOpenOnLongPress onPressAction={({ nativeEvent }) => {
            const entry = actionableItems.find(({ index }) => String(index) === nativeEvent.event);
            entry?.item.handler();
        }}>
      {children}
    </MenuView>);
};
