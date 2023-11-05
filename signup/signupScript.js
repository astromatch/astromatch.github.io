// Define a variable to store the user's email
var userEmail = "";

function signupUser() {
    var name = document.getElementById("nameInput").value;
    var dob = document.getElementById("dobInput").value;
    var email = document.getElementById("emailInput").value; // Store the email in the variable
    var password = document.getElementById("passwordInput").value;
    var mobile = document.getElementById("mobileInput").value;
    var username = document.getElementById("usernameInput").value;
    var submitCta = document.getElementById("submitcta")
    var errorMessage = document.getElementById("errorMessage");

    // Make an AJAX request to sign up the user using the provided endpoint
    fetch("http://localhost:8080/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "name": name, "dob": dob, "email": email, "password": password, "mobile" : mobile, "username" : username })
    })
    .then(response => {
        if (response.status === 200) {
            // User is signed up successfully
            userEmail = email; // Store the email
            submitCta.style.display = "none"; //Hide the submit Button
            errorMessage.style.display = "none"; // Hide the error message
            document.getElementById("successMessage").style.display = "block"; // Show success message
            document.getElementById("otpContainer").style.display = "block"; // Show OTP input and Verify OTP button
        }
        // Handle other response statuses as needed
        else if (response.status == 409) {
            // Email already exists
            response.text().then(data => {
                errorMessage.innerHTML = data;
                errorMessage.style.display = "block";
            });
        } else {
            // Handle other response statuses as needed
            errorMessage.textContent = "An error occurred. Please try again later.";
            errorMessage.style.display = "block";
        }
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

function verifyOtp() {
    var otp = document.getElementById("otpInput").value;
    var errorMessage = document.getElementById("errorMessage");

    // Make an AJAX request to verify the user with the provided OTP and stored email
    fetch("http://localhost:8080/verifyuser", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": "session-name=MTY5ODY4ODI4OHxEWDhFQVFMX2dBQUJFQUVRQUFBX180QUFBUVp6ZEHk9LamdnZy5nb3YubWl2LmFhLmNvbQ"
        },
        body: JSON.stringify({ "email": userEmail, "otp": otp }) // Use the stored email
    })
    .then(response => {
        if (response.status === 200) {
            // User is verified successfully
            errorMessage.style.display = "OTP Verified Successfully"
            errorMessage.style.display = "block"; // Hide the error message
            // You can redirect the user to the next step or perform other actions here
        } else {
            // Handle verification failure or other response statuses as needed
            errorMessage.textContent = "Invalid OTP. Please try again.";
            errorMessage.style.display = "block";
            errorMessage.style.color = "#"
        }
    })
    .catch(error => {
        console.error("Error:", error);
    });
}



// Initialize the phone input element
// var input = document.querySelector("#mobileNumberInput");
// var countryCodeInput = document.querySelector("#countryCodeInput");

// var iti = window.intlTelInput(input, {
//     separateDialCode: true,
//     initialCountry: "auto",
//     utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.3/js/utils.js",
// });

// Populate the country dropdown with all countries and their dialing codes
// var countryList = window.intlTelInputGlobals.getCountryData();

// countryList.forEach(function (country) {
//     var option = document.createElement("option");
//     option.value = "+" + country.dialCode;
//     option.text = "+" + country.dialCode + " (" + country.name + ")";
//     countryCodeInput.appendChild(option);
// });

// input.addEventListener("countrychange", function () {
//     var selectedCountry = iti.getSelectedCountryData();
//     countryCodeInput.value = "+" + selectedCountry.dialCode;
// });