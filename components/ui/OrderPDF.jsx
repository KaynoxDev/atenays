import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create styles with basic styling only
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 20,
    borderBottom: '1 solid #ccc',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 5,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderBottomStyle: 'solid',
  },
  tableCell: {
    padding: 5,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
    borderTop: '1 solid #eee',
    paddingTop: 10,
  },
  textBold: {
    fontWeight: 'bold',
  },
});

// Super simplified PDF component with strict type handling
const OrderPDF = ({ order }) => {
  // Defensive data handling
  if (!order) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Erreur</Text>
            <Text>Aucune donnée de commande disponible</Text>
          </View>
        </Page>
      </Document>
    );
  }

  // Convert all fields to strings explicitly
  const safeData = {
    id: String(order._id || '').substring(0, 8),
    clientName: String(order.clientName || 'Client non spécifié'),
    clientRealm: String(order.clientRealm || 'Non spécifié'),
    character: String(order.character || 'Non spécifié'),
    status: String(order.status || 'pending'),
    price: Number(order.price || 0),
    initialPayment: Number(order.initialPayment || 0),
    notes: String(order.notes || ''),
    date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Date inconnue'
  };

  // Calculate remaining amount
  const remainingAmount = safeData.price - safeData.initialPayment;

  // Map status to human-readable text
  const statusText = {
    'pending': 'En attente',
    'in-progress': 'En cours',
    'completed': 'Terminée',
    'cancelled': 'Annulée'
  }[safeData.status] || 'Statut inconnu';

  // Get today's date as string for the footer
  const today = new Date().toLocaleDateString();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Commande Aténays</Text>
          <Text>Référence: #{safeData.id}</Text>
          <Text>Statut: {statusText}</Text>
        </View>

        {/* Client information */}
        <View style={styles.section}>
          <Text style={styles.textBold}>Informations client:</Text>
          <Text>Client: {safeData.clientName}</Text>
          <Text>Royaume: {safeData.clientRealm}</Text>
          <Text>Personnage: {safeData.character}</Text>
          <Text>Date de commande: {safeData.date}</Text>
        </View>

        {/* Payment information */}
        <View style={styles.section}>
          <Text style={styles.textBold}>Informations de paiement:</Text>
          <Text>Prix total: {safeData.price} or</Text>
          <Text>Acompte versé: {safeData.initialPayment} or</Text>
          <Text>Reste à payer: {remainingAmount} or</Text>
        </View>
        
        {/* Notes section if available */}
        {safeData.notes && (
          <View style={styles.section}>
            <Text style={styles.textBold}>Notes:</Text>
            <Text>{safeData.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Document généré le {today} par Aténays • Ce document fait office de reçu pour la commande
        </Text>
      </Page>
    </Document>
  );
};

export default OrderPDF;
