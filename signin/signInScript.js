function validateUser() {
    var email = document.getElementById("emailInput").value;
    var errorMessage = document.getElementById("errorMessage");
    var passwordInput = document.getElementById("passwordInput");
    var signInButton = document.getElementById("signInButton");
    var nextButton = document.getElementById("nextcta");

    // Make an AJAX request to validate the user using the provided endpoint
    fetch("http://localhost:8080/validateUser", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "email": email })
    })
    .then(response => {
        if (response.status === 200) {
            // User is validated, show the password field and "Sign in" button
            passwordInput.style.display = "block";
            signInButton.style.display = "block";
            errorMessage.style.display = "none"; // Hide the error message
            nextButton.style.display = "none"; // Hide the "Next" button
        } else if (response.status === 401) {
            // Unauthorized status, display an error message
            errorMessage.textContent = "Invalid email. Please try again.";
            errorMessage.style.display = "block";
            passwordInput.style.display = "none"; // Hide the password field
            signInButton.style.display = "none"; // Hide the "Sign in" button
            nextButton.style.display = "block"; // Show the "Next" button
        } else {
            // Handle other response statuses as needed
            errorMessage.textContent = "An error occurred. Please try again later.";
            errorMessage.style.display = "block";
            passwordInput.style.display = "none"; // Hide the password field
            signInButton.style.display = "none"; // Hide the "Sign in" button
            nextButton.style.display = "block"; // Show the "Next" button
        }
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

function signIn() {
    var email = document.getElementById("emailInput").value;
    var password = document.getElementById("passwordInput").value;

    var data = {
        "email": email, // Assuming you use "username" for email in your Go code
        "password": password
    };

    // Make an AJAX request to your Go login endpoint
    fetch("http://localhost:8080/login", { // Use the correct URL
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        // Handle the response from your Go backend here
        console.log(data); // You can replace this with your custom logic
    })
    .catch(error => {
        console.error("Error:", error);
    });
}
