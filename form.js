(() => {
  const SUPABASE_URL = "https://kiwuncwivajenqyinrqb.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_sxowccgePeTvJjwF68CIhQ_KMqiYTTw";

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

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      setFormStatus("Veuillez compléter les champs obligatoires.", "error");
      return;
    }

    const honeypotField = contactForm.querySelector('input[name="website"]');
    if (honeypotField && honeypotField.value.trim()) {
      setFormStatus("Envoi bloqué.", "error");
      return;
    }

    const formData = new FormData(contactForm);

    const selectedSubjects = Array.from(
      contactForm.querySelectorAll('input[name="subjects"]:checked')
    ).map((input) => input.value.trim()).filter(Boolean);
    const subjectOther = String(formData.get("subjectOther") || "").trim();

    if (!selectedSubjects.length && !subjectOther) {
      setFormStatus("Veuillez sélectionner au moins une matière.", "error");
      return;
    }

    const subjectString = [
      ...selectedSubjects,
      subjectOther ? `Autre: ${subjectOther}` : "",
    ].filter(Boolean).join(" | ");

    // Collect new fields
    const parentName = String(formData.get("parent_name") || "").trim();
    const schoolType = String(formData.get("school_type") || "").trim();
    const schoolName = String(formData.get("school_name") || "").trim();
    const niveau = String(formData.get("niveau") || "").trim();
    const year = String(formData.get("year") || "").trim();
    const formula = String(formData.get("formula") || "").trim();
    const messageRaw = String(formData.get("message") || "").trim();

    // Pack extra fields into message
    const messageParts = [
      parentName ? `Parent : ${parentName}` : null,
      schoolType ? `Établissement : ${schoolType}${schoolName ? " — " + schoolName : ""}` : schoolName ? `École : ${schoolName}` : null,
      year ? `Année : ${year}` : null,
      messageRaw ? `\nMessage : ${messageRaw}` : null,
    ].filter(Boolean);

    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      level: niveau,
      subject: subjectString,
      format: formula || null,
      urgency: null,
      message: messageParts.join("\n"),
      source: "website",
    };

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

      setFormStatus("Merci. Votre demande a bien été envoyée.", "success");
      contactForm.reset();
      const successUrl = contactForm.getAttribute("data-success-url") || "merci.html";
      setTimeout(() => {
        window.location.href = successUrl;
      }, 650);
    } catch (error) {
      console.error(error);
      setFormStatus(
        "Erreur d'envoi. Vérifiez votre connexion puis réessayez.",
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
