export const clientSchema = {
  name: String,
  realm: String,
  character: String,
  discord: String,
  notes: String,
  joinedDate: Date
};

export const materialSchema = {
  name: String,
  iconName: String,
  quantity: Number,
  profession: String,
  levelRange: String
};

export const orderSchema = {
  clientId: String,
  clientName: String,
  clientRealm: String,
  character: String,
  // Remplacer le champ profession unique par un tableau de professions
  professions: [
    {
      name: String,          // Nom de la profession
      levelRange: String,    // Niveau cible (ex: "525")
      price: Number,         // Prix spécifique pour cette profession
      materials: [{          // Matériaux supplémentaires fournis par client
        materialId: String,
        name: String,
        quantity: Number
      }]
    }
  ],
  status: String,
  createdAt: Date,
  completedAt: Date,
  price: Number,             // Prix total
  initialPayment: Number,
  notes: String
};

export const paymentSchema = {
  orderId: String,
  amount: Number,
  type: String,
  date: Date,
  notes: String
};

export const professionSchema = {
  name: String,
  icon: String,
  description: String,
  priceRanges: {
    '225': { min: Number, max: Number },
    '300': { min: Number, max: Number },
    '375': { min: Number, max: Number },
    '450': { min: Number, max: Number },
    '525': { min: Number, max: Number }
  }
};
