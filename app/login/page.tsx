"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");

  const [phoneNumber, setPhoneNumber] = useState("");

  const [generatedCode, setGeneratedCode] = useState("");

  const [otpInput, setOtpInput] = useState(["", "", "", "", "", ""]);

  const handleSendCode = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (phoneNumber.length < 10) {
      alert("Please enter a valid phone number");
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    setGeneratedCode(code);

    setStep("OTP");

    alert(`DEMO SMS: Your code is ${ code }`);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otpInput];

    newOtp[index] = value;

    setOtpInput(newOtp);

    const joinedCode = newOtp.join("");
    if (joinedCode.length === 6) {
      if (joinedCode === generatedCode) {
        router.push("/dashboard");
      } else {
        if (newOtp.every(digit => digit !== "")) {
          alert("Wrong code, try again.");
	}
      }
    }
  };

  const handleBack = () => {
    setStep("PHONE");
    setOtpInput(["", "", "", "", "", ""]);
    setGeneratedCode("");
  }

  return (
    <div style={{ padding: "50px", fontFamily: "sans-serif" }}>
      {step === "PHONE" && (
        <form onSubmit={ handleSendCode }>
          <h2>Enter Mobile Number</h2>
	  <input
            type="tel"
	    placeholder="Ex: 555-123-4567"
	    value={phoneNumber}
	    onChange={(e) => setPhoneNumber(e.target.value)} 
	    style={{ padding: "10px", fontSize: "16px" }}
	  />
	  <br />
	  <button type="submit" style={{ marginTop: "10px", padding: "10px 20px" }}>
            Get Code
	  </button>
	</form>
      )}

      {step === "OTP" && (
        <div>
          <p>
            A 6-digit code has been sent to the phone number ending in{" "}
	    <strong>{phoneNumber.slice(-3)}</strong>
	  </p>

	  <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {otpInput.map((digit, index) => (
	      <input key={index} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} style={{ width: "40px", height: "40px", textAlign: "center", fontSize: "20px" }} 
	      />
	    ))}
	  </div>

	  <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleBack}>
              🔙 Back
	    </button>
	    <button onClick={() => alert(`Reminder: Code is ${generatedCode}`)}>
              Resend Code
	    </button>
	  </div>
	</div>
      )}
    </div>
  );
}
