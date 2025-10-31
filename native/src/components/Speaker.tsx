import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStore } from '../store/useStore';
import Light from './Light';

const Speaker: React.FC = () => {
  const { isRecording } = useStore();

  return (
    <View style={styles.container}>
      {/* LD-7 Label */}
      <Text style={styles.label}>LD-7</Text>

      {/* Speaker Grille (visual representation) */}
      <View style={styles.grille}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.line} />
        ))}
      </View>

      {/* Recording Light */}
      <View style={styles.lightContainer}>
        <Light light="red" status={isRecording ? 'processing' : 'ready'} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 40,
    backgroundColor: '#D1D1D1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    fontWeight: '300',
    fontFamily: 'System',
  },
  grille: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 16,
    gap: 4,
  },
  line: {
    width: 2,
    height: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 1,
  },
  lightContainer: {
    marginLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Speaker;

