import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text, Button, useTheme} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  buttonText?: string;
  onButtonPress?: () => void;
  additionalContent?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  buttonText,
  onButtonPress,
  additionalContent,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Icon
        name={icon}
        size={80}
        color={theme.colors.primary}
        style={styles.icon}
      />

      <Text style={[styles.title, {color: theme.colors.onSurface}]}>
        {title}
      </Text>

      <Text
        style={[styles.description, {color: theme.colors.onSurfaceVariant}]}>
        {description}
      </Text>

      {buttonText && onButtonPress && (
        <Button
          mode="contained"
          onPress={onButtonPress}
          style={styles.button}
          icon="plus">
          {buttonText}
        </Button>
      )}

      {additionalContent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 16,
  },
});

export default EmptyState;
