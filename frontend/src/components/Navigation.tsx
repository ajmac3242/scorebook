/**
 * @file Navigation.tsx
 * @description Main navigation component using HeroUI.
 * Handles application routing, system connectivity status (online/offline), and sync status.
 */

import React, { useState, useEffect } from "react";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/navbar";
import {
  Dashboard as DashboardIcon,
  People as PlayersIcon,
  Groups as TeamsIcon,
  SportsBasketball as BasketballIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import { syncService } from "../utils/syncService";

/**
 * Navigation component that provides links and system status indicators.
 *
 * @returns {React.ReactElement}
 */
const Navigation: React.FC = () => {
  const location = useLocation();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      await syncService.pushUpdates();
      await syncService.pullAll();
    };

    window.addEventListener("online", handleOnline);

    const unsubscribe = syncService.subscribe((status) => {
      setIsSyncing(status);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      unsubscribe();
    };
  }, []);

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Teams", icon: <TeamsIcon />, path: "/teams" },
    { text: "Players", icon: <PlayersIcon />, path: "/players" },
    { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
  ];

  return (
    <Navbar
      isBordered
      position="sticky"
      className="bg-secondary/70 backdrop-blur-md"
    >
      <NavbarBrand>
        <p className="font-serif font-extrabold text-xl tracking-tight text-primary-900 hidden sm:block">
          Scorebook
        </p>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <NavbarItem key={item.path} isActive={isSelected}>
              <Link
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  isSelected
                    ? "bg-primary text-white font-bold"
                    : "text-primary-800 hover:bg-primary/10"
                }`}
              >
                {item.icon}
                <span className="font-serif text-sm">{item.text}</span>
              </Link>
            </NavbarItem>
          );
        })}
      </NavbarContent>

      <NavbarContent justify="end">
        {isSyncing && (
          <NavbarItem>
            <div className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-full shadow-lg animate-pulse">
              <BasketballIcon className="animate-spin text-sm" />
              <span className="text-xs font-bold hidden xs:block">SYNCING</span>
            </div>
          </NavbarItem>
        )}
      </NavbarContent>

      {/* Mobile Menu */}
      <NavbarContent className="sm:hidden flex gap-2" justify="center">
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <NavbarItem key={item.path}>
              <Link
                to={item.path}
                className={`p-2 rounded-full transition-all ${
                  isSelected ? "bg-primary text-white" : "text-primary-800"
                }`}
                aria-label={item.text}
              >
                {item.icon}
              </Link>
            </NavbarItem>
          );
        })}
      </NavbarContent>
    </Navbar>
  );
};

export default Navigation;
