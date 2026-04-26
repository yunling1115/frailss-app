//UI - Firebase = fetch login data from firebase
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import { app } from '../config/firebaseConfig'; // 你要有这个 firebase 初始化文件

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const db = getFirestore(app);

  //Fetch user info from firebase firestore 
  const handleLogin = async () => {
    setMessage('Logging in...');
    try {
      const q = query(collection(db, 'residents'), where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setMessage('❌ User not found');
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Use bcrypt to compare hashed password
      const passwordMatch = await bcrypt.compare(password, userData.password);
      
      if (passwordMatch) {
        setMessage(`✅ Login successful! Floor: ${userData.resident_level}`);
        // Login successful, navigate to Dashboard with user data
        navigation.navigate('Dashboard', {
          username: userData.username,
          floor: userData.resident_level,
        });
      } else {
        setMessage('❌ Incorrect password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('❌ Login failed due to error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>FRAILSS</Text>
      <Text style={styles.title}>Login Page</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>New User? Register</Text>
      </TouchableOpacity>
      {message ? <Text style={{ marginTop: 10 }}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  title: { fontSize: 18, marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: '#ccc', width: '80%', padding: 10,
    marginVertical: 10, borderRadius: 5
  },
  button: {
    backgroundColor: '#ccc', padding: 10, borderRadius: 5,
    width: '80%', alignItems: 'center', marginVertical: 10
  },
  buttonText: { fontSize: 16, fontWeight: 'bold' },
  link: { color: '#007AFF', marginTop: 10 },
});