const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

const loadStore = {
  "test123": { email: process.env.EMAIL_USER || "your@email.com" } // sample for test
};

app.post("/register-load", express.json(), (req, res) => {
  const { loadNumber, email } = req.body;
  if (!loadNumber || !email) return res.status(400).send("Missing load number or email.");
  loadStore[loadNumber] = { email };
  res.status(200).send("Load registered successfully.");
});

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Flikdrop Upload</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        function autoSubmit(input) {
          if (input.files.length > 0) {
            document.getElementById('uploadForm').submit();
          }
        }
      </script>
    </head>
    <body class="bg-gray-100 font-sans">
      <div class="min-h-screen flex items-center justify-center px-4">
        <div class="bg-white rounded-3xl shadow-lg max-w-md w-full text-center p-6">
          <div class="bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-2xl p-6 mb-6">
            <h1 class="text-2xl font-bold mb-1">You completed the load!</h1>
            <p class="text-sm opacity-80">Now drop the Flik ⬇️</p>
          </div>
          <form id="uploadForm" action="/upload/${loadNumber}" method="POST" enctype="multipart/form-data">
            <label for="bolImage" class="block text-lg font-medium text-gray-700 mb-2">ADD POD</label>
            <input type="file" id="bolImage" name="bolImage" accept="image/*" capture="environment" onchange="autoSubmit(this)" class="block w-full text-center bg-blue-50 p-4 rounded-xl shadow-inner border-2 border-dashed border-blue-300 cursor-pointer hover:bg-blue-100" required>
          </form>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.post("/upload/:loadNumber", upload.single("bolImage"), async (req, res) => {
  const loadNumber = req.params.loadNumber;
  const entry = loadStore[loadNumber];

  if (!entry) return res.status(404).send("Invalid load number.");

  const filePath = req.file.path;
  const originalName = req.file.originalname;

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: `"Flikdrop" <${process.env.EMAIL_USER}>`,
      to: entry.email,
      subject: `POD for Load ${loadNumber}`,
      text: `Attached is the signed POD for Load ${loadNumber}.`,
      attachments: [{ filename: originalName, path: filePath }]
    });

    fs.unlinkSync(filePath);

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Success</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-green-50 font-sans flex items-center justify-center min-h-screen px-4">
        <div class="bg-white rounded-3xl shadow-xl p-6 max-w-md text-center">
          <div class="bg-green-100 p-4 rounded-full inline-block mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-green-700 mb-2">✅ POD Submitted</h1>
          <p class="text-gray-700 mb-4">Your signed BOL for load <strong>${loadNumber}</strong> has been sent successfully.</p>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("❌ EMAIL FAILED:", err);
    res.status(500).send("Upload failed.");
  }
});

app.post("/register-load", express.json(), (req, res) => {
  const { loadNumber, email } = req.body;

  if (!loadNumber || !email) {
    return res.status(400).send("Missing load number or email.");
  }

  loadStore[loadNumber] = { email };
  res.status(200).send("Load registered successfully.");
});

app.listen(3000, () => {
  console.log("Flikdrop DRIVER server running on port 3000");
});
app.get("/", (req, res) => {
  res.send("Flikdrop Driver Upload Service is Live 🚚📸");
});
