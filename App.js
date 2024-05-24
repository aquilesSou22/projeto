import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Dimensions } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

export default function App() {
  const [region, setRegion] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [price, setPrice] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setCurrentPosition({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Simulate nearby drivers
      const simulatedDrivers = [
        { id: 1, latitude: latitude + 0.01, longitude: longitude + 0.01 },
        { id: 2, latitude: latitude - 0.01, longitude: longitude - 0.01 },
        { id: 3, latitude: latitude + 0.02, longitude: longitude - 0.02 },
      ];
      setDrivers(simulatedDrivers);
    })();
  }, []);

  const handleLongPress = (event, type) => {
    const coordinate = event.nativeEvent.coordinate;
    if (type === 'pickup') {
      setPickupLocation(coordinate);
    } else if (type === 'destination') {
      setDestination(coordinate);
      calculateRoute(pickupLocation, coordinate);
    }
  };

  const calculateRoute = async (origin, destination) => {
    if (!origin || !destination) return;

    const originString = `${origin.latitude},${origin.longitude}`;
    const destinationString = `${destination.latitude},${destination.longitude}`;
    const apiKey = 'AIzaSyBHVSb7ZxlVM8hr7IheCF9fv_EEjCZz1s4';
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originString}&destination=${destinationString}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes.length) {
        const points = data.routes[0].overview_polyline.points;
        const steps = decodePolyline(points);
        setRoute(steps);

        // Calculate price based on distance
        const distance = data.routes[0].legs[0].distance.value; // distance in meters
        const price = calculatePrice(distance);
        setPrice(price);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const decodePolyline = (t, e) => {
    for (var n, o, u = 0, l = 0, r = 0, d = [], h = 0, i = 0, a = null, c = Math.pow(10, e || 5); u < t.length;) {
      a = null, h = 0, i = 0;
      do a = t.charCodeAt(u++) - 63, i |= (31 & a) << h, h += 5; while (a >= 32);
      n = 1 & i ? ~(i >> 1) : i >> 1, h = i = 0;
      do a = t.charCodeAt(u++) - 63, i |= (31 & a) << h, h += 5; while (a >= 32);
      o = 1 & i ? ~(i >> 1) : i >> 1, l += n, r += o, d.push([l / c, r / c]);
    }
    return d.map(t => ({ latitude: t[0], longitude: t[1] }));
  };

  const calculatePrice = (distance) => {
    // Let's assume the base price is $5 and $1 per kilometer
    const basePrice = 5;
    const pricePerKm = 1;
    const distanceInKm = distance / 1000;
    return basePrice + (distanceInKm * pricePerKm);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bem-vinda ao SheDrive!</Text>
      <Text style={styles.paragraph}>Encontre motoristas e faça suas viagens com segurança e conforto.</Text>
      {region && (
        <MapView
          style={styles.map}
          region={region}
          showsUserLocation
          onLongPress={(e) => handleLongPress(e, 'pickup')}
        >
          {currentPosition && (
            <Marker
              coordinate={currentPosition}
              title="Sua localização"
              pinColor="blue"
            />
          )}
          {pickupLocation && (
            <Marker
              coordinate={pickupLocation}
              title="Local de Busca"
              pinColor="green"
              draggable
              onDragEnd={(e) => setPickupLocation(e.nativeEvent.coordinate)}
            />
          )}
          {destination && (
            <Marker
              coordinate={destination}
              title="Destino"
              pinColor="red"
              draggable
              onDragEnd={(e) => setDestination(e.nativeEvent.coordinate)}
            />
          )}
          {route && (
            <Polyline
              coordinates={route}
              strokeWidth={3}
              strokeColor="blue"
            />
          )}
          {drivers.map(driver => (
            <Marker
              key={driver.id}
              coordinate={{ latitude: driver.latitude, longitude: driver.longitude }}
              title="Motorista"
              pinColor="orange"
            />
          ))}
        </MapView>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Marcar Destino" onPress={() => handleLongPress('destination')} />
      </View>
      {price && (
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>Preço estimado: R${price.toFixed(2)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'violet',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    fontSize: 24,
    color: 'white',
    margin: 10,
  },
  paragraph: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.6,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  priceContainer: {
    marginTop: 20,
  },
  priceText: {
    fontSize: 18,
    color: 'white',
  },
});