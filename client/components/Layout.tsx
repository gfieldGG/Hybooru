import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useHistory } from "react-router";
import ReactForm from "../components/ReactForm";
import useMeasure from "../hooks/useMeasure";
import usePageData from "../hooks/usePageData";
import ErrorPage from "../routes/error/ErrorPage";
import useQuery from "../hooks/useQuery";
import { qsStringify } from "../helpers/utils";
import TagInput from "./TagInput";
import SSRCurtain from "./SSRCurtain";
import ThemeSwitch from "./ThemeSwitch";
import SettingsMenu from "./SettingsMenu";
import Logo from "./Logo";
import "./Layout.scss";

const stopPropagation = (ev: React.SyntheticEvent) => ev.stopPropagation();

function isTextInput(el: Element | null) {
  return el instanceof HTMLInputElement
      || el instanceof HTMLTextAreaElement
      || el instanceof HTMLSelectElement
      || (el instanceof HTMLElement && el.isContentEditable);
}

export interface LayoutProps {
  className?: string;
  sidebar?: React.ReactNode;
  children?: React.ReactNode;
  extraLink?: React.ReactNode;
  searchAction?: string;
  random?: boolean;
  simpleSettings?: boolean;
  dimmed?: boolean;
  plain?: boolean;
  noError?: boolean;
}

export default function Layout({ className, sidebar, children, extraLink, searchAction = "/posts", random = true, simpleSettings = false, dimmed = false, plain = false, noError = false }: LayoutProps) {
  const history = useHistory();
  const [query] = useQuery();
  const { ref, rect } = useMeasure();
  const { pageError, fetching } = usePageData(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const mobile = rect?.width && rect.width < 1000;
  
  const onSidebarButtonClick = useCallback((ev: React.MouseEvent) => {
    ev.preventDefault();
    openSidebar();
  }, [openSidebar]);
  
  const onOptionsButtonClick = useCallback((ev: React.MouseEvent) => {
    ev.preventDefault();
    setSettingsOpen(true);
  }, []);
  
  let domClassName = "Layout";
  if(mobile) domClassName += ` mobile`;
  if(plain) domClassName += ` plain`;
  if(className) domClassName += ` ${className}`;
  
  let dimmerActive = dimmed || false;
  if(mobile && sidebarOpen) dimmerActive = true;
  
  useEffect(() => {
    if(!dimmerActive) return;
    
    document.documentElement.classList.add("dimmed");
    return () => document.documentElement.classList.remove("dimmed");
  }, [dimmerActive]);
  
  useEffect(() => {
    if(!random) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if(ev.key !== "r" || ev.ctrlKey || ev.altKey || ev.shiftKey || ev.metaKey || isTextInput(document.activeElement)) return;
      history.push(`/random${qsStringify({ query: query || undefined })}`);
    };
    
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [random, query, history]);
  
  useEffect(() => {
    if(!settingsOpen) return;
    const onDocumentClick = () => setSettingsOpen(false);
    
    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, [settingsOpen]);
  
  if(pageError && !noError) return <ErrorPage error={pageError} />;
  
  if(plain) {
    return (
      <div className={domClassName}>
        {fetching && <div className="layoutProgress" />}
        {children}
      </div>
    );
  }
  
  return (
    <div className={domClassName} ref={ref}>
      <div className={`sidebar${sidebarOpen ? " open" : ""}${sidebar ? "" : " simple"}`}>
        <Logo />
        <div className="sidebarContent">{sidebar}</div>
      </div>
      <div className="header">
        {mobile && <a href="#" className="menuButton" onClick={onSidebarButtonClick}><img src="/static/menu_icon.svg" alt="menu" /></a>}
        <div className="links">
          <Link to="/">Main Page</Link>
          <Link to="/posts">All Posts</Link>
          <Link to="/tags">Tags</Link>
          <Link to="/random" rel="nofollow">Random</Link>
          <ThemeSwitch />
          {extraLink}
        </div>
        <ReactForm className="search" action={searchAction}>
          <TagInput name="query" placeholder="Search: flower sky 1girl" />
          <button hidden /> {/* Capture enter-submit */}
          <button>Search</button>
          {random && <button formAction="/random">Random</button>}
          <SSRCurtain><a className="settingsButton" href="#" onClick={onOptionsButtonClick}><img src="/static/cog.svg" alt="settings" /></a></SSRCurtain>
        </ReactForm>
        {fetching && <div className="layoutProgress" />}
        <SettingsMenu open={settingsOpen} simpleSettings={simpleSettings} onClick={stopPropagation} />
      </div>
      <div className={`contentDimmer${dimmerActive ? " active" : ""}`} onClick={closeSidebar} />
      <div className="content">
        {children}
      </div>
    </div>
  );
}
