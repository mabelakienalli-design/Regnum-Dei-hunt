document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registrationForm");

  const termsAgreement = document.getElementById("termsAgreement");

  const submitButton = document.getElementById("submitButton");

  // EMAIL VERIFICATION
  const emailInput = document.getElementById("email");
  const verifyEmailButton = document.getElementById("verifyEmailButton");
  const otpVerificationGroup = document.getElementById("otpVerificationGroup");
  const emailOtp = document.getElementById("emailOtp");
  const confirmEmailButton = document.getElementById("confirmEmailButton");
  const emailVerificationMessage = document.getElementById(
    "emailVerificationMessage",
  );
  const successSection = document.getElementById("successSection");
  const registrationNumber = document.getElementById("registrationNumber");

  let verificationToken = null;
  let verifiedEmail = null;

  // SEEKER ID RECOVERY
  const recoveryEmail = document.getElementById("recoveryEmail");
  const recoveryFullName = document.getElementById("recoveryFullName");
  const recoveryDateOfBirth = document.getElementById("recoveryDateOfBirth");
  const recoveryVerifyButton = document.getElementById("recoveryVerifyButton");
  const recoveryOtpGroup = document.getElementById("recoveryOtpGroup");
  const recoveryOtp = document.getElementById("recoveryOtp");
  const recoveryConfirmButton = document.getElementById(
    "recoveryConfirmButton",
  );
  const recoveryMessage = document.getElementById("recoveryMessage");
  const recoveredRegistration = document.getElementById(
    "recoveredRegistration",
  );
  const recoveredSeekerId = document.getElementById("recoveredSeekerId");
  const recoveredPaymentStatus = document.getElementById(
    "recoveredPaymentStatus",
  );
  const recoveredPayButton = document.getElementById("recoveredPayButton");

  let recoveryVerificationToken = null;

  const continueToPaymentButton = document.getElementById(
    "continueToPaymentButton",
  );

  const paymentSection = document.getElementById("paymentSection");

  const paymentSeekerId = document.getElementById("paymentSeekerId");

  const payNowButton = document.getElementById("payNowButton");

  const dateOfBirth = document.getElementById("dateOfBirth");

  const phone = document.getElementById("phone");

  const emergencyContactPhone = document.getElementById(
    "emergencyContactPhone",
  );

  // =========================
  // REQUEST RECOVERY OTP
  // =========================

  recoveryVerifyButton.addEventListener("click", async function () {
    const email = recoveryEmail.value.trim().toLowerCase();
    const fullName = recoveryFullName.value.trim();
    const dateOfBirth = recoveryDateOfBirth.value;

    if (!email || !fullName || !dateOfBirth) {
      alert("Please enter the email, full name and date of birth.");
      return;
    }

    if (!recoveryEmail.checkValidity()) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      recoveryVerifyButton.disabled = true;
      recoveryVerifyButton.textContent = "Sending Code...";

      const response = await fetch("/api/participants/verify-email/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not send verification code.");
        return;
      }

      recoveryOtpGroup.style.display = "block";
      recoveryMessage.textContent =
        "Verification code sent. Please check your inbox.";
      recoveryMessage.style.color = "green";
    } catch (error) {
      console.error("Recovery OTP error:", error);
      alert("Could not connect to the server. Please try again.");
    } finally {
      recoveryVerifyButton.disabled = false;
      recoveryVerifyButton.textContent = "Send Verification Code";
    }
  });

  // =========================
  // CONFIRM RECOVERY OTP
  // =========================

  recoveryConfirmButton.addEventListener("click", async function () {
    const email = recoveryEmail.value.trim().toLowerCase();
    const code = recoveryOtp.value.trim();

    if (!/^\d{6}$/.test(code)) {
      alert("Please enter the six-digit verification code.");
      return;
    }

    try {
      recoveryConfirmButton.disabled = true;
      recoveryConfirmButton.textContent = "Verifying...";

      // Verify email OTP
      const verifyResponse = await fetch(
        "/api/participants/verify-email/confirm",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, code }),
        },
      );

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        alert(verifyData.message || "Email verification failed.");
        return;
      }

      recoveryVerificationToken = verifyData.verificationToken;

      // Recover the player's registration
      const recoveryResponse = await fetch(
        "/api/participants/recover-seeker-id",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            fullName: recoveryFullName.value.trim(),
            dateOfBirth: recoveryDateOfBirth.value,
            verificationToken: recoveryVerificationToken,
          }),
        },
      );

      const recoveryData = await recoveryResponse.json();

      if (!recoveryResponse.ok) {
        alert(recoveryData.message || "Could not recover registration.");
        return;
      }

      recoveredSeekerId.textContent = recoveryData.registrationNumber;
      recoveredPaymentStatus.textContent = `Payment status: ${recoveryData.paymentStatus}`;

      recoveredRegistration.style.display = "block";
      recoveryMessage.textContent = "Registration recovered successfully!";
      recoveryMessage.style.color = "green";

      recoveryVerificationToken = null;
    } catch (error) {
      console.error("Recovery error:", error);
      alert("Could not complete recovery. Please try again.");
    } finally {
      recoveryConfirmButton.disabled = false;
      recoveryConfirmButton.textContent = "Verify Email";
    }
  });

  // =========================
  // RETRY RECOVERED PAYMENT
  // =========================

  recoveredPayButton.addEventListener("click", async function () {
    const seekerId = recoveredSeekerId.textContent.trim();

    if (!seekerId) {
      alert("Seeker ID could not be found.");
      return;
    }

    try {
      recoveredPayButton.disabled = true;
      recoveredPayButton.textContent = "Connecting to payment...";

      const response = await fetch(
        `/api/payments/initialize/${encodeURIComponent(seekerId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not initialize payment.");
        return;
      }

      window.location.href = data.authorizationUrl;
    } catch (error) {
      console.error("Recovery payment error:", error);
      alert("Could not connect to the payment server.");
    } finally {
      recoveredPayButton.disabled = false;
      recoveredPayButton.textContent = "Continue to Payment";
    }
  });

  // =========================
  // T&C CHECKBOX
  // =========================

  termsAgreement.addEventListener("change", function () {
    submitButton.disabled = !(
      termsAgreement.checked &&
      verificationToken &&
      verifiedEmail === emailInput.value.trim().toLowerCase()
    );
  });

  // =========================
  // REQUEST EMAIL VERIFICATION
  // =========================

  verifyEmailButton.addEventListener("click", async function () {
    const email = emailInput.value.trim().toLowerCase();

    if (!emailInput.checkValidity()) {
      alert("Please enter a valid email address.");
      emailInput.focus();
      return;
    }

    try {
      verifyEmailButton.disabled = true;
      verifyEmailButton.textContent = "Sending Code...";

      const response = await fetch("/api/participants/verify-email/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not send verification code.");
        return;
      }

      otpVerificationGroup.style.display = "block";

      emailVerificationMessage.textContent =
        "Verification code sent. Please check your inbox.";

      emailVerificationMessage.style.color = "green";
    } catch (error) {
      console.error("Email verification request error:", error);

      alert("Could not connect to the server. Please try again.");
    } finally {
      verifyEmailButton.disabled = false;
      verifyEmailButton.textContent = "Verify Email";
    }
  });

  // =========================
  // CONFIRM EMAIL VERIFICATION
  // =========================

  confirmEmailButton.addEventListener("click", async function () {
    const email = emailInput.value.trim().toLowerCase();
    const code = emailOtp.value.trim();

    if (!/^\d{6}$/.test(code)) {
      alert("Please enter the six-digit verification code.");
      emailOtp.focus();
      return;
    }

    try {
      confirmEmailButton.disabled = true;
      confirmEmailButton.textContent = "Verifying...";

      const response = await fetch("/api/participants/verify-email/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Email verification failed.");
        return;
      }

      verificationToken = data.verificationToken;
      verifiedEmail = email;

      emailVerificationMessage.textContent = "Email successfully verified!";

      emailVerificationMessage.style.color = "green";

      emailInput.readOnly = true;
      emailOtp.disabled = true;
      verifyEmailButton.disabled = true;
      confirmEmailButton.textContent = "Email Verified";

      submitButton.disabled = !termsAgreement.checked;
    } catch (error) {
      console.error("Email confirmation error:", error);

      alert("Could not verify your email. Please try again.");
    } finally {
      if (!verificationToken) {
        confirmEmailButton.disabled = false;
        confirmEmailButton.textContent = "Confirm Code";
      }
    }
  });

  // =========================
  // AGE VALIDATION
  // =========================

  //     dateOfBirth.addEventListener('change', function () {

  //         if (!dateOfBirth.value) {
  //             return;
  //         }

  //         const birthDate = new Date(dateOfBirth.value);

  //         const today = new Date();

  //         let age =
  //             today.getFullYear() - birthDate.getFullYear();

  //         const monthDifference =
  //             today.getMonth() - birthDate.getMonth();

  //         if (
  //             monthDifference < 0 ||
  //             (
  //                 monthDifference === 0 &&
  //                 today.getDate() < birthDate.getDate()
  //             )
  //         ) {
  //             age--;
  //         }

  //         if (age < 15 || age > 22) {

  //            alert(
  //     'Sorry, you do not meet the eligibility requirements for REGNUM DEI HUNT.'
  // );

  //             dateOfBirth.value = '';

  //             return;
  //         }

  //     });

  // =========================
  // MEDICAL CONDITION CHECK
  // =========================

  const hasMedicalConditions = document.getElementById("hasMedicalConditions");

  const medicalConditionGroup = document.getElementById(
    "medicalConditionGroup",
  );

  const medicalConditions = document.getElementById("medicalConditions");

  hasMedicalConditions.addEventListener("change", function () {
    if (hasMedicalConditions.value === "true") {
      medicalConditionGroup.style.display = "block";

      medicalConditions.required = true;
    } else {
      medicalConditionGroup.style.display = "none";

      medicalConditions.required = false;

      medicalConditions.value = "";
    }
  });

  // =========================
  // FORM SUBMISSION
  // =========================

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Ensure email has been verified
    const currentEmail = emailInput.value.trim().toLowerCase();

    if (
      !verificationToken ||
      !verifiedEmail ||
      verifiedEmail !== currentEmail
    ) {
      alert("Please verify your email address before continuing.");
      return;
    }

    // =========================
    // PHONE VALIDATION
    // =========================

    const phoneNumber = phone.value.trim();

    const emergencyPhoneNumber = emergencyContactPhone.value.trim();

    // PARTICIPANT PHONE

    if (!/^\d{10}$/.test(phoneNumber)) {
      alert("Please enter exactly 10 digits for your phone number after +234.");

      phone.focus();

      return;
    }

    // EMERGENCY CONTACT PHONE

    if (!/^\d{10}$/.test(emergencyPhoneNumber)) {
      alert(
        "Please enter exactly 10 digits for the emergency contact phone number after +234.",
      );

      emergencyContactPhone.focus();

      return;
    }

    // =========================
    // =========================
    // EMAIL VALIDATION
    // =========================

    const email = document.getElementById("email");

    const emailValue = email.value.trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailValue) {
      alert("Please enter your email address.\n\nExample: example@gmail.com");

      email.focus();

      return;
    }

    if (!emailPattern.test(emailValue)) {
      alert(
        "Please enter your email in the correct format.\n\nExample: example@gmail.com",
      );

      email.focus();

      return;
    }

    // =========================
    // SIGNATURE VALIDATION
    // =========================

    const fullName = document.getElementById("fullName").value.trim();

    const signature = document.getElementById("signature").value.trim();

    if (signature.toLowerCase() !== fullName.toLowerCase()) {
      alert("Your signature must match your full name.");

      document.getElementById("signature").focus();

      return;
    }

    // AGE ELIGIBILITY VALIDATION
    const dateOfBirthValue = dateOfBirth.value;

    if (!dateOfBirthValue) {
      alert("Please enter your date of birth.");
      dateOfBirth.focus();
      return;
    }

    const birthDate = new Date(dateOfBirthValue);
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
      alert(
        "Sorry, you do not meet the eligibility requirements for REGNUM DEI HUNT.",
      );
      dateOfBirth.value = "";
      dateOfBirth.focus();
      return;
    }

    // =========================
    // SUBMIT REGISTRATION
    // =========================
    const formData = {
      fullName: fullName,

      dateOfBirth: document.getElementById("dateOfBirth").value,

      gender: document.getElementById("gender").value,

      phone: phoneNumber,

      email: emailValue,

      verificationToken: verificationToken,

      homeChurchCommunity: document
        .getElementById("homeChurchCommunity")
        .value.trim(),

      tshirtSize: document.getElementById("tshirtSize").value,

      emergencyContactName: document
        .getElementById("emergencyContactName")
        .value.trim(),

      relationship: document.getElementById("relationship").value,

      emergencyContactPhone: emergencyPhoneNumber,

      hasMedicalConditions: hasMedicalConditions.value === "true",

      medicalConditions: medicalConditions.value.trim(),

      isOnMedication:
        document.getElementById("isOnMedication").value === "true",

      bloodGroup: document.getElementById("bloodGroup").value,

      allergies: document.getElementById("allergies").value.trim(),

      voluntaryParticipation: document.getElementById("voluntaryParticipation")
        .checked,

      medicalDisclosure: document.getElementById("medicalDisclosure").checked,

      liabilityAcknowledgement: document.getElementById(
        "liabilityAcknowledgement",
      ).checked,

      photographyConsent: document.getElementById("photographyConsent").checked,

      safetyAgreement: document.getElementById("safetyAgreement").checked,

      termsAgreement: termsAgreement.checked,

      signature: signature,
    };

    // =========================
    // SEND TO BACKEND
    // =========================

    try {
      const response = await fetch("/api/participants/register", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Registration failed. Please try again.");

        return;
      }

      // =========================
      // SHOW SUCCESS SECTION
      // =========================

      // Put the actual registration number from the backend
      registrationNumber.textContent = data.registrationNumber;

      // Hide the registration form
      form.style.display = "none";

      // Show the success section
      successSection.style.display = "block";
    } catch (error) {
      console.error("Registration error:", error);

      alert(
        "We could not connect to the registration server. Please try again.",
      );
    }
  });

  // =========================
  // CONTINUE TO PAYMENT
  // =========================

  continueToPaymentButton.addEventListener("click", function () {
    // Hide success section
    successSection.style.display = "none";

    // Show payment section
    paymentSection.style.display = "block";

    // Pass the Seeker ID to the payment section
    paymentSeekerId.textContent = registrationNumber.textContent;
  });

  // =========================
  // INITIALIZE PAYMENT
  // =========================

  payNowButton.addEventListener("click", async function () {
    const seekerId = registrationNumber.textContent.trim();

    if (!seekerId) {
      alert("Your Seeker ID could not be found. Please try again.");
      return;
    }

    try {
      payNowButton.disabled = true;
      payNowButton.textContent = "Connecting to payment...";

      const response = await fetch(`/api/payments/initialize/${seekerId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message || "Could not initialize payment. Please try again.",
        );

        payNowButton.disabled = false;
        payNowButton.textContent = "Pay Registration Fee";

        return;
      }

      // Send seeker to Paystack
      window.location.href = data.authorizationUrl;
    } catch (error) {
      console.error("Payment initialization error:", error);

      alert("We could not connect to the payment server. Please try again.");

      payNowButton.disabled = false;
      payNowButton.textContent = "Pay Registration Fee";
    }
  });
});
