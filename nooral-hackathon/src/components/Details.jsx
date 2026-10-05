import { useState } from "react";
import { EVENT } from "../config.js";

export default function Details({ slots, onRegister }) {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const eventDetailsTable = [
    { label: "Date", val: "1 November 2026" },
    { label: "Time", val: "9:00 AM – 6:00 PM" },
    { label: "Location", val: "Satara" },
    { label: "Team Size", val: "2–4 Members" },
    { label: "Registration Fee", val: `₹${slots.fee || 999} per Team` },
    { label: "Maximum Teams", val: `${slots.total || 30} Teams` },
  ];

  const highlights = [
    {
      title: "Real-World Problem Solving",
      desc: "Work on practical problem statements designed to challenge your technical and problem-solving skills.",
      icon: "⚡",
    },
    {
      title: "Build with Technology",
      desc: "Use programming, AI/ML, Generative AI, APIs, frameworks, and other permitted technologies to develop your solution.",
      icon: "💻",
    },
    {
      title: "Team Collaboration",
      desc: "Work in teams of 2–4 members, combining different skills and ideas to build an effective solution.",
      icon: "👥",
    },
    {
      title: "Industry Exposure",
      desc: "Experience a structured hackathon environment and understand how technology can be applied to real-world challenges.",
      icon: "🌐",
    },
    {
      title: "Showcase Your Skills",
      desc: "Present your solution to the jury and demonstrate your technical approach, implementation, and results.",
      icon: "🏆",
    },
    {
      title: "Opportunity with Nooral.ai",
      desc: "The winner team gets a chance to work with the Nooral.ai Team, providing an opportunity to further explore industry-level projects and collaboration.",
      icon: "🚀",
      featured: true,
    },
  ];

  const steps = [
    { num: "01", title: "Register Your Team", desc: "Create a team of 2–4 members and complete the registration process." },
    { num: "02", title: "Get the Challenge", desc: "The problem statement will be revealed to registered teams at the beginning of the hackathon." },
    { num: "03", title: "Build Your Solution", desc: "Understand the problem, plan your approach, develop your solution, and test it within the official hackathon duration." },
    { num: "04", title: "Present Your Project", desc: "Demonstrate your working solution and explain your approach, technology, implementation, and results to the jury." },
    { num: "05", title: "Evaluation & Results", desc: "Projects will be evaluated based on defined judging criteria, followed by the announcement of the results." },
  ];

  const techStack = [
    "Python & Programming",
    "Artificial Intelligence & Machine Learning",
    "Generative AI",
    "Natural Language Processing",
    "Computer Vision",
    "Web Development",
    "APIs & Integrations",
    "Open-Source Frameworks",
    "Databases",
    "Cloud & Deployment Technologies",
  ];

  const rules = [
    "Each team must have 2–4 members.",
    "Problem statements will be provided to teams on the hackathon day.",
    "The core solution must be developed during the official hackathon period.",
    "Plagiarism or substantially pre-built solutions are not permitted.",
    "Free AI tools may be used for brainstorming and idea generation, but not for development of the final solution.",
    "Participants must disclose any pre-existing code, third-party APIs, datasets, models, or services used in their solution.",
    "Standard libraries, frameworks, open-source tools, APIs, and documentation are permitted unless restricted.",
    "Participants are responsible for bringing their own laptops, required software, accounts, and development resources.",
    "Participants should have backup internet access available in case of connectivity issues.",
    "Teams must submit their solution within the specified submission deadline.",
    "All submitted work must comply with applicable licenses and third-party usage requirements.",
    "The jury's decision regarding project evaluation and results will be final.",
    "Nooral.ai reserves the right to address exceptional technical or organizational situations during the event.",
  ];

  const judgingCriteria = [
    { title: "Problem Understanding", desc: "How clearly the team understands the given problem and its requirements." },
    { title: "Innovation", desc: "Originality and creativity of the proposed approach." },
    { title: "Technical Implementation", desc: "Quality of the technical implementation, architecture, and use of appropriate technologies." },
    { title: "Functionality", desc: "How effectively the solution addresses the given problem and performs its intended functions." },
    { title: "Practicality", desc: "Potential usefulness, scalability, and applicability of the solution in a real-world context." },
    { title: "Presentation & Demo", desc: "Clarity of the explanation, demonstration, and ability to communicate the solution effectively." },
  ];

  const schedule = [
    { time: "09:00 AM", title: "Registration & Check-in" },
    { time: "09:30 AM", title: "Hackathon Introduction" },
    { time: "10:00 AM", title: "Problem Statements Revealed" },
    { time: "10:00 AM – 04:00 PM", title: "Development & Implementation" },
    { time: "04:00 PM – 05:30 PM", title: "Project Presentations & Demos" },
    { time: "05:30 PM – 06:00 PM", title: "Evaluation & Results" },
  ];

  const whyParticipate = [
    { title: "Build Something Real", desc: "Move beyond theoretical learning and develop a practical solution to a real-world challenge." },
    { title: "Strengthen Your Technical Skills", desc: "Apply your knowledge of programming, AI, ML, software development, and modern technologies." },
    { title: "Work as a Team", desc: "Learn how to collaborate, divide responsibilities, solve problems, and build under time constraints." },
    { title: "Showcase Your Talent", desc: "Present your project to a jury and demonstrate your technical and problem-solving abilities." },
    { title: "Gain Industry Exposure", desc: "Experience an industry-oriented hackathon environment and understand practical technology development." },
    { title: "Explore Opportunities with Nooral.ai", desc: "The winning team gets a chance to work with the Nooral.ai Team and explore further opportunities." },
  ];

  const faqs = [
    { q: "Can I participate individually?", a: "No. This hackathon is team-based. Each team must have 2–4 members." },
    { q: "When will we receive the problem statement?", a: "Problem statements will be provided on the hackathon day at the beginning of the event." },
    { q: "Can we use AI tools?", a: "Free AI tools can be used for brainstorming and idea generation, but they cannot be used for development of the final solution." },
    { q: "Can we use open-source libraries and frameworks?", a: "Yes. Standard libraries, frameworks, open-source tools, APIs, and documentation can be used unless specifically restricted." },
    { q: "Do we need to bring our own laptop?", a: "Yes. Participants are responsible for bringing their own laptops and required development resources." },
    { q: "Should we have backup internet?", a: "Yes. Participants should keep a backup internet connection available to avoid disruption due to connectivity issues." },
    { q: "What is the registration fee?", a: `The registration fee is ₹${slots.fee || 999} per team.` },
    { q: "How many teams can participate?", a: `A maximum of ${slots.total || 30} teams will be accepted. Registration will close once the limit is reached.` },
  ];

  return (
    <div id="details" className="hack-details-wrapper">
      {/* 1. ABOUT & QUICK SPECS */}
      <section className="hack-section about-section">
        <div className="section-container">
          <span className="sec-eyebrow">OVERVIEW</span>
          <h2 className="sec-title">About the Hackathon</h2>
          <p className="sec-desc">
            <b>Nooral.AI presents HackVerse Hackathon</b> — a one-day, team-based technology challenge designed to bring together students, developers, and technology enthusiasts to solve real-world problems using AI and modern software technologies.
          </p>
          <p className="sec-desc">
            Participants will receive a problem statement on the hackathon day and will work collaboratively to design, develop, and present a practical solution within the given time. The hackathon provides an opportunity to apply technical knowledge, explore innovative ideas, and experience an industry-oriented development environment.
          </p>

          <div className="specs-card">
            <h3>📌 Event Details</h3>
            <div className="specs-grid">
              {eventDetailsTable.map((item) => (
                <div className="spec-item" key={item.label}>
                  <span className="spec-label">{item.label}</span>
                  <span className="spec-val">{item.val}</span>
                </div>
              ))}
            </div>
            <p className="specs-note">⚡ Note: Registration will close once the maximum number of teams is reached.</p>
          </div>
        </div>
      </section>

      {/* 2. HIGHLIGHTS */}
      <section className="hack-section highlights-section">
        <div className="section-container">
          <span className="sec-eyebrow">WHY US</span>
          <h2 className="sec-title">Hackathon Highlights</h2>
          <div className="highlights-grid">
            {highlights.map((h) => (
              <div className={`highlight-card ${h.featured ? "featured" : ""}`} key={h.title}>
                <div className="h-icon">{h.icon}</div>
                <h3>{h.title}</h3>
                <p>{h.desc}</p>
                {h.featured && <span className="featured-badge">🌟 Special Opportunity</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="hack-section steps-section">
        <div className="section-container">
          <span className="sec-eyebrow">WORKFLOW</span>
          <h2 className="sec-title">How It Works</h2>
          <div className="steps-flow">
            {steps.map((s) => (
              <div className="step-card" key={s.num}>
                <span className="step-badge">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PROBLEM STATEMENTS & TECH */}
      <section className="hack-section tech-section">
        <div className="section-container">
          <span className="sec-eyebrow">CHALLENGES & STACK</span>
          <h2 className="sec-title">Problem Statements & Technology</h2>
          <div className="tech-box">
            <h3>Problem Statements</h3>
            <p>
              The problem statements will be provided on the hackathon day. Teams will have the opportunity to understand the challenge, discuss their approach, and develop a solution during the official hackathon period.
            </p>
            <p>
              The challenges are designed to encourage practical problem solving, technical implementation, creativity, and effective use of technology.
            </p>
          </div>

          <div className="tech-box">
            <h3>Technology & Tools</h3>
            <p>
              Participants can use relevant technologies to develop their solutions, subject to the hackathon rules. Standard libraries, frameworks, open-source tools, APIs, and technical documentation may be used unless specifically restricted.
            </p>
            <div className="tech-pills">
              {techStack.map((tech) => (
                <span className="tech-pill" key={tech}>
                  ⚡ {tech}
                </span>
              ))}
            </div>

            <div className="ai-policy-box">
              <h4>🤖 AI Tool Policy</h4>
              <p>
                Free AI tools may be used for brainstorming, research, and idea generation. However, AI tools must not be used to develop the final solution or generate the core implementation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. RULES & SUBMISSIONS */}
      <section className="hack-section rules-section">
        <div className="section-container">
          <span className="sec-eyebrow">COMPLIANCE</span>
          <h2 className="sec-title">Rules & Guidelines</h2>
          <div className="rules-grid">
            <div className="rules-list-box">
              <h3>Rules & Guidelines</h3>
              <ul className="rules-list">
                {rules.map((rule, idx) => (
                  <li key={idx}>
                    <span className="rule-bullet">✔</span> {rule}
                  </li>
                ))}
              </ul>
            </div>

            <div className="submission-box">
              <h3>📦 Submission Requirements</h3>
              <p>Each team will be required to submit and present their completed solution before the submission deadline. Submissions may include:</p>
              <ul className="sub-list">
                <li>Working project or prototype</li>
                <li>Source code / repository</li>
                <li>Project description</li>
                <li>Technology stack used</li>
                <li>Implementation approach</li>
                <li>Demo or presentation</li>
                <li>Details of third-party APIs, datasets, models, or services used</li>
              </ul>
              <p className="sub-note">Teams should ensure that their solution is functional and ready for demonstration during evaluation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. JUDGING CRITERIA */}
      <section className="hack-section criteria-section">
        <div className="section-container">
          <span className="sec-eyebrow">EVALUATION</span>
          <h2 className="sec-title">Judging Criteria</h2>
          <div className="criteria-grid">
            {judgingCriteria.map((c) => (
              <div className="criteria-card" key={c.title}>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. SCHEDULE */}
      <section className="hack-section schedule-section">
        <div className="section-container">
          <span className="sec-eyebrow">TIMELINE</span>
          <h2 className="sec-title">Hackathon Schedule</h2>
          <div className="schedule-timeline">
            {schedule.map((slot) => (
              <div className="schedule-item" key={slot.time}>
                <span className="sch-time">{slot.time}</span>
                <span className="sch-title">{slot.title}</span>
              </div>
            ))}
          </div>
          <p className="sch-note">* The schedule may be adjusted by the organizers if required.</p>
        </div>
      </section>

      {/* 8. WHY PARTICIPATE */}
      <section className="hack-section why-section">
        <div className="section-container">
          <span className="sec-eyebrow">BENEFITS</span>
          <h2 className="sec-title">Why Participate?</h2>
          <div className="why-grid">
            {whyParticipate.map((w) => (
              <div className="why-card" key={w.title}>
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION */}
      <section className="hack-section faq-section">
        <div className="section-container">
          <span className="sec-eyebrow">HELP</span>
          <h2 className="sec-title">Frequently Asked Questions</h2>
          <div className="faq-accordion">
            {faqs.map((faq, idx) => (
              <div className={`faq-item ${openFaq === idx ? "open" : ""}`} key={idx} onClick={() => toggleFaq(idx)}>
                <div className="faq-question">
                  <span>{faq.q}</span>
                  <span className="faq-toggle">{openFaq === idx ? "−" : "+"}</span>
                </div>
                {openFaq === idx && <div className="faq-answer">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. READY TO BUILD / FINAL CTA */}
      <section className="hack-section cta-section">
        <div className="section-container cta-inner">
          <h2>Ready to Build?</h2>
          <p>
            Bring your team. Take on the challenge. Build your solution.
            <br />
            Join <b>Nooral.AI presents HackVerse Hackathon</b> and turn your ideas into working technology.
          </p>
          {slots.remaining !== null && slots.remaining <= 0 ? (
            <div className="closed-info-box">
              <span className="closed-title">Registrations are closed.</span>
              <span className="closed-sub">For more information, please contact Nooral.AI.</span>
            </div>
          ) : (
            <button className="btn-primary btn-large" onClick={onRegister}>
              Register Your Team →
            </button>
          )}
          <div className="contact-details">
            <p>
              For more details:{" "}
              <a href={`mailto:${EVENT.contactEmail}`} className="contact-link">
                {EVENT.contactEmail}
              </a>
            </p>
            <p>
              Contact:{" "}
              <a href="tel:8485819119" className="contact-link">
                8485819119
              </a>{" "}
              |{" "}
              <a href="tel:9130159556" className="contact-link">
                9130159556
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
