const supabase = require('../Config/supabaseConfig');
const crypto = require('crypto');
const { sendEmailVerificationCode } = require('../Services/emailService');

//create participant function
exports.createParticipant = async (req, res) => {
    try {

                // Require a verified email
        const email = req.body.email?.trim().toLowerCase();
        const verificationToken = req.body.verificationToken;

        if (!email || !verificationToken) {
            return res.status(400).json({
                message: 'Please verify your email before registering.'
            });
        }

        // Find the email verification record
        const { data: verification, error: verificationError } = await supabase
            .from('email_verifications')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (verificationError || !verification) {
            return res.status(400).json({
                message: 'Email verification not found. Please verify your email again.'
            });
        }

        // Check verification token expiry
        if (
            !verification.verification_token_expires_at ||
            new Date(verification.verification_token_expires_at) < new Date()
        ) {
            return res.status(400).json({
                message: 'Your email verification has expired. Please verify again.'
            });
        }

        // Compare the submitted token with the stored hash
        const submittedTokenHash = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');

       const storedTokenHash = verification.verification_token_hash;

const isTokenValid =
    typeof storedTokenHash === 'string' &&
    /^[a-f0-9]{64}$/i.test(storedTokenHash) &&
    crypto.timingSafeEqual(
        Buffer.from(submittedTokenHash, 'hex'),
        Buffer.from(storedTokenHash, 'hex')
    );

        if (!isTokenValid) {
            return res.status(400).json({
                message: 'Invalid email verification. Please verify your email again.'
            });
        }

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
            email_verified: true,
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

// Clear the verification token after successful registration
const { error: consumeError } = await supabase
    .from('email_verifications')
    .update({
        verification_token_hash: null,
        verification_token_expires_at: null,
        verified_at: null
    })
    .eq('email', email)
    .eq('verification_token_hash', submittedTokenHash);

if (consumeError) {
    console.error('Could not clear verification token:', consumeError);
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

// Request email verification code
exports.requestEmailVerification = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();

        if (!email) {
            return res.status(400).json({
                message: 'Please provide an email address.'
            });
        }

        // Generate a six-digit OTP
        const code = crypto.randomInt(100000, 1000000).toString();

        // Hash the OTP before storing it
        const codeHash = crypto
            .createHmac('sha256', process.env.EMAIL_PASS)
            .update(`${email}:${code}`)
            .digest('hex');

        // OTP expires in 10 minutes
        const expiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        ).toISOString();

        // Save or replace the verification record
        const { error } = await supabase
            .from('email_verifications')
            .upsert({
                email,
                code_hash: codeHash,
                expires_at: expiresAt,
                attempts: 0,
                verified_at: null,
                verification_token_hash: null,
                verification_token_expires_at: null,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'email'
            });

        if (error) {
            console.error('OTP database error:', error);

            return res.status(500).json({
                message: 'Could not create your verification code.'
            });
        }

        // Send OTP to the email address
        await sendEmailVerificationCode(email, code);

        return res.status(200).json({
    success: true,
    message: 'Verification code sent. Please check your email.'
});

    } catch (error) {
        console.error('Email verification error:', error);

        return res.status(500).json({
            message: 'Could not send verification code. Please try again.'
        });
    }
};


// Verify email verification code
exports.verifyEmailCode = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const code = req.body.code?.trim();

        if (!email || !code) {
            return res.status(400).json({
                message: 'Email and verification code are required.'
            });
        }

        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({
                message: 'Please enter a valid six-digit code.'
            });
        }

        // Find the verification record
        const { data: verification, error } = await supabase
            .from('email_verifications')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (error || !verification) {
            return res.status(400).json({
                message: 'No verification request found. Please request a new code.'
            });
        }

        // Check expiry
        if (new Date(verification.expires_at) < new Date()) {
            return res.status(400).json({
                message: 'This code has expired. Please request a new one.'
            });
        }

        // Limit incorrect attempts
        if (verification.attempts >= 5) {
            return res.status(429).json({
                message: 'Too many incorrect attempts. Please request a new code.'
            });
        }

        // Hash the submitted code
        const submittedHash = crypto
            .createHmac('sha256', process.env.EMAIL_PASS)
            .update(`${email}:${code}`)
            .digest('hex');

        const storedHash = verification.code_hash;

const isCorrect =
    typeof storedHash === 'string' &&
    /^[a-f0-9]{64}$/i.test(storedHash) &&
    crypto.timingSafeEqual(
        Buffer.from(submittedHash, 'hex'),
        Buffer.from(storedHash, 'hex')
    );

        if (!isCorrect) {
            await supabase
                .from('email_verifications')
                .update({
                    attempts: verification.attempts + 1
                })
                .eq('email', email);

            return res.status(400).json({
                message: 'Incorrect verification code.'
            });
        }

        // Generate a temporary registration verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const tokenHash = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');

        const tokenExpiresAt = new Date(
            Date.now() + 15 * 60 * 1000
        ).toISOString();

        const { error: updateError } = await supabase
            .from('email_verifications')
            .update({
                verified_at: new Date().toISOString(),
                code_hash: null,
                verification_token_hash: tokenHash,
                verification_token_expires_at: tokenExpiresAt
            })
            .eq('email', email);

        if (updateError) {
            return res.status(500).json({
                message: 'Email verification could not be completed.'
            });
        }

      return res.status(200).json({
    success: true,
    message: 'Email verified successfully.',
    verificationToken
});

    } catch (error) {
        console.error('OTP verification error:', error);

        return res.status(500).json({
            message: 'Something went wrong during email verification.'
        });
    }
};


// Recover Seeker ID after email verification
exports.recoverSeekerID = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
const fullName = req.body.fullName?.trim();
const dateOfBirth = req.body.dateOfBirth;
        const verificationToken = req.body.verificationToken;

       if (!email || !fullName || !dateOfBirth || !verificationToken) {
            return res.status(400).json({
                message: 'Email verification is required.'
            });
        }

        // Find the email verification record
        const { data: verification, error } = await supabase
            .from('email_verifications')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (error || !verification) {
            return res.status(400).json({
                message: 'Email verification not found.'
            });
        }

        // Check token expiry
        if (
            !verification.verification_token_expires_at ||
            new Date(verification.verification_token_expires_at) < new Date()
        ) {
            return res.status(400).json({
                message: 'Your verification has expired. Please verify again.'
            });
        }

        // Validate token
        const submittedHash = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');

        const storedHash = verification.verification_token_hash;

        const isValid =
            typeof storedHash === 'string' &&
            /^[a-f0-9]{64}$/i.test(storedHash) &&
            crypto.timingSafeEqual(
                Buffer.from(submittedHash, 'hex'),
                Buffer.from(storedHash, 'hex')
            );

        if (!isValid) {
            return res.status(400).json({
                message: 'Invalid verification. Please verify your email again.'
            });
        }

        // Find participant using verified email
        const { data: participant, error: participantError } = await supabase
    .from('participants')
    .select('registration_number, payment_status')
    .eq('email', email)
    .eq('full_name', fullName)
    .eq('date_of_birth', dateOfBirth)
    .maybeSingle();

        if (participantError) {
            return res.status(500).json({
                message: 'Could not retrieve your registration.'
            });
        }

        if (!participant) {
            return res.status(404).json({
                message: 'No registration was found for this email address.'
            });
        }

        // Consume verification token
        await supabase
            .from('email_verifications')
            .update({
                verification_token_hash: null,
                verification_token_expires_at: null,
                verified_at: null
            })
            .eq('email', email)
            .eq('verification_token_hash', submittedHash);

        return res.status(200).json({
            message: 'Registration recovered successfully.',
            registrationNumber: participant.registration_number,
            paymentStatus: participant.payment_status
        });

    } catch (error) {
        console.error('Seeker ID recovery error:', error);

        return res.status(500).json({
            message: 'Could not recover your registration.'
        });
    }
};