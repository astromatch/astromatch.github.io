// main.js
document.addEventListener('DOMContentLoaded', function () {
    // Your JavaScript code here
    
    function generateConfetti() {
        const result = document.getElementById('result');
        const confettiCount = 50;
        const colors = ['#f39c12', '#e74c3c', '#3498db', '#2ecc71'];

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
            confetti.style.animationDelay = `${Math.random() * 2}s`;
            result.appendChild(confetti);

            confetti.addEventListener('animationend', () => {
                result.removeChild(confetti);
            });
        }
    }

    const toggleButton = document.getElementById('toggle-mode');
    const modeIcon = document.getElementById('mode-icon');
    const formContainer = document.getElementById('form-container');
    toggleButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        formContainer.classList.toggle('dark-mode');
        if (modeIcon.classList.contains('fa-sun')) {
            modeIcon.classList.replace('fa-sun', 'fa-moon');
        } else {
            modeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    });

    document.getElementById('input-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        const input1 = document.getElementById('input1').value;
        const input2 = document.getElementById('input2').value;
        const input3 = document.getElementById('input3').value;
        const input4 = document.getElementById('input4').value;

        const data = {
            input1: parseInt(document.getElementById("input1").value),
            input2: parseInt(document.getElementById("input2").value),
            input3: parseInt(document.getElementById("input3").value),
            input4: parseInt(document.getElementById("input4").value),
        };

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        };

        try {
            const response = await fetch('http://ec2-15-206-93-175.ap-south-1.compute.amazonaws.com:8080/compatibility', options);
            if (!response.ok) {
                throw Error(response.status);
            }
            const result = await response.json();
            const compatibility = result.compatibility; // Access the compatibility field
            document.getElementById('result').innerHTML = `Compatibility: ${compatibility}`;
            generateConfetti();
        } catch (error) {
            console.log(error);
        }
    });
});
