import React, { useId, useMemo } from 'react';
import { HoneypotPayload } from "../../types/api";
import useConfig from "../hooks/useConfig";
import "./Honeypot.scss";

interface HoneypotProps {
  payload?: HoneypotPayload;
}

export default function Honeypot({ payload: propPayload }: HoneypotProps) {
  const [config] = useConfig();
  const id = useId();
  
  const payload = useMemo(() => {
    if(!config.honeypot) return null;
    else return btoa(JSON.stringify({
      ips: [...(propPayload?.ips ?? []), config.honeypot?.ip],
      salt: (propPayload?.salt ?? "") + id,
    } satisfies HoneypotPayload));
  }, [config.honeypot, propPayload, id]);
  
  if(!payload) return null;
  else return <a className="Honeypot" href={`/honeypot/${payload}`} rel="nofollow" onClick={doNothing}>{id}</a>;
}

const doNothing = (ev: React.SyntheticEvent) => ev.preventDefault();
