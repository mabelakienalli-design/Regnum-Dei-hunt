const participant = {
    registrationNumber: String,
    fullName: String,
    dateOfBirth: Date,
    gender: String,
    phone: String,
    email: String,
    homeChurchCommunity: String,
    tshirtSize: String,

    emergencyContactName: String,
    relationship: String,
    emergencyContactPhone: String,

    hasMedicalConditions: Boolean,
    isOnMedication: Boolean,
    bloodGroup: String,
    allergies: String,

    voluntaryParticipation: Boolean,
    medicalDisclosure: Boolean,
    liabilityAcknowledgement: Boolean,
    photographyConsent: Boolean,
    safetyAgreement: Boolean,
    signature: String,


    createdAt: Date
};

module.exports = participant;