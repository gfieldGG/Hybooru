import React, { useEffect, useMemo } from 'react';
import { useLocation, useParams } from "wouter";
import { HoneypotPayload } from "../../../types/api";
import Layout from "../../components/Layout";
import useConfig from "../../hooks/useConfig";
import Honeypot from "../../components/Honeypot";
import "./HoneypotPage.scss";

export default function HoneypotPage() {
  const [config] = useConfig();
  const [, navigate] = useLocation();
  const { payload } = useParams<{ payload: string }>();
  
  const payloadData = useMemo(() => {
    try {
      return JSON.parse(atob(payload)) as HoneypotPayload;
    } catch(err: any) {
      void err;
      return null;
    }
  }, [payload]);
  
  useEffect(() => {
    if(!config.honeypot || !payloadData) navigate("/");
  }, [config.honeypot, payloadData, navigate]);
  
  if(!config.honeypot || !payloadData) return null;
  else return (
    <Layout className="HoneypotPage">
      <div className="wrap">
        {new Array(10).fill(null).map((_, i) => <Honeypot key={i} payload={payloadData} />)}
        <h2>SEEKING DATA, THE DUMB SCRAPPER FIND INSTEAD ITS PROFOUND ABSENCE</h2>
        {new Array(10).fill(null).map((_, i) => <Honeypot key={i} payload={payloadData} />)}
      </div>
    </Layout>
  );
}
