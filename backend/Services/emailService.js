const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const emailProvider = process.env.EMAIL_PROVIDER || "gmail";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendTicketEmail = async (
  to,
  fullName,
  age,
  registrationNumber,
  qrCodeDataUrl,
) => {
  try {
    // Remove the beginning of the QR code data URL
    const qrCodeBase64 = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");

    // Location of the REGNUM DEI logo
    const logoPath = path.join(
      __dirname,
      "..",
      "Assets",
      "regnum-dei-logo.png",
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,

      subject: "Your REGNUM DEI Entry Ticket — Welcome to the Kingdom",

      html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">

                    <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1.0"
                    >

                    <title>REGNUM DEI Ticket</title>
                </head>

                <body
                    style="
                        margin: 0;
                        padding: 0;
                        background-color: #f3f1eb;
                        font-family: Arial, Helvetica, sans-serif;
                        color: #171717;
                    "
                >

                    <!-- Main Wrapper -->
                    <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        style="
                            background-color: #f3f1eb;
                            padding: 30px 10px;
                        "
                    >
                        <tr>
                            <td align="center">

                                <!-- Email Container -->
                                <table
                                    width="600"
                                    cellpadding="0"
                                    cellspacing="0"
                                    border="0"
                                    style="
                                        max-width: 600px;
                                        width: 100%;
                                        background-color: #ffffff;
                                        border: 1px solid #ded8c8;
                                    "
                                >

                                    <!-- GOLD TOP LINE -->
                                    <tr>
                                        <td
                                            style="
                                                height: 6px;
                                                background-color: #c9a227;
                                                font-size: 0;
                                                line-height: 0;
                                            "
                                        >
                                        </td>
                                    </tr>


                                    <!-- HEADER -->
                                    <tr>
                                        <td
                                            align="center"
                                            style="
                                                background-color: #0b0b0b;
                                                padding: 35px 25px 30px;
                                            "
                                        >

                                            <!-- Logo -->
                                            <img
                                                src="cid:regnumdeilogo"
                                                alt="REGNUM DEI"
                                                width="170"
                                                style="
                                                    display: block;
                                                    width: 170px;
                                                    max-width: 170px;
                                                    height: auto;
                                                    margin: 0 auto 18px;
                                                "
                                            >

                                            <div
                                                style="
                                                    color: #d4af37;
                                                    font-size: 12px;
                                                    font-weight: bold;
                                                    letter-spacing: 4px;
                                                    text-transform: uppercase;
                                                "
                                            >
                                                REGNUM DEI
                                            </div>

                                            <div
                                                style="
                                                    color: #ffffff;
                                                    font-size: 12px;
                                                    letter-spacing: 2px;
                                                    margin-top: 8px;
                                                    text-transform: uppercase;
                                                "
                                            >
                                                The Kingdom of God
                                            </div>

                                        </td>
                                    </tr>


                                    <!-- WELCOME -->
                                    <tr>
                                        <td
                                            style="
                                                padding: 42px 45px 25px;
                                            "
                                        >

                                            <div
                                                style="
                                                    color: #c9a227;
                                                    font-size: 12px;
                                                    font-weight: bold;
                                                    letter-spacing: 3px;
                                                    text-transform: uppercase;
                                                    margin-bottom: 12px;
                                                "
                                            >
                                                SEEKER ADMISSION
                                            </div>

                                            <h1
                                                style="
                                                    margin: 0 0 18px;
                                                    font-size: 30px;
                                                    line-height: 1.2;
                                                    color: #111111;
                                                "
                                            >
                                                Welcome to the Kingdom.
                                            </h1>

                                            <p
                                                style="
                                                    margin: 0 0 16px;
                                                    font-size: 15px;
                                                    line-height: 1.7;
                                                    color: #444444;
                                                "
                                            >
                                                Dear
                                                <strong>${fullName}</strong>,
                                            </p>

                                            <p
                                                style="
                                                    margin: 0;
                                                    font-size: 15px;
                                                    line-height: 1.7;
                                                    color: #444444;
                                                "
                                            >
                                                Your journey into
                                                <strong>REGNUM DEI</strong>
                                                has begun.
                                            </p>

                                        </td>
                                    </tr>


                                    <!-- GOLD DIVIDER -->
                                    <tr>
                                        <td style="padding: 0 45px;">
                                            <div
                                                style="
                                                    height: 1px;
                                                    background-color: #ded8c8;
                                                "
                                            >
                                            </div>
                                        </td>
                                    </tr>


                                    <!-- SEEKER DETAILS -->
                                    <tr>
                                        <td
                                            style="
                                                padding: 30px 45px;
                                            "
                                        >

                                            <h2
                                                style="
                                                    margin: 0 0 20px;
                                                    font-size: 18px;
                                                    color: #111111;
                                                "
                                            >
                                                Your Seeker Details
                                            </h2>

                                            <table
                                                width="100%"
                                                cellpadding="0"
                                                cellspacing="0"
                                                border="0"
                                            >

                                                <tr>
                                                    <td
                                                        style="
                                                            padding: 10px 0;
                                                            color: #777777;
                                                            font-size: 13px;
                                                        "
                                                    >
                                                        NAME
                                                    </td>

                                                    <td
                                                        align="right"
                                                        style="
                                                            padding: 10px 0;
                                                            color: #111111;
                                                            font-size: 14px;
                                                            font-weight: bold;
                                                        "
                                                    >
                                                        ${fullName}
                                                    </td>
                                                </tr>

                                                <tr>
                                                    <td
                                                        style="
                                                            padding: 10px 0;
                                                            color: #777777;
                                                            font-size: 13px;
                                                        "
                                                    >
                                                        AGE
                                                    </td>

                                                    <td
                                                        align="right"
                                                        style="
                                                            padding: 10px 0;
                                                            color: #111111;
                                                            font-size: 14px;
                                                            font-weight: bold;
                                                        "
                                                    >
                                                        ${age}
                                                    </td>
                                                </tr>

                                                <tr>
                                                    <td
                                                        style="
                                                            padding: 10px 0;
                                                            color: #777777;
                                                            font-size: 13px;
                                                        "
                                                    >
                                                         SEEKER ID
                                                    </td>

                                                    <td
                                                        align="right"
                                                        style="
                                                            padding: 10px 0;
                                                            color: #c9a227;
                                                            font-size: 14px;
                                                            font-weight: bold;
                                                        "
                                                    >
                                                        ${registrationNumber}
                                                    </td>
                                                </tr>

                                            </table>

                                        </td>
                                    </tr>


                                    <!-- TICKET SECTION -->
                                    <tr>
                                        <td
                                            style="
                                                padding: 0 25px 35px;
                                            "
                                        >

                                            <table
                                                width="100%"
                                                cellpadding="0"
                                                cellspacing="0"
                                                border="0"
                                                style="
                                                    background-color: #0b0b0b;
                                                    border: 2px solid #c9a227;
                                                "
                                            >

                                                <tr>
                                                    <td
                                                        align="center"
                                                        style="
                                                            padding: 30px 20px 10px;
                                                        "
                                                    >

                                                        <div
                                                            style="
                                                                color: #d4af37;
                                                                font-size: 11px;
                                                                font-weight: bold;
                                                                letter-spacing: 3px;
                                                                text-transform: uppercase;
                                                                margin-bottom: 8px;
                                                            "
                                                        >
                                                            YOUR ENTRY TICKET
                                                        </div>

                                                        <h2
                                                            style="
                                                                margin: 0;
                                                                color: #ffffff;
                                                                font-size: 24px;
                                                            "
                                                        >
                                                            Your Key to the Kingdom
                                                        </h2>

                                                    </td>
                                                </tr>


                                                <!-- OFFICIAL TICKET / QR CODE -->
<tr>
    <td
        align="center"
        style="
            padding: 25px 20px 30px;
        "
    >

        <!-- QR TICKET FRAME -->
        <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="
                max-width: 420px;
                background-color: #ffffff;
                border: 1px solid #c9a227;
            "
        >

            <!-- TICKET HEADER -->
            <tr>
                <td
                    align="center"
                    style="
                        background-color: #111111;
                        padding: 14px 15px;
                        border-bottom: 4px solid #c9a227;
                    "
                >
                    <div
                        style="
                            color: #d4af37;
                            font-size: 10px;
                            font-weight: bold;
                            letter-spacing: 3px;
                            text-transform: uppercase;
                        "
                    >
                        OFFICIAL SEEKER ADMISSION
                    </div>
                </td>
            </tr>

            <!-- QR CODE -->
            <tr>
                <td
                    align="center"
                    style="
                        padding: 25px 20px 18px;
                        background-color: #ffffff;
                    "
                >

                    <!--
                        Keep this white space clean.
                        It protects QR scannability.
                    -->
                    <table
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        style="
                            background-color: #ffffff;
                            border: 1px solid #eeeeee;
                            padding: 14px;
                        "
                    >
                        <tr>
                            <td>
                                <img
                                    src="cid:regnumdeiticket"
                                    alt="REGNUM DEI Entry Ticket QR Code"
                                    width="240"
                                    style="
                                        display: block;
                                        width: 240px;
                                        max-width: 100%;
                                        height: auto;
                                    "
                                >
                            </td>
                        </tr>
                    </table>

                </td>
            </tr>

            <!-- SEEKER ID -->
            <tr>
                <td
                    align="center"
                    style="
                        padding: 5px 20px 22px;
                        background-color: #ffffff;
                    "
                >

                    <div
                        style="
                            color: #888888;
                            font-size: 10px;
                            font-weight: bold;
                            letter-spacing: 2px;
                            text-transform: uppercase;
                            margin-bottom: 6px;
                        "
                    >
                        SEEKER ID
                    </div>

                    <div
                        style="
                            color: #111111;
                            font-size: 20px;
                            font-weight: bold;
                            letter-spacing: 2px;
                        "
                    >
                        ${registrationNumber}
                    </div>

                </td>
            </tr>

            <!-- TICKET INSTRUCTION -->
            <tr>
                <td
                    align="center"
                    style="
                        background-color: #f8f6ef;
                        border-top: 1px solid #ded8c8;
                        padding: 16px 20px;
                    "
                >

                    <div
                        style="
                            color: #111111;
                            font-size: 11px;
                            font-weight: bold;
                            letter-spacing: 1px;
                            text-transform: uppercase;
                        "
                    >
                        PRESENT THIS TICKET AT ENTRY
                    </div>

                    <div
                        style="
                            margin-top: 6px;
                            color: #b88a00;
                            font-size: 11px;
                            font-weight: bold;
                            letter-spacing: 1px;
                        "
                    >
                        THIS TICKET CAN ONLY BE USED ONCE
                    </div>

                </td>
            </tr>

        </table>

    </td>
</tr>

                                    <!-- COMMUNITY -->
                                    <tr>
                                        <td
                                            align="center"
                                            style="
                                                padding: 35px 45px;
                                                background-color: #faf9f5;
                                            "
                                        >

                                            <div
                                                style="
                                                    color: #c9a227;
                                                    font-size: 11px;
                                                    font-weight: bold;
                                                    letter-spacing: 3px;
                                                    text-transform: uppercase;
                                                    margin-bottom: 10px;
                                                "
                                            >
                                                STAY CONNECTED
                                            </div>

                                            <h2
                                                style="
                                                    margin: 0 0 12px;
                                                    font-size: 22px;
                                                    color: #111111;
                                                "
                                            >
                                                Join the Kingdom
                                            </h2>

                                            <p
                                                style="
                                                    margin: 0 auto 22px;
                                                    max-width: 440px;
                                                    font-size: 14px;
                                                    line-height: 1.7;
                                                    color: #555555;
                                                "
                                            >
                                                Your journey doesn't end here.
                                                Join the REGNUM DEI community
                                                and stay connected with the
                                                other seekers.
                                            </p>
                                            <p
    style="
        margin: 0 auto 18px;
        max-width: 440px;
        font-size: 12px;
        line-height: 1.7;
        color: #b88a00;
        font-weight: bold;
        letter-spacing: 1px;
    "
>
    COMPETITIONS &nbsp; • &nbsp; GAMES &nbsp; • &nbsp; CHALLENGES &nbsp; • &nbsp; CLUES
</p>

<p
    style="
        margin: 0 auto 22px;
        max-width: 440px;
        font-size: 14px;
        line-height: 1.7;
        color: #555555;
    "
>
    Get ready for competitions, games, challenges, clues,
    and other exciting activities on the community platform
    leading up to the main hunt.
</p>

                                            <a
                                                href="${process.env.WHATSAPP_GROUP_LINK}"
                                                style="
                                                    display: inline-block;
                                                    background-color: #c9a227;
                                                    color: #111111;
                                                    padding: 14px 28px;
                                                    text-decoration: none;
                                                    font-size: 12px;
                                                    font-weight: bold;
                                                    letter-spacing: 1px;
                                                    text-transform: uppercase;
                                                "
                                            >
                                                ENTER THE COMMUNITY
                                            </a>

                                        </td>
                                    </tr>


                                    <!-- FOOTER -->
                                    <tr>
                                        <td
                                            align="center"
                                            style="
                                                background-color: #0b0b0b;
                                                padding: 28px 25px;
                                            "
                                        >

                                            <img
                                                src="cid:regnumdeilogo"
                                                alt="REGNUM DEI"
                                                width="55"
                                                style="
                                                    display: block;
                                                    width: 55px;
                                                    height: auto;
                                                    margin: 0 auto 12px;
                                                "
                                            >

                                            <div
                                                style="
                                                    color: #d4af37;
                                                    font-size: 12px;
                                                    font-weight: bold;
                                                    letter-spacing: 2px;
                                                "
                                            >
                                                REGNUM DEI
                                            </div>

                                            <div
                                                style="
                                                    color: #aaaaaa;
                                                    font-size: 11px;
                                                    margin-top: 7px;
                                                "
                                            >
                                                Welcome to the Kingdom.
                                            </div>

                                        </td>
                                    </tr>


                                    <!-- GOLD BOTTOM LINE -->
                                    <tr>
                                        <td
                                            style="
                                                height: 6px;
                                                background-color: #c9a227;
                                                font-size: 0;
                                                line-height: 0;
                                            "
                                        >
                                        </td>
                                    </tr>

                                </table>

                            </td>
                        </tr>
                    </table>

                </body>
                </html>
            `,

      attachments: [
        // QR Code
        {
          filename: "regnum-dei-ticket.png",
          content: qrCodeBase64,
          encoding: "base64",
          cid: "regnumdeiticket",
        },

        // REGNUM DEI Logo
        {
          filename: "regnum-dei-logo.png",
          path: logoPath,
          cid: "regnumdeilogo",
        },
      ],
    };

    if (emailProvider === "resend") {
      const { data, error } = await resend.emails.send({
        from: "REGNUM DEI <onboarding@resend.dev>",
        to: [to],
        subject: mailOptions.subject,
        html: mailOptions.html,
        attachments: [
          {
            filename: "regnum-dei-ticket.png",
            content: qrCodeBase64,
            content_id: "regnumdeiticket",
          },
          {
            filename: "regnum-dei-logo.png",
            content: fs.readFileSync(logoPath).toString("base64"),
            content_id: "regnumdeilogo",
          },
        ],
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log("Ticket email sent successfully through Resend:", data.id);
    } else {
      await transporter.sendMail(mailOptions);
      console.log("Ticket email sent successfully through Gmail:", to);
    }
  } catch (error) {
    console.error("Ticket email sending error:", error);
    throw error;
  }
};

const sendEmailVerificationCode = async (to, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Verify Your Email — REGNUM DEI",
    html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>REGNUM DEI Email Verification</h2>
                <p>Use the code below to verify your email address:</p>
                <h1 style="letter-spacing: 8px; color: #c9a227;">
                    ${code}
                </h1>
                <p>This code expires in 10 minutes.</p>
                <p>If you did not request this code, ignore this email.</p>
            </div>
        `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendTicketEmail,
  sendEmailVerificationCode,
};
