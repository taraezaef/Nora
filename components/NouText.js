import { Text } from 'react-native';
import { clsx } from '@/lib/utils';
export const NouText = ({ className, ...rest }) => (<Text className={clsx('text-zinc-900 dark:text-gray-100', className)} {...rest}/>);
