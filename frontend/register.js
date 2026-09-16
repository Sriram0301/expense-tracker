const API_URL = "http://127.0.0.1:8000";

const registerButton = document.getElementById("register-btn");

registerButton.addEventListener("click", registerUser);


async function registerUser() {

    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    const message = document.getElementById("register-message");


    // Check empty fields
    if (!name || !email || !password) {

        message.textContent =
            "Please fill all fields.";

        return;
    }


    // Check password length
    if (password.length < 6) {

        message.textContent =
            "Password must contain at least 6 characters.";

        return;
    }


    const userData = {
        name: name,
        email: email,
        password: password
    };


    try {

        const response = await fetch(`${API_URL}/register`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(userData)

        });


        const data = await response.json();


        if (!response.ok) {

            message.textContent =
                data.detail || "Registration failed.";

            return;
        }


        message.textContent =
            "Registration successful! ✅";


        // Clear the form
        document.getElementById("register-name").value = "";
        document.getElementById("register-email").value = "";
        document.getElementById("register-password").value = "";


        // Go to login page
        setTimeout(function () {

            window.location.href = "login.html";

        }, 1000);


    } catch (error) {

        console.error("Registration error:", error);

        message.textContent =
            "Unable to connect to server.";

    }
}