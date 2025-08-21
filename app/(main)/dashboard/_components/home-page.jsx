"use client";

import { useState } from "react";
import { sendEmail } from "@/actions/send-email";

export function HomePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSend() {
    setLoading(true);
    const res = await sendEmail({
      to: "you@example.com",
      subject: "Hello from Finance App",
      react: <p>This is a test email.</p>,
    });
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleSend}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? "Sending..." : "Send Email"}
      </button>

      {result && (
        <pre className="mt-2 bg-gray-100 p-2 rounded text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
