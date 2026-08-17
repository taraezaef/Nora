import { requireNativeView } from 'expo';
import * as React from 'react';
import { cssInterop } from 'nativewind';
const NativeView = requireNativeView('NoraView');
cssInterop(NativeView, {
    className: 'style',
});
export default function NoraView(props) {
    return <NativeView {...props}/>;
}
