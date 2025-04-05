import Contact from "../models/Contact.js";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

// Constants from .env
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const OWNER_EMAIL = process.env.OWNER_EMAIL;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// Authenticate using raw credentials from env
const auth = new google.auth.JWT(
  GOOGLE_CLIENT_EMAIL,
  null,
  GOOGLE_PRIVATE_KEY,
  SCOPES
);

// 🌐 Main Contact Form Handler
export const submitContactForm = async (req, res) => {
  try {
    const { name, email, contactNumber, message } = req.body;

    if (!name || !email || !contactNumber || !message) {
      return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    const newContact = new Contact({ name, email, contactNumber, message });
    await newContact.save();

    await sendEmails({ name, email, contactNumber, message });
    await saveToGoogleSheets({ name, email, contactNumber, message });

    return res.status(201).json({ success: true, message: "Contact form submitted successfully!" });
  } catch (error) {
    console.error("Form Submission Error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
  }
};

// 📩 Email Notification Handler
const sendEmails = async ({ name, email, contactNumber, message }) => {
  try {
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const userMailOptions = {
      from: `"BYV Team" <${EMAIL_USER}>`,
      to: email,
      subject: "Submission Successful - BYV",
      text: `Hi ${name},\n\nThank you for reaching out! We'll get back to you soon.\n\nBest Regards,\nBYV Team`,
      replyTo: EMAIL_USER,
    };

    const ownerMailOptions = {
      from: `"BYV Team" <${EMAIL_USER}>`,
      to: OWNER_EMAIL,
      subject: "New Lead - BYV",
      text: `New contact form submission:\n\nName: ${name}\nEmail: ${email}\nContact Number: ${contactNumber}\nMessage: ${message}`,
    };

    await Promise.all([
      transport.sendMail(userMailOptions),
      transport.sendMail(ownerMailOptions),
    ]);

    console.log("✅ Emails sent successfully");
  } catch (error) {
    console.error("❌ Email Sending Error:", error);
  }
};

// 📊 Google Sheets Storage Handler
const saveToGoogleSheets = async ({ name, email, contactNumber, message }) => {
  try {
    const sheets = google.sheets({ version: "v4", auth });
    const timestamp = new Date().toISOString();
    const rowData = [[name, email, contactNumber, message, timestamp]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:E",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: { values: rowData },
    });

    console.log("✅ Data saved to Google Sheets successfully");
  } catch (error) {
    console.error("❌ Google Sheets Error:", error);
  }
};
