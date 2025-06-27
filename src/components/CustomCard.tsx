// src/components/CustomCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevation?: 'low' | 'medium' | 'high';
  padding?: 'small' | 'medium' | 'large';
  borderRadius?: 'small' | 'medium' | 'large';
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  rightElement?: React.ReactNode;
}

interface CardContentProps {
  children: React.ReactNode;
}

interface CardActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'space-between';
}

const CustomCard: React.FC<CustomCardProps> & {
  Header: React.FC<CardHeaderProps>;
  Content: React.FC<CardContentProps>;
  Actions: React.FC<CardActionsProps>;
} = ({ 
  children, 
  style, 
  onPress, 
  elevation = 'medium',
  padding = 'medium',
  borderRadius = 'medium'
}) => {
  const cardStyle = [
    styles.card,
    styles[`elevation_${elevation}`],
    styles[`padding_${padding}`],
    styles[`radius_${borderRadius}`],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const CardHeader: React.FC<CardHeaderProps> = ({ 
  title, 
  subtitle, 
  icon, 
  iconColor = '#007bff', 
  rightElement 
}) => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      {icon && (
        <Ionicons 
          name={icon} 
          size={24} 
          color={iconColor} 
          style={styles.headerIcon} 
        />
      )}
      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    {rightElement && <View style={styles.headerRight}>{rightElement}</View>}
  </View>
);

const CardContent: React.FC<CardContentProps> = ({ children }) => (
  <View style={styles.content}>{children}</View>
);

const CardActions: React.FC<CardActionsProps> = ({ children, align = 'right' }) => (
  <View style={[styles.actions, styles[`actions_${align}`]]}>{children}</View>
);

// Attach sub-components
CustomCard.Header = CardHeader;
CustomCard.Content = CardContent;
CustomCard.Actions = CardActions;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginVertical: 6,
    marginHorizontal: 4,
  },
  // Elevation styles
  elevation_low: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  elevation_medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  elevation_high: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  // Padding styles
  padding_small: {
    padding: 12,
  },
  padding_medium: {
    padding: 16,
  },
  padding_large: {
    padding: 20,
  },
  // Border radius styles
  radius_small: {
    borderRadius: 4,
  },
  radius_medium: {
    borderRadius: 8,
  },
  radius_large: {
    borderRadius: 12,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    marginLeft: 12,
  },
  // Content styles
  content: {
    // Default content styling can be added here
  },
  // Actions styles
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actions_left: {
    justifyContent: 'flex-start',
  },
  actions_center: {
    justifyContent: 'center',
  },
  actions_right: {
    justifyContent: 'flex-end',
  },
  actions_space_between: {
    justifyContent: 'space-between',
  },
});

export default CustomCard;
