import nodemailer from "nodemailer";
import config from "../config/config.js";



const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: config.GOOGLE_USER,
        pass: config.GOOGLE_PASS
    },

    tls: {
        rejectUnauthorized: false
    }
});


transporter.verify()
.then(()=>{
    console.log("Email Transporter is ready to Send Email");
})
.catch((error)=>{
    console.error("Email Transporter Verification Failed "+ error);
})

export async function sendOTP(email, otp) {
  try {
    console.log(`[EMAIL_SERVICE] Sending OTP to ${email}`);

    await transporter.sendMail({
      from: config.GOOGLE_USER,
      to: email,
      subject: "Verify your account",
      html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">

        <div style="max-width:500px; margin:auto; background:white; padding:30px; border-radius:10px; text-align:center;">

          <h2 style="color:#333;">Verify Your Account</h2>

          <p style="color:#666; font-size:14px;">
            Use the OTP below to complete your registration.
          </p>

          <div style="margin:30px 0;">
            <span style="
              display:inline-block;
              font-size:28px;
              letter-spacing:8px;
              font-weight:bold;
              color:#2d89ff;
              background:#f1f5ff;
              padding:12px 20px;
              border-radius:8px;
            ">
              ${otp}
            </span>
          </div>

          <p style="color:#999; font-size:12px;">
            This OTP is valid for 5 minutes.
          </p>

          <hr style="margin:20px 0; border:none; border-top:1px solid #eee;" />

          <p style="color:#aaa; font-size:11px;">
            If you didn’t request this, you can safely ignore this email.
          </p>

        </div>
      </div>
      `
    });

  } catch (error) {
    console.error("Error sending OTP " + error);
  }
}