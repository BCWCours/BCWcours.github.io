(() => {
  const SUPABASE_URL = "https://tfpctoufuokxridfkadc.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcGN0b3VmdW9reHJpZGZrYWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMzQzOTMsImV4cCI6MjA5MDcxMDM5M30._I2c2pkwL4Ydp4Uzmd1HP1YrcpPxU2KFqo3xslvZS9k";

  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");

  if (!contactForm || !formStatus) {
    return;
  }

  function setFormStatus(message, type = "info") {
    formStatus.textContent = message;
    formStatus.classList.remove("is-info", "is-success", "is-error");
    if (type === "success") {
      formStatus.classList.add("is-success");
    } else if (type === "error") {
      formStatus.classList.add("is-error");
    } else {
      formStatus.classList.add("is-info");
    }
  }

  // Limit subjects to 3 max
  contactForm.querySelectorAll('input[name="subjects"]').forEach((cb) => {
    cb.addEventListener("change", () => {
      const checked = Array.from(contactForm.querySelectorAll('input[name="subjects"]:checked'));
      if (checked.length > 3) {
        cb.checked = false;
      }
    });
  });

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);

    // --- Collect values ---
    const name = String(formData.get("name") || "").trim();
    const parentName = String(formData.get("parent_name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const schoolType = String(formData.get("school_type") || "").trim();
    const schoolName = String(formData.get("school_name") || "").trim();
    const level = String(formData.get("niveau") || "").trim();
    const activeYearEl = contactForm.querySelector('[name="school_year"]:not([disabled])');
    const schoolYear = activeYearEl ? String(activeYearEl.value || "").trim() : "";
    const formula = String(formData.get("formula") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const sourceChannelRaw = String(formData.get("source_channel") || "").trim();
    const sourceChannelOther = String(formData.get("source_channel_other") || "").trim();
    const sourceChannel = sourceChannelRaw === "Autre" && sourceChannelOther
      ? sourceChannelOther
      : sourceChannelRaw;

    const selectedSubjects = Array.from(
      contactForm.querySelectorAll('input[name="subjects"]:checked')
    ).map((input) => input.value.trim()).filter(Boolean);
    const otherSubject = String(formData.get("subjectOther") || "").trim();

    // --- Validation ---
    if (!name || !email || !phone || !level || !schoolName || !schoolType || !formula || !schoolYear || !sourceChannel) {
      contactForm.reportValidity();
      setFormStatus("Veuillez completer les champs obligatoires.", "error");
      return;
    }

    if (!selectedSubjects.length && !otherSubject) {
      setFormStatus("Veuillez selectionner au moins une matiere.", "error");
      return;
    }

    // Honeypot
    const honeypotField = contactForm.querySelector('input[name="website"]');
    if (honeypotField && honeypotField.value.trim()) {
      setFormStatus("Envoi bloque.", "error");
      return;
    }

    // --- Build payload ---
    const subjectsString = selectedSubjects.join(" | ");

    const payload = {
      name: name,
      parent_name: parentName || null,
      email: email,
      phone: phone,
      subjects: subjectsString || null,
      other_subject: otherSubject || null,
      school_type: schoolType,
      school_name: schoolName,
      level: level,
      school_year: schoolYear || null,
      format: formula,
      message: message || null,
      source_channel: sourceChannel,
      source: "website",
      status: "À contacter",
    };

    // --- Submit ---
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalLabel = submitButton ? submitButton.textContent : "";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Envoi en cours...";
      submitButton.setAttribute("aria-busy", "true");
    }
    setFormStatus("Envoi en cours...", "info");

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorDetails = "";
        try {
          const errorJson = await response.json();
          errorDetails = errorJson?.message || JSON.stringify(errorJson);
        } catch {
          errorDetails = await response.text();
        }
        throw new Error(`Supabase insert failed (${response.status}): ${errorDetails}`);
      }

      setFormStatus("Votre demande a bien ete envoyee ! Nous vous contactons sous 24h.", "success");
      contactForm.reset();
      contactForm.style.display = "none";
    } catch (error) {
      console.error(error);
      setFormStatus(
        "Erreur d'envoi. Verifiez votre connexion puis reessayez.",
        "error"
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
        submitButton.textContent = originalLabel;
      }
    }
  });
})();
