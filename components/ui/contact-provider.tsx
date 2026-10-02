"use client";
import { createContext, useContext } from "react";
import type { Contact } from "@/data/contact";
const Contacts = createContext<Contact[]>([]);
export const useContacts = () => useContext(Contacts);
export function ContactProvider({
  contacts,
  children,
}: {
  contacts: Contact[];
  children: React.ReactNode;
}) {
  return <Contacts.Provider value={contacts}>{children}</Contacts.Provider>;
}
