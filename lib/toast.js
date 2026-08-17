import { toast } from 'react-hot-toast';
export function showToast(msg) {
    toast(msg, {
        icon: '🐈‍⬛',
    });
}
