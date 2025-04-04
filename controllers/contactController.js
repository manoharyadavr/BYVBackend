import Contact from "../models/Contact.js";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

// Load Google Service Account Key
const KEYFILEPATH = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// Authenticate with Google Sheets using a service account
const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
console.log("Loaded Google Sheet ID:", SHEET_ID);

export const submitContactForm = async (req, res) => {
    console.log("Request received at /api/contact", req.body); // ✅ Log input
  try {
      
    const { name, email, contactNumber, message } = req.body;

    // Validate required fields
    if (!name || !email || !contactNumber || !message) {
      return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    // Save to MongoDB
    const newContact = new Contact({ name, email, contactNumber, message });
    await newContact.save();

    // Send Emails
    await sendEmails(name, email, contactNumber, message);

    // Store in Google Sheets
    await saveToGoogleSheets(name, email, contactNumber, message);

    res.status(201).json({ success: true, message: "Contact form submitted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Send emails to user and owner
const sendEmails = async (name, email, contactNumber, message) => {
  try {
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Passwords instead of actual password
      },
    });

    // Email options for user confirmation
    const userMailOptions = {
      from: `"BYV Team" <${process.env.EMAIL_USER}>`,
      to: email, // Ensure this is correctly set
      subject: "Submission Successful - BYV",
      text: `Hi ${name},\n\nThank you for reaching out! We'll get back to you soon.\n\nBest Regards,\nBYV Team`,
      replyTo: process.env.EMAIL_USER, // Helps prevent spam filters from blocking the email
    };

    // Email options for owner notification
    const ownerMailOptions = {
      from: `"BYV Team" <${process.env.EMAIL_USER}>`,
      to: process.env.OWNER_EMAIL,
      subject: "New Lead - BYV",
      text: `New contact form submission:\n\nName: ${name}\nEmail: ${email}\nContact Number: ${contactNumber}\nMessage: ${message}`,
    };

    // Send both emails
    await transport.sendMail(userMailOptions);
    await transport.sendMail(ownerMailOptions);

    console.log("Emails sent successfully!");

  } catch (error) {
    console.error("Email Error:", error);
  }
};

// Save to Google Sheets
const saveToGoogleSheets = async (name, email, contactNumber, message) => {
  try {
    const sheets = google.sheets({ version: "v4", auth });
    const data = [[name, email, contactNumber, message, new Date().toISOString()]]; // Added contactNumber

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:E", // Updated to include column E
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: { values: data },
    });

    console.log("Data saved to Google Sheets successfully!");
  } catch (error) {
    console.error("Google Sheets Error:", error);
  }
};
