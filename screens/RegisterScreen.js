// screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    if (!username || !selectedFloor || !password) {
      alert('Please fill all fields');
      return;
    }
    
    navigation.navigate('CameraCapture', {
      username,
      floor: selectedFloor,
      password
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>FRAILSS</Text>
      <Text style={styles.title}>Register Page</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      
      {/* Floor Selection - Only Level 2 */}
      <View style={styles.floorContainer}>
        <Text style={styles.floorLabel}>Resident Level:</Text>
        <TouchableOpacity
          style={[
            styles.floorButton,
            selectedFloor === 2 && styles.floorButtonSelected
          ]}
          onPress={() => setSelectedFloor(2)}
        >
          <Text style={[
            styles.floorButtonText,
            selectedFloor === 2 && styles.floorButtonTextSelected
          ]}>
            Level 2
          </Text>
        </TouchableOpacity>
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Go To Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  title: { 
    fontSize: 18, 
    marginBottom: 20 
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    width: '80%',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5
  },
  floorContainer: {
    width: '80%',
    marginVertical: 10,
    alignItems: 'center'
  },
  floorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333'
  },
  floorButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ccc',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    minWidth: 120,
    alignItems: 'center'
  },
  floorButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3'
  },
  floorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666'
  },
  floorButtonTextSelected: {
    color: '#fff'
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    width: '80%',
    alignItems: 'center',
    marginVertical: 10
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  link: { 
    color: '#007AFF', 
    marginTop: 10 
  },
});