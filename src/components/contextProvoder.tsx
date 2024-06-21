"use client";

import { createContext, useContext, useState } from "react";

interface GlobalContextType {
   clientData: Map<string, object>;
   setData: (key: string, value: object) => void;
   removeData: (key: string) => void;
}

// Create the context with the defined type
export const GlobalContext = createContext<GlobalContextType | null>(null);

function GlocalContextProvider({ children }: { children: React.ReactNode }) {
   const [clientData, setClientData] = useState(new Map<string, object>());

   const setData = (key: string, value: object) => {
      setClientData((prevData) => {
         const newData = new Map(prevData);
         newData.set(key, value);
         return newData;
      });
   };

   const removeData = (key: string) => {
      setClientData((prevData) => {
         const newData = new Map(prevData);
         newData.delete(key);
         return newData;
      });
   };

   return (
      <GlobalContext.Provider value={{ clientData, setData, removeData }}>
         {children}
      </GlobalContext.Provider>
   );
}

const useData = () => {
   return useContext(GlobalContext);
};

export { useData, GlocalContextProvider };
