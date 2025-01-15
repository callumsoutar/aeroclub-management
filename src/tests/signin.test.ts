async function testSignIn() {
  try {
    console.log("Starting sign-in test...");

    // First, get the CSRF token
    const csrfResponse = await fetch("http://localhost:3000/api/auth/csrf");
    const { csrfToken } = await csrfResponse.json();

    // Then attempt to sign in
    const response = await fetch("http://localhost:3000/api/auth/signin/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        redirect: false,
        csrfToken,
      }),
    });

    const data = await response.json();

    console.log("Status:", response.status);
    console.log("Response:", data);

    if (!response.ok) {
      throw new Error(`Sign-in failed: ${data.error}`);
    }

    console.log("Sign-in successful!");
    if (data.url) {
      console.log("Redirect URL:", data.url);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testSignIn(); 