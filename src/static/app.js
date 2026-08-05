document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML in a panel with bulleted list
        let participantsHtml = "";
        if (details.participants && details.participants.length) {
          participantsHtml = `
            <div class="participants-panel">
              <h5 class="participants-title">Participants:</h5>
              <ul class="participants-bulleted">
                ${details.participants.map(p => `<li><span class="participant-name">${p}</span><button class="participant-remove" data-activity="${name}" data-email="${p}" aria-label="Remove ${p}">&times;</button></li>`).join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHtml = `
            <div class="participants-panel">
              <h5 class="participants-title">Participants:</h5>
              <p class="participants-none"><em>None yet</em></p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Attach delegated click handler for remove buttons
      activitiesList.addEventListener("click", async (event) => {
        const btn = event.target.closest && event.target.closest('.participant-remove');
        if (!btn) return;

        const email = btn.dataset.email;
        const activity = btn.dataset.activity;

        if (!email || !activity) return;

        // Optimistic UI: disable the button
        btn.disabled = true;

        try {
          const resp = await fetch(`/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`, {
            method: 'DELETE',
          });

          const data = await resp.json().catch(() => ({}));

          if (resp.ok) {
            // remove the participant element
            const li = btn.closest('li');
            if (li) li.remove();
            // show message
            messageDiv.textContent = data.message || `Removed ${email}`;
            messageDiv.className = 'success';
            messageDiv.classList.remove('hidden');
            setTimeout(() => messageDiv.classList.add('hidden'), 3000);
          } else {
            btn.disabled = false;
            messageDiv.textContent = data.detail || 'Failed to remove participant';
            messageDiv.className = 'error';
            messageDiv.classList.remove('hidden');
            setTimeout(() => messageDiv.classList.add('hidden'), 5000);
          }
        } catch (err) {
          btn.disabled = false;
          messageDiv.textContent = 'Network error while removing participant';
          messageDiv.className = 'error';
          messageDiv.classList.remove('hidden');
          console.error('Error removing participant:', err);
        }
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
