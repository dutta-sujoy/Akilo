
import { View, Text, DimensionValue } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  label?: string;
  value?: string;
  showValue?: boolean;
}

export const ProgressBar = ({ progress, color = "#3b82f6", label, value, showValue = true }: ProgressBarProps) => {
  const widthPercent = (Math.min(Math.max(progress * 100, 0), 100) + '%') as DimensionValue;
  
  return (
    <View className="mb-4">
      <View className="flex-row justify-between mb-1">
        {label && <Text className="text-zinc-400 text-sm font-medium">{label}</Text>}
        {showValue && value && <Text className="text-white text-sm font-bold">{value}</Text>}
      </View>
      <View className="h-3 bg-zinc-800 rounded-full overflow-hidden">
        <View 
          style={{ width: widthPercent, backgroundColor: color }} 
          className="h-full rounded-full" 
        />
      </View>
    </View>
  );
};
