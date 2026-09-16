const API_URL = "http://127.0.0.1:8000";

const loginButton = document.getElementById("login-btn");

loginButton.addEventListener("click", login);


async function login() {

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const message = document.getElementById("login-message");

    if (!email || !password) {
        message.textContent = "Please enter email and password.";
        return;
    }

    const loginData = {
        email: email,
        password: password
    };

    try {

        const response = await fetch(`${API_URL}/login`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(loginData)

        });

        const data = await response.json();

        if (!response.ok) {

            message.textContent =
                data.detail || "Login failed.";

            return;
        }

        // Save JWT token
        localStorage.setItem(
            "access_token",
            data.access_token
        );

        message.textContent =
            "Login successful! ";

        // Go to dashboard
        window.location.href = "index.html";

    } catch (error) {

        console.error("Login error:", error);

        message.textContent =
            "Unable to connect to server.";
    }
}
const logoutButton = document.getElementById("logout-btn");

logoutButton.addEventListener("click", logout);


function logout() {

    localStorage.removeItem("access_token");

    window.location.href = "login.html";
}       