import { useEffect } from "react";

function DIDAgent() {
  useEffect(() => {
    const existingScript = document.querySelector(
      'script[data-name="did-agent"]'
    );

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");

    script.type = "module";
    script.src = "https://agent.d-id.com/v2/index.js";

    script.setAttribute(
      "data-client-key",
      import.meta.env.VITE_DID_CLIENT_KEY
    );

    script.setAttribute(
      "data-agent-id",
      import.meta.env.VITE_DID_AGENT_ID
    );

    script.setAttribute("data-mode", "fabio");
    script.setAttribute("data-name", "did-agent");
    script.setAttribute("data-monitor", "true");
    script.setAttribute("data-orientation", "horizontal");
    script.setAttribute("data-position", "right");
    script.setAttribute("data-open-mode", "expanded");

    document.body.appendChild(script);

    return () => {
      const didScript = document.querySelector(
        'script[data-name="did-agent"]'
      );

      if (didScript) {
        didScript.remove();
      }
    };
  }, []);

  return null;
}

export default DIDAgent;