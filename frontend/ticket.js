const saveTicketButton = document.getElementById("saveTicketButton");

document.addEventListener("DOMContentLoaded", async function () {
  // Get Seeker ID from the URL
  const urlParams = new URLSearchParams(window.location.search);

  const registrationNumber = urlParams.get("regNumber");

  // Check if Seeker ID exists
  if (!registrationNumber) {
    alert("No Seeker ID was provided.");

    return;
  }

  try {
    // Request ticket information from backend
    const response = await fetch(`/api/tickets/${registrationNumber}`);

    const data = await response.json();

    // Check for errors
    if (!response.ok) {
      alert(data.message || "Could not retrieve your ticket.");

      return;
    }

    // Display Seeker ID
    document.getElementById("ticketRegistrationNumber").textContent =
      data.registrationNumber;

    // Display participant name
    document.getElementById("ticketFullName").textContent = data.fullName;

    // Generate QR code
    new QRCode(document.getElementById("qrCode"), {
      text: data.ticketToken,
      width: 200,
      height: 200,
    });

    // We'll use data.ticketToken
    // for the QR code in the next step

    console.log("Ticket data:", data);
  } catch (error) {
    console.error("Ticket loading error:", error);

    alert("We could not connect to the ticket server.");
  }

  // =========================
  // SAVE TICKET
  // =========================

  saveTicketButton.addEventListener("click", function () {
    window.print();
  });
});
