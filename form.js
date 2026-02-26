(() => {
  const SUPABASE_URL = "https://kiwuncwivajenqyinrqb.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_sxowccgePeTvJjwF68CIhQ_KMqiYTTw";

  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");

  if (!contactForm || !formStatus) {
    return;
  }

  function messageForCurrentLanguage(key, fallback) {
    const fromI18n = window.BCWI18n?.messageForCurrentLanguage?.(key);
    return typeof fromI18n === "string" && fromI18n.trim() ? fromI18n : fallback;
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

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      setFormStatus(messageForCurrentLanguage("form.invalid", "Veuillez compléter les champs obligatoires."), "error");
      return;
    }

    const honeypotField = contactForm.querySelector('input[name="website"]');
    if (honeypotField && honeypotField.value.trim()) {
      setFormStatus(messageForCurrentLanguage("form.honeypot", "Envoi bloqué."), "error");
      return;
    }

    const formData = new FormData(contactForm);
    const selectedSubjects = Array.from(
      contactForm.querySelectorAll('input[name="subjects"]:checked')
    ).map((input) => input.value.trim()).filter(Boolean);
    const subjectOther = String(formData.get("subjectOther") || "").trim();
    if (!selectedSubjects.length && !subjectOther) {
      setFormStatus(
        messageForCurrentLanguage("form.subjectRequired", "Veuillez sélectionner au moins une matière."),
        "error"
      );
      return;
    }

    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      level: String(formData.get("level") || "").trim(),
      format: String(formData.get("format") || "").trim(),
      urgency: String(formData.get("urgency") || "").trim(),
      message: String(formData.get("message") || "").trim(),
      subject: [
        ...selectedSubjects,
        subjectOther ? `Autre: ${subjectOther}` : "",
      ].filter(Boolean).join(" | "),
    };

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalButtonLabel = submitButton ? submitButton.textContent : "";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = messageForCurrentLanguage("form.sending", "Envoi en cours...");
      submitButton.setAttribute("aria-busy", "true");
    }
    setFormStatus(messageForCurrentLanguage("form.sending", "Envoi en cours..."), "info");

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          level: payload.level,
          subject: payload.subject,
          format: payload.format || null,
          urgency: payload.urgency || null,
          message: payload.message,
          source: "website",
        }),
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

      setFormStatus(messageForCurrentLanguage("form.success", "Merci. Votre demande a bien été envoyée."), "success");
      contactForm.reset();
      const successUrl = contactForm.getAttribute("data-success-url") || "merci.html";
      setTimeout(() => {
        window.location.href = successUrl;
      }, 650);
    } catch (error) {
      console.error(error);
      const errorText = String(error?.message || error || "");
      if (errorText.includes("leads_message_check")) {
        setFormStatus(messageForCurrentLanguage("form.messageTooShort", "Le message doit contenir au moins 10 caractères."), "error");
      } else {
        setFormStatus(
          messageForCurrentLanguage(
            "form.fallback",
            "Erreur d'envoi. Vérifiez la configuration Supabase (table/policy) puis réessayez."
          ),
          "error"
        );
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
        submitButton.textContent = originalButtonLabel;
      }
    }
  });
})();
