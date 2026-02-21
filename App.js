import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, SafeAreaView, View, Platform, StatusBar } from 'react-native';
import { 
  Provider as PaperProvider, 
  MD3DarkTheme, 
  Appbar, 
  Card, 
  TextInput, 
  Button, 
  Text, 
  Divider, 
  Portal, 
  Dialog,
  List,
  IconButton,
  ActivityIndicator,
  Snackbar
} from 'react-native-paper';
import axios from 'axios';
import { Trash2, Plus, Camera, Mail, User, Phone, MapPin } from 'lucide-react-native';

const API_BASE = 'https://convention.photos';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Form State
  const [eventPrefix, setEventPrefix] = useState('CPS');
  const [availableEvents, setAvailableEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventSelector, setShowEventSelector] = useState(false);
  
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [apartment, setApartment] = useState('');
  
  const [items, setItems] = useState([]);

  // Fetch Events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/proxy-events`);
        setAvailableEvents(response.data.events || []);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    };
    fetchEvents();
  }, []);

  const addItem = () => {
    setItems([...items, { photoNumber: '', qty4x6: 0, qty5x7: 0, qty8x10: 0 }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateItemTotal = (item) => {
    return (item.qty4x6 * 8) + (item.qty5x7 * 15) + (item.qty8x10 * 20);
  };

  const calculate4x6Discount = () => {
    const total4x6Qty = items.reduce((sum, item) => sum + parseInt(item.qty4x6 || 0), 0);
    return Math.floor(total4x6Qty / 3) * 4;
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    return subtotal - calculate4x6Discount();
  };

  const handleSubmit = async () => {
    if (!customerName || !email || !items.length) {
      setSnackbarMessage('Please fill in required fields and add at least one item.');
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customerName,
        email,
        phone,
        fulfillmentType: 'ship',
        street,
        city,
        state,
        zipCode,
        apartment,
        eventCode: selectedEvent ? selectedEvent.slug : eventPrefix,
        items: items.map(item => ({
          photoNumber: item.photoNumber,
          qty4x6: parseInt(item.qty4x6 || 0),
          qty5x7: parseInt(item.qty5x7 || 0),
          qty8x10: parseInt(item.qty8x10 || 0)
        }))
      };

      await axios.post(`${API_BASE}/api/orders/create`, orderData);
      
      setSnackbarMessage('Order submitted successfully!');
      setSnackbarVisible(true);
      
      // Reset form
      setItems([]);
      setCustomerName('');
      setEmail('');
      setPhone('');
      setStreet('');
      setCity('');
      setState('');
      setZipCode('');
      setApartment('');
    } catch (error) {
      setSnackbarMessage('Failed to submit order. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaperProvider theme={MD3DarkTheme}>
      <SafeAreaView style={styles.safeArea}>
        <Appbar.Header elevated>
          <Appbar.Content title="CPS Orders" titleStyle={styles.appbarTitle} />
        </Appbar.Header>

        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Card style={styles.card}>
            <Card.Title title="Event Selection" left={(props) => <IconButton {...props} icon="calendar" />} />
            <Card.Content>
              <Button 
                mode="outlined" 
                onPress={() => setShowEventSelector(true)}
                style={styles.eventButton}
              >
                {selectedEvent ? selectedEvent.slug : 'Select Event'}
              </Button>
            </Card.Content>
          </Card>

          <View style={styles.sectionHeader}>
            <Text variant="titleLarge">Photos</Text>
            <Button icon="plus" mode="contained" onPress={addItem}>Add Photo</Button>
          </View>

          {items.map((item, index) => (
            <Card key={index} style={styles.itemCard}>
              <Card.Content>
                <View style={styles.itemHeader}>
                  <Text variant="titleMedium">Photo #{index + 1}</Text>
                  <IconButton icon="trash-can" iconColor="#ff4444" onPress={() => removeItem(index)} />
                </View>
                
                <TextInput
                  label="Photo Number"
                  value={item.photoNumber}
                  onChangeText={(val) => updateItem(index, 'photoNumber', val)}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                />

                <View style={styles.qtyRow}>
                  <TextInput
                    label="4x6 ($8)"
                    value={item.qty4x6.toString()}
                    onChangeText={(val) => updateItem(index, 'qty4x6', val.replace(/[^0-9]/g, ''))}
                    mode="outlined"
                    keyboardType="numeric"
                    style={[styles.input, styles.qtyInput]}
                  />
                  <TextInput
                    label="5x7 ($15)"
                    value={item.qty5x7.toString()}
                    onChangeText={(val) => updateItem(index, 'qty5x7', val.replace(/[^0-9]/g, ''))}
                    mode="outlined"
                    keyboardType="numeric"
                    style={[styles.input, styles.qtyInput]}
                  />
                  <TextInput
                    label="8x10 ($20)"
                    value={item.qty8x10.toString()}
                    onChangeText={(val) => updateItem(index, 'qty8x10', val.replace(/[^0-9]/g, ''))}
                    mode="outlined"
                    keyboardType="numeric"
                    style={[styles.input, styles.qtyInput]}
                  />
                </View>
              </Card.Content>
            </Card>
          ))}

          {items.length > 0 && (
            <>
              <Text variant="titleLarge" style={styles.sectionTitle}>Customer Information</Text>
              <Card style={styles.card}>
                <Card.Content>
                  <TextInput
                    label="Name"
                    value={customerName}
                    onChangeText={setCustomerName}
                    mode="outlined"
                    style={styles.input}
                    left={<TextInput.Icon icon="account" />}
                  />
                  <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    keyboardType="email-address"
                    style={styles.input}
                    left={<TextInput.Icon icon="email" />}
                  />
                  <TextInput
                    label="Phone"
                    value={phone}
                    onChangeText={setPhone}
                    mode="outlined"
                    keyboardType="phone-pad"
                    style={styles.input}
                    left={<TextInput.Icon icon="phone" />}
                  />
                  
                  <Divider style={styles.divider} />
                  <Text variant="titleSmall" style={styles.subHeader}>Shipping Address</Text>
                  
                  <TextInput
                    label="Street"
                    value={street}
                    onChangeText={setStreet}
                    mode="outlined"
                    style={styles.input}
                  />
                  <TextInput
                    label="Apt/Unit"
                    value={apartment}
                    onChangeText={setApartment}
                    mode="outlined"
                    style={styles.input}
                  />
                  <View style={styles.qtyRow}>
                    <TextInput
                      label="City"
                      value={city}
                      onChangeText={setCity}
                      mode="outlined"
                      style={[styles.input, { flex: 2 }]}
                    />
                    <TextInput
                      label="ST"
                      value={state}
                      onChangeText={setState}
                      mode="outlined"
                      style={[styles.input, { flex: 1 }]}
                    />
                  </View>
                  <TextInput
                    label="Zip Code"
                    value={zipCode}
                    onChangeText={setZipCode}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </Card.Content>
              </Card>

              <Card style={styles.totalCard}>
                <Card.Content>
                  <View style={styles.totalRow}>
                    <Text variant="headlineSmall">Total:</Text>
                    <Text variant="headlineSmall" style={styles.totalAmount}>${calculateTotal()}</Text>
                  </View>
                  {calculate4x6Discount() > 0 && (
                    <Text style={styles.discountText}>Includes 3-for-$20 discount</Text>
                  )}
                  <Button 
                    mode="contained" 
                    onPress={handleSubmit} 
                    style={styles.submitButton}
                    loading={loading}
                    disabled={loading}
                  >
                    Submit Order
                  </Button>
                </Card.Content>
              </Card>
            </>
          )}
        </ScrollView>

        <Portal>
          <Dialog visible={showEventSelector} onDismiss={() => setShowEventSelector(false)}>
            <Dialog.Title>Select Event</Dialog.Title>
            <Dialog.ScrollArea>
              <ScrollView style={{ maxHeight: 400 }}>
                {availableEvents.map((event) => (
                  <List.Item
                    key={event.slug}
                    title={event.slug}
                    description={event.date_human}
                    onPress={() => {
                      setSelectedEvent(event);
                      setShowEventSelector(false);
                    }}
                    right={props => selectedEvent?.slug === event.slug ? <List.Icon {...props} icon="check" /> : null}
                  />
                ))}
              </ScrollView>
            </Dialog.ScrollArea>
          </Dialog>
        </Portal>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
        >
          {snackbarMessage}
        </Snackbar>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  appbarTitle: {
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
  },
  itemCard: {
    marginBottom: 12,
    backgroundColor: '#1a1a1a',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#1a1a1a',
  },
  qtyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  qtyInput: {
    flex: 1,
  },
  eventButton: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  subHeader: {
    marginBottom: 12,
    opacity: 0.7,
  },
  totalCard: {
    marginTop: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 2,
    borderTopColor: '#10b981',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmount: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  discountText: {
    color: '#10b981',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 6,
  },
});
