//UI - Node.js - Raspi - Actuator
//Updated Dashboard with server communication for lift control
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const RASPI_IP = "172.20.10.2";
const RASPI_PORT = "3000";

export default function DashboardScreen({ navigation, route }) {
  // Get the parameters passed from Login screen
  const { username: loginUsername, floor } = route.params || {};
  
  // Use dynamic data from login, with fallbacks
  const [username] = useState(loginUsername || 'Guest');
  const [residentLevel] = useState(floor?.toString() || '2');
  const [isLoading, setIsLoading] = useState(false);

  const handleFloorSelect = async (selectedFloor) => {
    console.log(`Selected floor: ${selectedFloor}`);
    setIsLoading(true);
    
    try {
      // Send floor selection command to Raspberry Pi
      const response = await fetch(`http://${RASPI_IP}:${RASPI_PORT}/api/lift-control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          action: 'floor_select',
          floor: selectedFloor,
          username: username,
          timestamp: Date.now()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Lift control response:', result);
        
        Alert.alert(
          'Floor Selected',
          `Moving to floor ${selectedFloor}...\n\nPlease wait for the lift to arrive and open the door.`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending floor selection:', error);
      
      let errorMessage = 'Failed to communicate with lift system.';
      
      if (error.message.includes('Network request failed')) {
        errorMessage = `Cannot connect to lift system.\n\nPlease check:\n• Raspberry Pi is running (${RASPI_IP})\n• Server is started on port ${RASPI_PORT}\n• WiFi connection is stable`;
      }
      
      Alert.alert(
        'Connection Error',
        errorMessage,
        [
          {
            text: 'Retry',
            onPress: () => handleFloorSelect(selectedFloor)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    navigation.navigate('Login');
  };

  // Check if user can access a specific floor
  const canAccessFloor = (targetFloor) => {
    const userLevel = parseInt(residentLevel);
    const target = parseInt(targetFloor);
    
    // Ground floor and Level 1 are accessible to everyone
    if (target <= 1) return true;
    
    // For levels 2 and above, user can only access their own level and below
    return target <= userLevel;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>FRAILSS</Text>
      <Text style={styles.title}>User Dashboard</Text>
      
      <View style={styles.userInfo}>
        <Text style={styles.infoLabel}>Username</Text>
        <Text style={styles.infoText}>{username}</Text>
        <Text style={styles.infoLabel}>Resident Level</Text>
        <Text style={styles.infoText}>{residentLevel}</Text>
      </View>
      
      <Text style={styles.sectionTitle}>Select Floor</Text>
      
      <View style={styles.floorButtons}>
        {/* Ground Floor - Always accessible */}
        <TouchableOpacity 
          style={[
            styles.floorButton,
            isLoading && styles.disabled
          ]} 
          onPress={() => handleFloorSelect('G')}
          disabled={isLoading}
        >
          <Text style={[
            styles.floorButtonText,
            isLoading && styles.disabledText
          ]}>
            Ground Floor
          </Text>
          <Text style={[
            styles.floorSubText,
            isLoading && styles.disabledText
          ]}>
            Public Access
          </Text>
        </TouchableOpacity>
        
        {/* Level 1 - Always accessible */}
        <TouchableOpacity 
          style={[
            styles.floorButton,
            isLoading && styles.disabled
          ]} 
          onPress={() => handleFloorSelect('1')}
          disabled={isLoading}
        >
          <Text style={[
            styles.floorButtonText,
            isLoading && styles.disabledText
          ]}>
            Level 1
          </Text>
          <Text style={[
            styles.floorSubText,
            isLoading && styles.disabledText
          ]}>
            Common Area
          </Text>
        </TouchableOpacity>
        
        {/* Level 2 */}
        <TouchableOpacity
          style={[
            styles.floorButton, 
            (!canAccessFloor('2') || isLoading) && styles.disabled
          ]}
          onPress={() => canAccessFloor('2') && !isLoading && handleFloorSelect('2')}
          disabled={!canAccessFloor('2') || isLoading}
        >
          <Text style={[
            styles.floorButtonText,
            (!canAccessFloor('2') || isLoading) && styles.disabledText
          ]}>
            Level 2
          </Text>
          <Text style={[
            styles.floorSubText,
            (!canAccessFloor('2') || isLoading) && styles.disabledText
          ]}>
            {canAccessFloor('2') ? 'Resident Access' : 'Access Denied'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.accessInfo}>
        <Text style={styles.accessInfoText}>
          {isLoading 
            ? '⏳ Sending command to lift system...'
            : `💡 You have access to Level ${residentLevel} and below`
          }
        </Text>
      </View>
      
      <View style={styles.connectionStatus}>
        <Text style={styles.connectionText}>
          🌐 Connected to: {RASPI_IP}:{RASPI_PORT}
        </Text>
      </View>
      
      <TouchableOpacity 
        onPress={handleLogout} 
        style={[styles.logout, isLoading && styles.disabled]}
        disabled={isLoading}
      >
        <Text style={styles.link}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  header: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 10,
    color: '#2196F3'
  },
  title: { 
    fontSize: 18, 
    marginBottom: 20,
    color: '#333'
  },
  userInfo: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    backgroundColor: '#fff',
    padding: 15, 
    borderRadius: 8, 
    width: '90%', 
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 2
  },
  infoText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 5,
    color: '#333'
  },
  sectionTitle: { 
    fontSize: 18, 
    marginBottom: 15,
    fontWeight: '600',
    color: '#333'
  },
  floorButtons: { 
    width: '90%',
    marginBottom: 20
  },
  floorButton: { 
    backgroundColor: '#2196F3', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginVertical: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  floorButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  floorSubText: {
    fontSize: 12,
    marginTop: 2,
    color: '#e3f2fd'
  },
  disabled: { 
    backgroundColor: '#f0f0f0', 
    opacity: 0.6 
  },
  disabledText: {
    color: '#999'
  },
  accessInfo: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    width: '90%'
  },
  accessInfoText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center'
  },
  connectionStatus: {
    backgroundColor: '#f1f8e9',
    padding: 8,
    borderRadius: 6,
    marginBottom: 15,
    width: '90%'
  },
  connectionText: {
    fontSize: 12,
    color: '#388e3c',
    textAlign: 'center',
    fontFamily: 'monospace'
  },
  logout: { 
    marginTop: 10,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF'
  },
  link: { 
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600'
  },
});