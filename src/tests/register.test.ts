async function testRegistration() {
  try {
    console.log("Starting registration test...");

    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        organizationName: "Test Aero Club",
      }),
    });

    const data = await response.json();

    console.log("Status:", response.status);
    console.log("Response:", data);

    if (!response.ok) {
      throw new Error(`Registration failed: ${data.error}`);
    }

    console.log("Registration successful!");
    console.log("User ID:", data.userId);
    console.log("Organization ID:", data.organizationId);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testRegistration(); 