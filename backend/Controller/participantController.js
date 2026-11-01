const supabase = require('../Config/supabaseConfig');

//create participant function
exports.createParticipant = async (req, res) => {
    try {
        //check if all required fields are present
        if (!req.body.fullName || !req.body.phone || !req.body.dateOfBirth || !req.body.gender ||!req.body.homeChurchCommunity ||!req.body.tshirtSize ||!req.body.emergencyContactName ||!req.body.relationship ||!req.body.emergencyContactPhone ||!req.body.bloodGroup) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        // Check participant age
const birthDate = new Date(req.body.dateOfBirth);
const today = new Date();

let age = today.getFullYear() - birthDate.getFullYear();
const monthDifference = today.getMonth() - birthDate.getMonth();

if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
) {
    age--;
}

if (age < 15 || age > 22) {
    return res.status(400).json({
        message: 'REGNUM DEI is open to participants between 15 and 22 years old.'
    });
}

        //check if participant already exists on supabase
const { data: participantExists, error: duplicateCheckError } = await supabase
    .rpc('check_participant_exists', {
        participant_full_name: req.body.fullName,
        participant_date_of_birth: req.body.dateOfBirth
    });

if (duplicateCheckError) {
    return res.status(500).json({
        message: 'Could not check existing registration'
    });
}

if (participantExists) {
    return res.status(400).json({
        message: 'You are already registered for Regnum Dei'
    });
}
        
        //check  if booleans have been checked for supabase
        if (req.body.isOnMedication === undefined || req.body.hasMedicalConditions === undefined) {
            return res.status(400).json({
                message: 'Please indicate whether you any have medical conditions or whether you are on medication'
            });
        }

        
        //check if all boolean consents have been checked on supabase
 if (
    req.body.voluntaryParticipation !== true ||
    req.body.medicalDisclosure !== true ||
    req.body.liabilityAcknowledgement !== true ||
    req.body.photographyConsent !== true ||
    req.body.safetyAgreement !== true ||
    req.body.termsAgreement !== true
) {
    return res.status(400).json({
        message: 'Please check all consent boxes and agree to the Terms & Conditions before proceeding'
    });
}

        //check if signature has been done
        if (!req.body.signature) {
            return res.status(400).json({
                message: 'Please provide your signature to proceed'
            });
        }

        //Generate registration number
        const { data: sequenceData, error: sequenceError } =await supabase
        .rpc('get_next_registration_number');
        if (sequenceError) {
            return res.status(500).json({
                message: 'We could not complete your registration. Please try again.'
            });
        }
        const registrationNumber = `RDH-26-${sequenceData}`;
    
        //create new participant
        const { error: insertError } = await supabase
    .from('participants')
    .insert([
        {
            registration_number: registrationNumber,
            full_name: req.body.fullName,
            date_of_birth: req.body.dateOfBirth,
            gender: req.body.gender,
            phone: req.body.phone,
            email: req.body.email,
            home_church_community: req.body.homeChurchCommunity,
            tshirt_size: req.body.tshirtSize,

            emergency_contact_name: req.body.emergencyContactName,
            relationship: req.body.relationship,
            emergency_contact_phone: req.body.emergencyContactPhone,

            has_medical_conditions: req.body.hasMedicalConditions,
            medical_conditions: req.body.medicalConditions,
            is_on_medication: req.body.isOnMedication,
            blood_group: req.body.bloodGroup,
            allergies: req.body.allergies,

            voluntary_participation: req.body.voluntaryParticipation,
            medical_disclosure: req.body.medicalDisclosure,
            liability_acknowledgement: req.body.liabilityAcknowledgement,
            photography_consent: req.body.photographyConsent,
            safety_agreement: req.body.safetyAgreement,
            signature: req.body.signature
        }
    ]);

if (insertError) {
    return res.status(500).json({
        message: 'Participant registration failed',
        error: insertError.message
    });
}
        res.status(201).json({
            message: 'Registration successful! Welcome to the Kingdom of God',
            registrationNumber: registrationNumber
        });
        
    } catch (error) {
        res.status(500).json({
            message: 'Something went wrong while completing your registration. Please try again'
        });
    }
};