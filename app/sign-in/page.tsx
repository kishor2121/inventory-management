"use client"; // needed for useState

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./login.css";
import router from "next/router";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter(); //

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // call login API
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

  //   const data = await res.json();
  //   if (res.ok) {
  //     alert("Login successful! Token: " + data.token);
  //   } else {
  //     alert("Login failed: " + data.message);
  //   }
  // };

    const data = await res.json();
     if (res.ok) {
      router.push("/home"); // ✅ Safe to use now
    } else {
      alert("Login failed: " + data.message);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">⚙️</div>
        <h2>Welcome Back!</h2>
        <p>Please sign in to access your account.</p>

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
        />

        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}
