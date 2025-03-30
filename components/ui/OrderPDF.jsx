import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet
} from '@react-pdf/renderer';

// Définir les styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 12,
    lineHeight: 1.5,
    color: '#333',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1px solid #ddd',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#3b82f6',
  },
  orderNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 12,
    display: 'inline-block',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  statusPending: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
  },
  statusInProgress: {
    backgroundColor: '#fef3c7',
    color: '#9a3412',
  },
  statusCompleted: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusCancelled: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
    padding: '5px 10px',
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  labelColumn: {
    width: '30%',
    fontWeight: 'bold',
  },
  valueColumn: {
    width: '70%',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: '#ddd',
    paddingVertical: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: '#eee',
    paddingVertical: 8,
  },
  tableCell: {
    paddingHorizontal: 5,
  },
  col1: { width: '40%' },
  col2: { width: '20%' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    fontWeight: 'bold',
    borderTopWidth: 1,
    borderStyle: 'solid',
    borderColor: '#ddd',
  },
  notes: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    fontSize: 11,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
    borderTopWidth: 1,
    borderStyle: 'solid',
    borderColor: '#eee',
    paddingTop: 10,
  },
});

// Composant principal pour le PDF de la commande
export const OrderPDF = ({ order }) => {
  // Safe default values
  const safeOrder = order || {};
  const {
    _id = '',
    clientName = 'Client non spécifié',
    clientRealm = '',
    character = '',
    createdAt = new Date().toISOString(),
    status = 'pending',
    notes = '',
    price = 0,
    initialPayment = 0,
    professions = []
  } = safeOrder;
  
  // Formatter les dates
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch(e) {
      return 'Date invalide';
    }
  };
  
  // Déterminer le style du badge de statut
  const getStatusStyle = () => {
    switch (status) {
      case 'pending': return styles.statusPending;
      case 'in-progress': return styles.statusInProgress;
      case 'completed': return styles.statusCompleted;
      case 'cancelled': return styles.statusCancelled;
      default: return {};
    }
  };
  
  // Traduire le statut
  const getStatusName = (statusValue) => {
    const translations = {
      pending: 'En attente',
      'in-progress': 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée'
    };
    return translations[statusValue] || statusValue;
  };

  // S'assurer que professions est un tableau
  const safeProfessions = Array.isArray(professions) ? professions : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>Aténays - Détails de commande</Text>
          <Text style={styles.orderNumber}>Commande #{_id?.substring(0, 8) || 'N/A'}</Text>
          <View style={[styles.statusBadge, getStatusStyle()]}>
            <Text>{getStatusName(status)}</Text>
          </View>
        </View>
        
        {/* Informations du client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations client</Text>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>Client:</Text>
            <Text style={styles.valueColumn}>{clientName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>Royaume:</Text>
            <Text style={styles.valueColumn}>{clientRealm || 'Non spécifié'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>Personnage:</Text>
            <Text style={styles.valueColumn}>{character || 'Non spécifié'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>Date de commande:</Text>
            <Text style={styles.valueColumn}>{formatDate(createdAt)}</Text>
          </View>
        </View>
        
        {/* Détails des services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services commandés</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.col1]}>Service</Text>
            <Text style={[styles.tableCell, styles.col2]}>Niveau</Text>
            <Text style={[styles.tableCell, styles.col3]}>Prix</Text>
          </View>
          
          {safeProfessions.map((prof, idx) => (
            <View key={`prof-${idx}`} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>{prof.name || 'N/A'}</Text>
              <Text style={[styles.tableCell, styles.col2]}>1-{prof.levelRange || '525'}</Text>
              <Text style={[styles.tableCell, styles.col3]}>{prof.price || 0} or</Text>
            </View>
          ))}
          
          <View style={styles.totalRow}>
            <Text style={[styles.tableCell, styles.col1]}></Text>
            <Text style={[styles.tableCell, styles.col2]}>Total:</Text>
            <Text style={[styles.tableCell, styles.col3]}>{price} or</Text>
          </View>
        </View>
        
        {/* Informations de paiement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de paiement</Text>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>Prix total:</Text>
            <Text style={styles.valueColumn}>{price} or</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>Acompte versé:</Text>
            <Text style={styles.valueColumn}>{initialPayment || 0} or</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelColumn}>Reste à payer:</Text>
            <Text style={styles.valueColumn}>{price - (initialPayment || 0)} or</Text>
          </View>
        </View>
        
        {/* Notes */}
        {notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notes}>
              <Text>{notes}</Text>
            </View>
          </View>
        )}
        
        {/* Pied de page */}
        <Text style={styles.footer}>
          Document généré le {new Date().toLocaleDateString('fr-FR')} par Aténays • Ce document fait office de reçu pour la commande
        </Text>
      </Page>
    </Document>
  );
};

// IMPORTANT: Export as a named export AND a default export for compatibility
export default OrderPDF;
