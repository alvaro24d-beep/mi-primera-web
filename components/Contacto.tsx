"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useTitleReveal } from "@/hooks/useTitleReveal";
import { useGlassPanels } from "@/hooks/useGlassPanels";
import { useTextScramble } from "@/hooks/useTextScramble";

const BUDGET_VALUES = [
  "< 500€",
  "500€ – 1.000€",
  "1.000€ – 2.500€",
  "2.500€ – 5.000€",
  "5.000€ – 10.000€",
  "10.000€ – 15.000€",
  "15.000€ – 20.000€",
  "20.000€ – 25.000€",
  "+ 25.000€",
];

const NEGOCIO_OPTS = [
  { val: "startup", icon: "🚀" },
  { val: "pyme", icon: "🏢" },
  { val: "autonomo", icon: "🤝" },
  { val: "ecommerce", icon: "🛒" },
  { val: "empresa", icon: "🏛️" },
  { val: "otro", icon: "💡" },
];

const SERVICIO_OPTS = [
  { val: "web", icon: "🌐" },
  { val: "agente", icon: "🤖" },
  { val: "automatizacion", icon: "⚡" },
  { val: "seo", icon: "🔍" },
  { val: "app", icon: "📱" },
  { val: "no-lo-se", icon: "🤷" },
];

const TOTAL_STEPS = 5;

export default function Contacto() {
  const t = useTranslations("contacto");
  const tNeg = useTranslations("contacto.neg");
  const tSrv = useTranslations("contacto.srv");
  const titleRef = useTitleReveal<HTMLHeadingElement>();
  const sectionRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(1);

  // Volumetric fluid-glass behind the multi-step form card (flat variant of
  // the Servicios identity) — the DOM card keeps layout/content only.
  useGlassPanels(sectionRef, ".nxr-ms-card", "#100f16", []);

  // Scramble entrance on the section paragraph (the Intro-paragraph effect,
  // sitewide per request).
  useTextScramble(sectionRef, ".nxr-contacto-desc");
  const [negocio, setNegocio] = useState<string | null>(null);
  const [servicios, setServicios] = useState<string[]>([]);
  // Índice 4 = "5.000€ – 10.000€": el punto MEDIO exacto de los 9 tramos —
  // la barra arranca centrada (petición V16.79) en vez de anclada abajo.
  const [budgetIndex, setBudgetIndex] = useState(4);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const showError = (n: number, msg: string) => {
    setErrors((e) => ({ ...e, [n]: msg }));
    setTimeout(() => setErrors((e) => ({ ...e, [n]: "" })), 3000);
  };

  const goTo = (n: number) => setStep(n);

  const toggleServicio = (val: string) => {
    setServicios((s) => (s.includes(val) ? s.filter((v) => v !== val) : [...s, val]));
  };

  const next1 = () => {
    if (!negocio) return showError(1, t("errOpcion"));
    goTo(2);
  };
  const next2 = () => {
    if (!servicios.length) return showError(2, t("errUna"));
    goTo(3);
  };
  const next3 = () => goTo(4);
  const next4 = () => {
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!nombre.trim() || !mensaje.trim() || !okEmail) {
      return showError(4, t("errCampos"));
    }
    goTo(5);
  };

  // Se traducen igual que los chips: lo que va al resumen —y al correo— debe
  // leerse en el idioma en el que el visitante rellenó el formulario.
  const negocioLabel = negocio ? tNeg(negocio) : "";
  const serviciosLabel = SERVICIO_OPTS.filter((o) => servicios.includes(o.val))
    .map((o) => tSrv(o.val))
    .join(", ");

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          negocio: negocioLabel,
          servicio: serviciosLabel,
          budget: BUDGET_VALUES[budgetIndex],
          mensaje: mensaje.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        showError(5, t("errEnvio"));
        setSubmitting(false);
      }
    } catch {
      showError(5, t("errEnvio"));
      setSubmitting(false);
    }
  };

  const budgetPct = (budgetIndex / (BUDGET_VALUES.length - 1)) * 100;

  return (
    <section id="nxr-contacto" ref={sectionRef}>
      <div className="nxr-contacto-inner">
        <div className="nxr-contacto-grid">
          <div className="nxr-contacto-left nxr-reveal">
            <div className="nxr-contacto-textblock">
              <div>
                <h2 className="nxr-section-h2" ref={titleRef}>
                  {t("titulo1")}
                  <br />
                  <span className="nxr-gradient-text-lime">{t("titulo2")}</span>
                </h2>
              </div>
              <p className="nxr-contacto-desc">
                {t("parrafo")}
              </p>
              <div className="nxr-contacto-items">
                <div className="nxr-contacto-item">
                  <div className="nxr-contacto-item-icon" style={{ background: "rgba(239,61,13,.15)", color: "var(--c-red)" }}>
                    <svg viewBox="0 0 24 24">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
                    </svg>
                  </div>
                  <div>
                    <div className="nxr-contacto-item-title">{t("item1t")}</div>
                    <div className="nxr-contacto-item-desc">{t("item1d")}</div>
                  </div>
                </div>
                <div className="nxr-contacto-item">
                  <div className="nxr-contacto-item-icon" style={{ background: "rgba(168,240,74,.12)", color: "var(--c-lime)" }}>
                    <svg viewBox="0 0 24 24">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <div className="nxr-contacto-item-title">{t("item2t")}</div>
                    <div className="nxr-contacto-item-desc">{t("item2d")}</div>
                  </div>
                </div>
                <div className="nxr-contacto-item">
                  <div className="nxr-contacto-item-icon" style={{ background: "rgba(255,157,125,.12)", color: "var(--c-salmon)" }}>
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4l3 3" />
                    </svg>
                  </div>
                  <div>
                    <div className="nxr-contacto-item-title">{t("item3t")}</div>
                    <div className="nxr-contacto-item-desc">{t("item3d")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="nxr-ms-wrap nxr-reveal nxr-reveal-delay-2">
            {!submitted && (
              <div className="nxr-ms-progress">
                {Array.from({ length: TOTAL_STEPS }, (_, idx) => {
                  const n = idx + 1;
                  const cls = n < step ? "done" : n === step ? "active" : "";
                  return (
                    <div key={n} style={{ display: "contents" }}>
                      <div className={`nxr-ms-step-dot ${cls}`}>
                        <span>{n}</span>
                      </div>
                      {n < TOTAL_STEPS && (
                        <div className="nxr-ms-line">
                          <div className={`nxr-ms-line-fill${n < step ? " filled" : ""}`}></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="nxr-ms-card">
              {submitted ? (
                <div className="nxr-ms-success show">
                  <div className="nxr-ms-success-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <h3>{t("enviadoTitulo")}</h3>
                  <p>{t("enviadoTexto")}</p>
                </div>
              ) : (
                <>
                  {step === 1 && (
                    <div className="nxr-ms-panel active">
                      <div>
                        <p className="nxr-ms-label">{t("paso", { n: 1, total: TOTAL_STEPS })}</p>
                        <h2 className="nxr-ms-question">{t("q1")}</h2>
                      </div>
                      <div className="nxr-ms-chips">
                        {NEGOCIO_OPTS.map((o) => (
                          <button
                            key={o.val}
                            className={`nxr-ms-chip${negocio === o.val ? " selected" : ""}`}
                            onClick={() => setNegocio(o.val)}
                          >
                            <span className="nxr-ms-chip-icon">{o.icon}</span> {tNeg(o.val)}
                          </button>
                        ))}
                      </div>
                      <p className={`nxr-ms-error${errors[1] ? " show" : ""}`}>{errors[1]}</p>
                      <div className="nxr-ms-nav">
                        <span></span>
                        <button className="nxr-ms-next" onClick={next1}>
                          {t("siguiente")}{" "}
                          <svg viewBox="0 0 24 24">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="nxr-ms-panel active">
                      <div>
                        <p className="nxr-ms-label">{t("paso", { n: 2, total: TOTAL_STEPS })}</p>
                        <h2 className="nxr-ms-question">{t("q2")}</h2>
                        <p className="nxr-ms-sub">Puedes elegir más de uno.</p>
                      </div>
                      <div className="nxr-ms-chips">
                        {SERVICIO_OPTS.map((o) => (
                          <button
                            key={o.val}
                            className={`nxr-ms-chip${servicios.includes(o.val) ? " selected" : ""}`}
                            onClick={() => toggleServicio(o.val)}
                          >
                            <span className="nxr-ms-chip-icon">{o.icon}</span> {tSrv(o.val)}
                          </button>
                        ))}
                      </div>
                      <p className={`nxr-ms-error${errors[2] ? " show" : ""}`}>{errors[2]}</p>
                      <div className="nxr-ms-nav">
                        <button className="nxr-ms-back" onClick={() => goTo(1)}>
                          <svg viewBox="0 0 24 24">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                          </svg>{" "}
                          Atrás
                        </button>
                        <button className="nxr-ms-next" onClick={next2}>
                          {t("siguiente")}{" "}
                          <svg viewBox="0 0 24 24">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="nxr-ms-panel active">
                      <div>
                        <p className="nxr-ms-label">{t("paso", { n: 3, total: TOTAL_STEPS })}</p>
                        <h2 className="nxr-ms-question">{t("q3")}</h2>
                        <p className="nxr-ms-sub">Sin compromiso, nos ayuda a orientar la propuesta.</p>
                      </div>
                      <div>
                        <div className="nxr-ms-budget-val">
                          <span>{BUDGET_VALUES[budgetIndex]}</span>
                        </div>
                        <div className="nxr-ms-range-wrap">
                          <div className="nxr-ms-range-track">
                            <div className="nxr-ms-range-fill" style={{ width: `${budgetPct}%` }}></div>
                          </div>
                          <input
                            type="range"
                            className="nxr-ms-range"
                            min={0}
                            max={BUDGET_VALUES.length - 1}
                            value={budgetIndex}
                            step={1}
                            onChange={(e) => setBudgetIndex(Number(e.target.value))}
                          />
                        </div>
                        <div className="nxr-ms-budget-labels">
                          <span>500€</span>
                          <span>10.000€</span>
                          <span>+25.000€</span>
                        </div>
                      </div>
                      <div className="nxr-ms-nav">
                        <button className="nxr-ms-back" onClick={() => goTo(2)}>
                          <svg viewBox="0 0 24 24">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                          </svg>{" "}
                          Atrás
                        </button>
                        <button className="nxr-ms-next" onClick={next3}>
                          {t("siguiente")}{" "}
                          <svg viewBox="0 0 24 24">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="nxr-ms-panel active">
                      <div>
                        <p className="nxr-ms-label">{t("paso", { n: 4, total: TOTAL_STEPS })}</p>
                        <h2 className="nxr-ms-question">{t("q4")}</h2>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <input
                          className="nxr-ms-input"
                          type="text"
                          placeholder={t("phNombre")}
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                        />
                        <input
                          className="nxr-ms-input"
                          type="email"
                          placeholder={t("phEmail")}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <textarea
                          className="nxr-ms-textarea"
                          placeholder={t("phMensaje")}
                          value={mensaje}
                          onChange={(e) => setMensaje(e.target.value)}
                        />
                      </div>
                      <p className={`nxr-ms-error${errors[4] ? " show" : ""}`}>{errors[4]}</p>
                      <div className="nxr-ms-nav">
                        <button className="nxr-ms-back" onClick={() => goTo(3)}>
                          <svg viewBox="0 0 24 24">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                          </svg>{" "}
                          Atrás
                        </button>
                        <button className="nxr-ms-next" onClick={next4}>
                          Revisar{" "}
                          <svg viewBox="0 0 24 24">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="nxr-ms-panel active">
                      <div>
                        <p className="nxr-ms-label">{t("paso", { n: 5, total: TOTAL_STEPS })}</p>
                        <h2 className="nxr-ms-question">{t("q5")}</h2>
                      </div>
                      <div className="nxr-ms-summary">
                        {[
                          [t("resNegocio"), negocioLabel],
                          [t("resNecesita"), serviciosLabel],
                          [t("resPresupuesto"), BUDGET_VALUES[budgetIndex]],
                          [t("resNombre"), nombre],
                          [t("resEmail"), email],
                          [t("resProyecto"), mensaje],
                        ].map(([label, val]) => (
                          <div className="nxr-ms-summary-row" key={label}>
                            <span className="nxr-ms-summary-label">{label}</span>
                            <span className="nxr-ms-summary-val">{val}</span>
                          </div>
                        ))}
                      </div>
                      <p className={`nxr-ms-error${errors[5] ? " show" : ""}`}>{errors[5]}</p>
                      <div className="nxr-ms-nav">
                        <button className="nxr-ms-back" onClick={() => goTo(4)}>
                          <svg viewBox="0 0 24 24">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                          </svg>{" "}
                          Editar
                        </button>
                        <button className="nxr-ms-next" onClick={submit} disabled={submitting}>
                          {submitting ? t("enviando") : t("enviar")}{" "}
                          <svg viewBox="0 0 24 24">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
