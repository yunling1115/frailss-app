//UI - Node.js - Rapi - Firestore
//只能手动引导give instruction用户拍照，无法实时人脸识别或引导转头（因为无法用 tfjs 模型在 Expo Go 上运行）。
//capture five face image with five angle using expo camera
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';

const instructions = ["Front", "Left", "Right", "Up", "Down"];
const RASPI_IP = "172.20.10.2"; // FIXED: Updated to correct IP that works
const RASPI_PORT = "3000"; // Node.js server port on Raspi

export default function CameraCaptureScreen({ navigation, route }) {
  const { username, floor, password } = route.params;
  const permissionResult = useCameraPermissions();
  const [capturedImages, setCapturedImages] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);
  const cameraRef = useRef(null);

  // Debug logging - FIXED: Better permission debugging
  useEffect(() => {
    console.log('📍 CameraCaptureScreen initialized');
    console.log('📝 Route params:', { username, floor, password: password ? '***' : 'undefined' });
    console.log('🌐 Raspberry Pi target:', `http://${RASPI_IP}:${RASPI_PORT}`);
    console.log('📱 Platform:', Platform.OS);
    console.log('🔐 Permission result:', permissionResult);
    console.log('🔐 Is array:', Array.isArray(permissionResult));
    console.log('🔐 Type:', typeof permissionResult);
  }, []);

  // Test server connectivity on component mount
  useEffect(() => {
    testServerConnection();
  }, []);

  // Camera ready timeout - FIXED: Reduced timeout and better error handling
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!cameraReady && permissionResult && Array.isArray(permissionResult) && permissionResult[0]?.granted && !cameraError) {
        setCameraError('Camera failed to initialize within 10 seconds');
      }
    }, 10000); // Reduced to 10 seconds like working code
    return () => clearTimeout(timeout);
  }, [cameraReady, permissionResult, cameraError]);

  // Test server connectivity
  const testServerConnection = async () => {
    try {
      console.log('🔗 Testing server connection...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('⏰ Server connection timeout after 10 seconds');
      }, 10000);

      const response = await fetch(`http://${RASPI_IP}:${RASPI_PORT}/api/test`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Server connection successful:', result);
        setServerConnected(true);
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Server connection failed:', error);
      setServerConnected(false);
      
      if (error.name === 'AbortError') {
        console.warn('⏰ Server connection timeout - server may not be running');
      }
      
      console.log('ℹ️ Will retry connection when uploading images');
    }
  };

  // Function to upload images to Raspberry Pi
  const uploadImagesToRaspi = async (imagePaths) => {
    setUploading(true);
    try {
      console.log('📤 Starting upload to Raspberry Pi...');
      console.log('🖼️ Image paths:', imagePaths);

      // Test server connectivity first if not already connected
      if (!serverConnected) {
        console.log('🔄 Retesting server connection before upload...');
        await testServerConnection();
        if (!serverConnected) {
          throw new Error(`Cannot connect to Raspberry Pi at ${RASPI_IP}:${RASPI_PORT}. Please check if the server is running and both devices are on the same network.`);
        }
      }

      const formData = new FormData();
      
      // Add user information
      formData.append('username', username);
      formData.append('password', password);
      formData.append('floor', floor.toString());
      formData.append('action', 'register');

      console.log('📝 Form data:', { username, password: '***', floor: floor.toString(), action: 'register' });

      // Add each image file
      for (let i = 0; i < imagePaths.length; i++) {
        const imageUri = imagePaths[i];
        const filename = `${username}_${instructions[i]}.jpg`;
        
        console.log(`📎 Adding image ${i + 1}: ${filename} from ${imageUri}`);

        // Verify file exists before adding to FormData
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists) {
          throw new Error(`Image file not found: ${filename}`);
        }

        console.log(`📏 Image ${i + 1} size: ${fileInfo.size} bytes`);

        // For React Native, FormData expects this format
        formData.append('images', {
          uri: imageUri,
          type: 'image/jpeg',
          name: filename,
        });
      }

      console.log('🚀 Sending request to Raspberry Pi...');

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('⏰ Request timeout after 60 seconds');
      }, 60000);

      // Send request
      const response = await fetch(`http://${RASPI_IP}:${RASPI_PORT}/api/process-face`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = `HTTP ${response.status} ${response.statusText}`;
        }
        console.error('❌ Server responded with error:', errorText);
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Server response:', result);

      Alert.alert(
        '✅ Registration Successful!', 
        `Face registration completed successfully!\n\nUser: ${username}\nFloor: ${floor}\n\nYou can now log in using face recognition.`,
        [
          {
            text: 'Continue to Login',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );

    } catch (error) {
      console.error('❌ Upload failed:', error);
      
      let errorMessage = 'Unknown error occurred';
      let errorTitle = '❌ Upload Failed';

      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. The server might be busy processing the face recognition model.';
        errorTitle = '⏰ Timeout Error';
      } else if (error.message.includes('Network request failed') || error.message.includes('Cannot connect')) {
        errorMessage = `Cannot connect to Raspberry Pi.\n\nPlease check:\n• Raspberry Pi is running (${RASPI_IP})\n• Server is started on port ${RASPI_PORT}\n• Both devices are on same WiFi network\n• Firewall is not blocking the connection`;
        errorTitle = '🌐 Connection Error';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. The AI model processing might take longer than expected.';
        errorTitle = '⏰ Timeout Error';
      } else if (error.message.includes('file not found')) {
        errorMessage = 'One or more captured images could not be found. Please try capturing again.';
        errorTitle = '📁 File Error';
      } else {
        errorMessage = error.message;
      }

      Alert.alert(
        errorTitle,
        errorMessage,
        [
          {
            text: 'Retry Upload',
            onPress: () => uploadImagesToRaspi(imagePaths)
          },
          {
            text: 'Recapture Images',
            onPress: () => {
              setCapturedImages([]);
              setCurrentStep(0);
              console.log('🔄 Reset to recapture images');
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } finally {
      setUploading(false);
    }
  };

  // FIXED: Better capture function from working code
  const captureImage = async () => {
    if (cameraRef.current && !loading && cameraReady) {
      setLoading(true);
      try {
        console.log(`📸 Capturing image ${currentStep + 1}/5 (${instructions[currentStep]})`);
        
        // FIXED: Simplified takePictureAsync like working code
        const photo = await cameraRef.current.takePictureAsync();
        
        console.log('📷 Photo captured:', photo.uri);

        const fileName = `${username}_${instructions[currentStep]}.jpg`;
        const newPath = `${FileSystem.documentDirectory}${fileName}`;

        // Move the photo to a permanent location
        await FileSystem.moveAsync({
          from: photo.uri,
          to: newPath,
        });

        console.log('💾 Photo saved to:', newPath);

        // Verify the file was saved
        const fileInfo = await FileSystem.getInfoAsync(newPath);
        if (!fileInfo.exists) {
          throw new Error('Failed to save captured image');
        }

        console.log(`✅ File verified: ${fileInfo.size} bytes`);

        const updated = [...capturedImages, newPath];
        setCapturedImages(updated);

        if (currentStep < 4) {
          setCurrentStep(currentStep + 1);
          console.log(`➡️ Moving to step ${currentStep + 2}/5`);
        } else {
          // All 5 images captured, now upload to Raspberry Pi
          console.log('🎯 All 5 images captured, starting upload process...');
          
          Alert.alert(
            '📸 All Images Captured!',
            'All face photos have been captured successfully. Now processing and uploading to Raspberry Pi...',
            [
              { 
                text: 'OK',
                onPress: () => {
                  console.log('🚀 User confirmed, starting upload...');
                  uploadImagesToRaspi(updated);
                }
              }
            ]
          );
        }
      } catch (err) {
        console.error('❌ Image capture failed:', err);
        Alert.alert(
          'Capture Error', 
          `Failed to capture or save image: ${err.message}`,
          [
            { text: 'Try Again', onPress: () => console.log('🔄 User will retry capture') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } finally {
        setLoading(false);
      }
    } else {
      console.warn('⚠️ Cannot capture: camera not ready or already loading');
    }
  };

  // FIXED: Better retry function
  const retryCamera = () => {
    console.log('🔄 Retrying camera initialization...');
    setCameraError(null);
    setCameraReady(false);
    testServerConnection(); // Also retry server connection
  };

  const resetCapture = () => {
    console.log('🔄 Resetting capture process...');
    setCapturedImages([]);
    setCurrentStep(0);
    Alert.alert('Reset Complete', 'You can now start capturing images again.');
  };

  const manualServerTest = () => {
    console.log('🔄 Manual server connection test...');
    testServerConnection();
  };

  // FIXED: Better permission handling like working code
  if (!permissionResult || !Array.isArray(permissionResult)) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
        <ActivityIndicator size={40} color="#2196F3" style={{ marginTop: 10 }} />
      </View>
    );
  }

  const [cameraPermission, requestPermission] = permissionResult;

  // FIXED: Better error state handling
  if (!cameraPermission?.granted || cameraError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          {cameraError || 'No access to camera'}
        </Text>
        <Text style={styles.subText}>
          {!cameraPermission?.granted 
            ? 'This app needs camera access to capture your face for registration.'
            : 'Please try restarting the camera or check device settings.'
          }
        </Text>
        
        {!cameraPermission?.granted && (
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.text}>Grant Camera Permission</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.button} onPress={retryCamera}>
          <Text style={styles.text}>Retry Camera</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.text}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show uploading screen
  if (uploading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size={80} color="#2196F3" />
        <Text style={styles.uploadingText}>
          Processing Face Registration...
        </Text>
        <Text style={styles.uploadingSubtext}>
          Running AI face recognition model on Raspberry Pi
        </Text>
        <View style={styles.uploadingDetails}>
          <Text style={styles.detailText}>• Uploading {capturedImages.length} images</Text>
          <Text style={styles.detailText}>• Extracting 128D face vectors</Text>
          <Text style={styles.detailText}>• Saving to Firebase database</Text>
        </View>
        <Text style={styles.warningText}>
          This may take 30-60 seconds...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        onCameraReady={() => {
          console.log('📷 Camera is ready');
          setCameraReady(true);
        }}
        onMountError={(error) => {
          console.error('❌ Camera mount error:', error);
          setCameraError(`Failed to initialize camera: ${error.message}`);
        }}
      />
      
      <View style={styles.overlay}>
        <View style={styles.headerInfo}>
          <Text style={styles.userInfo}>👤 {username} | 🏢 Floor {floor}</Text>
          <View style={[styles.connectionStatus, serverConnected ? styles.connected : styles.disconnected]}>
            <TouchableOpacity onPress={manualServerTest}>
              <Text style={styles.connectionText}>
                {serverConnected ? '🟢 Server Connected' : '🔴 Server Disconnected (Tap to retry)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.instructionContainer}>
          <Text style={styles.instruction}>
            Look: {instructions[currentStep]}
          </Text>
          <Text style={styles.instructionDetail}>
            Step {currentStep + 1}/5: Position your face in the center and look {instructions[currentStep].toLowerCase()}
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.captureButton, 
              (!cameraReady || loading) && styles.buttonDisabled
            ]} 
            onPress={captureImage} 
            disabled={loading || !cameraReady}
          >
            <Text style={styles.captureText}>
              {loading ? '📸 Capturing...' : '📸 Capture'}
            </Text>
          </TouchableOpacity>

          {capturedImages.length > 0 && (
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={resetCapture}
            >
              <Text style={styles.resetText}>🔄 Reset ({capturedImages.length} captured)</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progress}>Captured: {capturedImages.length}/5</Text>
          <View style={styles.progressBar}>
            {instructions.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index < capturedImages.length ? styles.progressDotCompleted : styles.progressDotPending,
                  index === currentStep ? styles.progressDotCurrent : null
                ]}
              />
            ))}
          </View>
        </View>
        
        {loading && (
          <ActivityIndicator size={40} color="#2196F3" style={{ marginTop: 10 }} />
        )}
        
        {!cameraReady && !cameraError && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size={40} color="#2196F3" />
            <Text style={styles.loadingText}>Initializing camera...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#000',
  },
  camera: { 
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    alignItems: 'center',
  },
  headerInfo: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  userInfo: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  connectionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  connected: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  disconnected: {
    backgroundColor: 'rgba(244, 67, 54, 0.3)',
  },
  connectionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  instruction: { 
    textAlign: 'center', 
    fontSize: 22, 
    marginBottom: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
  instructionDetail: {
    textAlign: 'center',
    fontSize: 16,
    color: '#ccc',
    fontStyle: 'italic',
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  captureButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    marginHorizontal: 40,
    marginVertical: 10,
    borderRadius: 8,
    minWidth: 200,
  },
  resetButton: {
    backgroundColor: '#ff9800',
    padding: 12,
    borderRadius: 8,
    minWidth: 200,
  },
  buttonDisabled: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  captureText: { 
    color: '#fff', 
    textAlign: 'center', 
    fontSize: 18,
    fontWeight: 'bold',
  },
  resetText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progress: { 
    textAlign: 'center', 
    fontSize: 16, 
    marginTop: 10,
    color: '#fff',
    fontWeight: '500',
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  progressDotPending: {
    backgroundColor: '#666',
  },
  progressDotCurrent: {
    backgroundColor: '#2196F3',
    transform: [{ scale: 1.3 }],
  },
  progressDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subText: {
    color: '#ccc',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    minWidth: 200,
  },
  buttonSecondary: {
    backgroundColor: '#666',
  },
  text: { 
    color: '#fff', 
    textAlign: 'center', 
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    borderRadius: 10,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  uploadingText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  uploadingSubtext: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  uploadingDetails: {
    marginTop: 30,
    alignItems: 'flex-start',
  },
  detailText: {
    color: '#aaa',
    fontSize: 14,
    marginVertical: 3,
  },
  warningText: {
    color: '#ffaa00',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});