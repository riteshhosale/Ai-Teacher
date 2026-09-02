import { useEffect } from "react";

const DID_SCRIPT_SELECTOR = 'script[data-name="did-agent"]';
const DID_SCRIPT_URL = "https://agent.d-id.com/v2/index.js";

function DIDAgent() {
  useEffect(() => {
    const clientKey = import.meta.env.VITE_DID_CLIENT_KEY;
    const agentId = import.meta.env.VITE_DID_AGENT_ID;

    if (!clientKey || !clientKey.trim()) {
      console.error(
        "D-ID Agent: VITE_DID_CLIENT_KEY is missing."
      );
      return undefined;
    }

    if (!agentId || !agentId.trim()) {
      console.error(
        "D-ID Agent: VITE_DID_AGENT_ID is missing."
      );
      return undefined;
    }

    const existingScript = document.querySelector(
      DID_SCRIPT_SELECTOR
    );

    if (existingScript) {
      return undefined;
    }

    const script = document.createElement("script");

    script.type = "module";
    script.src = DID_SCRIPT_URL;

    script.dataset.clientKey = clientKey.trim();
    script.dataset.agentId = agentId.trim();
    script.dataset.mode = "fabio";
    script.dataset.name = "did-agent";
    script.dataset.monitor = "true";
    script.dataset.orientation = "horizontal";
    script.dataset.position = "right";
    script.dataset.openMode = "expanded";

    const handleLoad = () => {
      console.info("D-ID Agent loaded successfully.");
    };

    const handleError = () => {
      console.error(
        "D-ID Agent failed to load."
      );
    };

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    document.body.appendChild(script);

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);

      // Only remove the exact script created by this component.
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null;
}

export default DIDAgent;