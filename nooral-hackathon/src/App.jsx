import { useCallback, useEffect, useState } from "react";
import Hero from "./components/Hero.jsx";
import Details from "./components/Details.jsx";
import RegistrationModal from "./components/RegistrationModal.jsx";
import { api } from "./api.js";
import { EVENT } from "./config.js";

export default function App() {
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState({
    total: EVENT.fallbackTotalSlots,
    remaining: null,
    fee: EVENT.fallbackFee,
  });

  const refreshSlots = useCallback(() => {
    api("/api/slots").then(setSlots).catch(() => {});
  }, []);

  useEffect(() => {
    refreshSlots();
    const t = setInterval(refreshSlots, 30000);
    return () => clearInterval(t);
  }, [refreshSlots]);

  return (
    <>
      <main>
        <Hero slots={slots} onRegister={() => setOpen(true)} />
        <Details slots={slots} onRegister={() => setOpen(true)} />
      </main>
      <footer className="footer">© {new Date().getFullYear()} Nooral.AI · {EVENT.name}</footer>
      {open && <RegistrationModal fee={slots.fee} onClose={() => setOpen(false)} onPaid={refreshSlots} />}
    </>
  );
}
